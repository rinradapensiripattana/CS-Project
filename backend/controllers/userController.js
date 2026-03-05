import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/mysql.js";
import { v2 as cloudinary } from "cloudinary";

// =====================================================
// 🔹 REGISTER USER
// =====================================================
const registerUser = async (req, res) => {
  try {
    let { name, email, password, dob, gender, phone, id_number } = req.body;

    gender = gender?.toLowerCase();
    const allowedGenders = ["male", "female", "other"];

    if (!allowedGenders.includes(gender)) {
      return res.json({ success: false, message: "Invalid gender value" });
    }

    const [existingEmail] = await db.query(
      "SELECT * FROM Users WHERE email = ?",
      [email],
    );

    const [existingId] = await db.query(
      "SELECT * FROM Patient WHERE id_number = ?",
      [id_number],
    );

    const errorMessages = [];
    if (existingEmail.length > 0) {
      errorMessages.push("Email");
    }
    if (existingId.length > 0) {
      errorMessages.push("ID Number");
    }

    if (errorMessages.length > 0) {
      return res.json({
        success: false,
        message: `${errorMessages.join(" and ")} already exists`,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await db.query(
      "INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, "patient"],
    );

    const userId = userResult.insertId;

    await db.query(
      `INSERT INTO Patient 
       (user_id, phone, id_number, date_of_birth, gender)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, phone || null, id_number || null, dob, gender],
    );

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ success: true, token });
  } catch (error) {
    console.log("Register Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================================================
// 🔹 LOGIN USER
// =====================================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM Users WHERE email = ? AND role = 'patient'",
      [email],
    );

    if (!rows.length) {
      return res.json({ success: false, message: "User not found" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ success: true, token });
  } catch (error) {
    console.log("Login Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================================================
// 🔹 GET PROFILE
// =====================================================
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await db.query(
      `
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.image,
        p.phone,
        p.gender,
        DATE_FORMAT(p.date_of_birth, '%Y-%m-%d') AS dob
      FROM Users u
      LEFT JOIN Patient p ON u.user_id = p.user_id
      WHERE u.user_id = ?
    `,
      [userId],
    );

    if (!rows.length) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      userData: rows[0],
    });
  } catch (error) {
    console.log("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// 🔹 UPDATE PROFILE
// =====================================================
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    let { name, email, phone, gender } = req.body;

    let imagePath = null;
    if (req.file) {
      const imageUpload = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
      });
      imagePath = imageUpload.secure_url;
    }

    await db.query(
      `UPDATE Users
       SET name = ?,
           email = ?,
           image = COALESCE(?, image)
       WHERE user_id = ?`,
      [name, email, imagePath, userId],
    );

    await db.query(
      `UPDATE Patient
       SET phone = ?,
           gender = ?
       WHERE user_id = ?`,
      [phone, gender, userId],
    );

    return res.json({ success: true });
  } catch (error) {
    console.log("UPDATE ERROR:", error);
    return res.status(500).json({ success: false });
  }
};

// =====================================================
// 🔹 LIST USER APPOINTMENTS
// =====================================================
// =====================================================
// 🔹 LIST USER APPOINTMENTS (FINAL FIX)
// =====================================================
const listAppointment = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await db.query(
      `
        SELECT 
          a.appointment_id,
          DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
          TIME_FORMAT(a.appointment_time, '%H:%i') AS appointment_time,
          a.status,
          d.doctor_id,
          u.name AS doctor_name,
          u.image AS doctor_image
        FROM Appointment a
        JOIN Doctor d ON a.doctor_id = d.doctor_id
        JOIN Users u ON d.user_id = u.user_id
        JOIN Patient p ON a.patient_id = p.patient_id
        WHERE p.user_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `,
      [userId],
    );

    res.json({
      success: true,
      appointments: rows,
    });
  } catch (error) {
    console.log("List Appointment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// 🔹 CANCEL APPOINTMENT
// =====================================================
const cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appointment_id } = req.body;

    await db.query(
      `
      UPDATE Appointment a
      JOIN Patient p ON a.patient_id = p.patient_id
      SET a.status = 'cancelled'
      WHERE a.appointment_id = ? AND p.user_id = ?
    `,
      [appointment_id, userId],
    );

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log("Cancel Appointment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// 🔹 BOOK APPOINTMENT (แก้ date format แล้ว)
// =====================================================
// =====================================================
// 🔹 BOOK APPOINTMENT (FINAL FIX)
// =====================================================
const bookAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time } = req.body;
    const userId = req.user.userId;

    // Check if doctor is available
    const [doctorStatus] = await db.query(
      "SELECT available FROM Doctor WHERE doctor_id = ?",
      [doctor_id],
    );

    if (!doctorStatus.length || doctorStatus[0].available !== 1) {
      return res.json({
        success: false,
        message: "Doctor is not available for booking",
      });
    }

    const [patient] = await db.query(
      "SELECT patient_id FROM Patient WHERE user_id = ?",
      [userId],
    );

    if (!patient.length) {
      return res.json({ success: false, message: "Patient not found" });
    }

    const patientId = patient[0].patient_id;

    // 🔥 Check if patient already has an appointment at this time
    const [patientConflict] = await db.query(
      `SELECT * FROM Appointment 
       WHERE patient_id = ? 
       AND appointment_date = ? 
       AND appointment_time = ?
       AND status != 'cancelled'`,
      [patientId, appointment_date, appointment_time],
    );

    if (patientConflict.length > 0) {
      return res.json({
        success: false,
        message: "You already have an appointment at this time",
      });
    }

    // 🔥 กันจองซ้ำ
    const [existing] = await db.query(
      `SELECT * FROM Appointment 
         WHERE doctor_id = ? 
         AND appointment_date = ? 
         AND appointment_time = ?`,
      [doctor_id, appointment_date, appointment_time],
    );

    if (existing.length > 0) {
      if (existing[0].status === "cancelled") {
        await db.query(
          `UPDATE Appointment SET patient_id = ?, status = 'ongoing' WHERE appointment_id = ?`,
          [patientId, existing[0].appointment_id],
        );
        return res.json({
          success: true,
          message: "Appointment booked successfully",
        });
      } else {
        return res.json({
          success: false,
          message: "This time slot is already booked",
        });
      }
    }

    await db.query(
      `INSERT INTO Appointment 
         (doctor_id, patient_id, appointment_date, appointment_time, status)
         VALUES (?, ?, ?, ?, 'ongoing')`,
      [doctor_id, patientId, appointment_date, appointment_time],
    );

    res.json({ success: true, message: "Appointment booked successfully" });
  } catch (error) {
    console.log("Book Appointment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================================================
// 🔹 GET DOCTOR APPOINTMENTS (FIXED)
// =====================================================
const getDoctorAppointments = async (req, res) => {
  try {
    const { docId } = req.params;

    const [rows] = await db.query(
      `
        SELECT 
          DATE_FORMAT(appointment_date, '%Y-%m-%d') AS appointment_date,
          TIME_FORMAT(appointment_time, '%H:%i:%s') AS appointment_time,
          status
        FROM Appointment
        WHERE doctor_id = ?
        AND appointment_date >= CURDATE()
        AND status != 'cancelled'
        `,
      [docId],
    );

    res.json({
      success: true,
      appointments: rows,
    });
  } catch (error) {
    console.log("Get Doctor Appointments Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// 🔹 GET MEDICAL HISTORY
// =====================================================
const getMedicalHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await db.query(
      `
        SELECT 
          mr.record_id,
          mr.symptom,
          mr.treatment,
          DATE_FORMAT(mr.record_date, '%Y-%m-%d') AS record_date,
          TIME_FORMAT(a.appointment_time, '%H:%i') AS appointment_time,
          u.name AS doctor_name,
          u.image AS doctor_image
        FROM Medical_Record mr
        JOIN Appointment a ON mr.appointment_id = a.appointment_id
        JOIN Doctor d ON a.doctor_id = d.doctor_id
        JOIN Users u ON d.user_id = u.user_id
        JOIN Patient p ON a.patient_id = p.patient_id
        WHERE p.user_id = ?
        ORDER BY mr.record_date DESC
      `,
      [userId],
    );

    res.json({ success: true, history: rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  listAppointment,
  cancelAppointment,
  bookAppointment,
  getDoctorAppointments,
  getMedicalHistory,
};
