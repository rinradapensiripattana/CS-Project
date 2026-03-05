import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import db from "../config/mysql.js";

// =======================
// Add Doctor (SQL Version)
// =======================
const addDoctor = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { name, email, password, degree, experience, about } = req.body;

    if (!req.file) {
      return res.json({ success: false, message: "Image not uploaded" });
    }

    await connection.beginTransaction();

    const imagePath = `/uploads/${req.file.filename}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert Users
    const [userResult] = await connection.execute(
      `INSERT INTO Users (name, email, password, role, image)
         VALUES (?, ?, ?, 'doctor', ?)`,
      [name, email, hashedPassword, imagePath],
    );

    const userId = userResult.insertId;

    // Insert Doctor (แก้ลำดับตรงนี้)
    await connection.execute(
      `INSERT INTO Doctor (user_id, degree, available, experience, about)
         VALUES (?, ?, 1, ?, ?)`,
      [userId, degree, experience, about],
    );

    await connection.commit();

    res.json({ success: true, message: "Doctor Added Successfully" });
  } catch (error) {
    await connection.rollback();
    res.json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// =======================
// Admin Login (SQL)
// =======================

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.execute(
      "SELECT * FROM Users WHERE email = ? AND role = 'admin'",
      [email],
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const admin = rows[0];

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.user_id, role: admin.role },
      process.env.JWT_SECRET,
    );

    res.json({ success: true, token });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// =======================
// Get All Doctors
// =======================
const allDoctors = async (req, res) => {
  try {
    const [doctors] = await db.execute(`
            SELECT 
                d.doctor_id,
                d.degree,
                d.experience,
                d.about,
                d.available,
                u.name,
                u.email,
                u.image
            FROM Doctor d
            JOIN Users u ON d.user_id = u.user_id
        `);

    res.json({ success: true, doctors });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// =======================
// Get All Appointments
// =======================
const appointmentsAdmin = async (req, res) => {
  try {
    const [appointments] = await db.execute(`
        SELECT 
          a.appointment_id,
          a.appointment_date,
          a.appointment_time,
          a.status,
  
          pu.name AS patient_name,
          pu.image AS patient_image,
  
          du.name AS doctor_name,
          du.image AS doctor_image
  
        FROM Appointment a
  
        LEFT JOIN Patient p ON a.patient_id = p.patient_id
        LEFT JOIN Users pu ON p.user_id = pu.user_id
  
        LEFT JOIN Doctor d ON a.doctor_id = d.doctor_id
        LEFT JOIN Users du ON d.user_id = du.user_id
  
        ORDER BY a.appointment_date ASC, a.appointment_time ASC
      `);

    res.json({ success: true, appointments });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// =======================
// Cancel Appointment
// =======================

const appointmentCancel = async (req, res) => {
  try {
    const { id } = req.body; // 🔥 รับชื่อ id

    await db.execute(
      "UPDATE Appointment SET status = 'cancelled' WHERE appointment_id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Appointment Cancelled",
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// Dashboard Data
// =======================
const adminDashboard = async (req, res) => {
  try {
    const [doctorCount] = await db.execute(
      "SELECT COUNT(*) as total FROM Doctor",
    );

    const [patientCount] = await db.execute(
      "SELECT COUNT(*) as total FROM Users WHERE role = 'patient'",
    );

    const [appointmentCount] = await db.execute(
      "SELECT COUNT(*) as total FROM Appointment",
    );

    // 🔥 JOIN ถูกต้องตามโครงสร้างจริงของเธอ
    const [latestAppointments] = await db.execute(`
            SELECT 
                a.appointment_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                u.name AS doctor_name,
                u.image AS doctor_image
            FROM Appointment a
            JOIN Doctor d ON a.doctor_id = d.doctor_id
            JOIN Users u ON d.user_id = u.user_id
            ORDER BY a.appointment_id DESC
            LIMIT 5
        `);

    const dashData = {
      doctors: doctorCount[0].total,
      patients: patientCount[0].total,
      appointments: appointmentCount[0].total,
      latestAppointments,
    };

    res.json({ success: true, dashData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const changeAvailability = async (req, res) => {
  try {
    const { doctorId } = req.body;

    await db.execute(
      "UPDATE Doctor SET available = NOT available WHERE doctor_id = ?",
      [doctorId],
    );

    res.json({
      success: true,
      message: "Availability Updated",
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// Get All Patients
// =======================
const getAllPatients = async (req, res) => {
  try {
    const [patients] = await db.execute(`
            SELECT
                p.patient_id,
                u.name,
                u.email
            FROM Patient p
            JOIN Users u ON p.user_id = u.user_id
            ORDER BY u.name ASC
        `);
    res.json({ success: true, patients });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// =======================
// Create Appointment by Admin
// =======================
const createAppointment = async (req, res) => {
  try {
    const { doctor_id, patient_id, appointment_date, appointment_time } =
      req.body;

    if (!doctor_id || !patient_id || !appointment_date || !appointment_time) {
      return res.json({ success: false, message: "All fields are required." });
    }

    // Ensure time format is HH:mm:ss
    const formattedTime =
      appointment_time.length === 5
        ? `${appointment_time}:00`
        : appointment_time;

    const [existing] = await db.execute(
      `SELECT * FROM Appointment 
             WHERE doctor_id = ? 
             AND appointment_date = ? 
             AND appointment_time = ?
             AND status != 'cancelled'`,
      [doctor_id, appointment_date, formattedTime],
    );

    if (existing.length > 0) {
      return res.json({
        success: false,
        message: "This time slot is already booked for the selected doctor.",
      });
    }

    await db.execute(
      `INSERT INTO Appointment (doctor_id, patient_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, 'confirmed')`,
      [doctor_id, patient_id, appointment_date, formattedTime],
    );

    res.json({ success: true, message: "Appointment created successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  changeAvailability,
  getAllPatients,
  createAppointment,
};
