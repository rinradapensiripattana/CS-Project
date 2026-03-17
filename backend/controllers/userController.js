import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/mysql.js";
import { v2 as cloudinary } from "cloudinary";
import * as line from "@line/bot-sdk";

const lineClient = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

// ===============================
// FORMAT DATE
// ===============================

const formatThaiDate = (date) => {
  const d = new Date(date);

  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (time) => {
  return time.substring(0, 5);
};

// =====================================================
// 🔹 REGISTER USER
// =====================================================

const registerUser = async (req, res) => {
  try {
    let { name, email, password, dob, gender, phone, id_number } = req.body;

    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "Please fill in all required fields",
      });
    }

    if (gender) {
      gender = gender.toLowerCase();
      const allowedGenders = ["male", "female", "other"];
      if (!allowedGenders.includes(gender)) {
        return res.json({ success: false, message: "Invalid gender value" });
      }
    } else {
      gender = null;
    }

    const [existingEmail] = await db.query(
      "SELECT * FROM Users WHERE email = ?",
      [email],
    );

    const errorMessages = [];
    if (existingEmail.length > 0) errorMessages.push("Email");

    let existingId = [];
    if (id_number) {
      [existingId] = await db.query(
        "SELECT * FROM Patient WHERE id_number = ?",
        [id_number],
      );
      if (existingId.length > 0) errorMessages.push("ID Number");
    }

    if (errorMessages.length > 0) {
      return res.json({
        success: false,
        message: `${errorMessages.join(" and ")} already exists`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await db.query(
      "INSERT INTO Users (name,email,password,role) VALUES (?,?,?,?)",
      [name, email, hashedPassword, "patient"],
    );

    const userId = userResult.insertId;

    await db.query(
      `INSERT INTO Patient
       (user_id,phone,id_number,date_of_birth,gender)
       VALUES (?,?,?,?,?)`,
      [userId, phone || null, id_number || null, dob || null, gender],
    );

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ success: true, token });
  } catch (error) {
    console.log("Register Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// 🔹 LOGIN USER
// =====================================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM Users WHERE email=? AND role='patient'",
      [email],
    );

    if (!rows.length) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ success: true, token });
  } catch (error) {
    console.log("Login Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// 🔹 GET PROFILE
// =====================================================

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        u.user_id,
        u.name,
        u.email,
        u.image,
        p.phone,
        p.gender,
        DATE_FORMAT(p.date_of_birth,'%Y-%m-%d') AS dob
      FROM Users u
      LEFT JOIN Patient p ON u.user_id = p.user_id
      WHERE u.user_id = ?
      `,
      [userId],
    );

    if (!rows.length) {
      return res.json({
        success: false,
        message: "User not found",
      });
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
    const userId = req.user.id;

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
       SET name=?,
           email=?,
           image=COALESCE(?,image)
       WHERE user_id=?`,
      [name, email, imagePath, userId],
    );

    await db.query(
      `UPDATE Patient
       SET phone=?, gender=?
       WHERE user_id=?`,
      [phone, gender, userId],
    );

    res.json({ success: true });
  } catch (error) {
    console.log("UPDATE ERROR:", error);

    res.status(500).json({ success: false });
  }
};

// =====================================================
// 🔹 LIST USER APPOINTMENTS
// =====================================================

const listAppointment = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        a.appointment_id,
        DATE_FORMAT(a.appointment_date,'%Y-%m-%d') AS appointment_date,
        TIME_FORMAT(a.appointment_time,'%H:%i') AS appointment_time,
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
    const userId = req.user.id;
    const { appointment_id } = req.body;

    // ดึงข้อมูลนัดก่อนยกเลิก
    const [rows] = await db.query(
      `
      SELECT 
        a.appointment_date,
        a.appointment_time,
        u.name AS doctor_name,
        p.line_user_id
      FROM Appointment a
      JOIN Doctor d ON a.doctor_id = d.doctor_id
      JOIN Users u ON d.user_id = u.user_id
      JOIN Patient p ON a.patient_id = p.patient_id
      WHERE a.appointment_id = ?
      `,
      [appointment_id],
    );

    if (!rows.length) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    const data = rows[0];
    const formattedDate = formatThaiDate(data.appointment_date);
    const formattedTime = formatTime(data.appointment_time);

    // ยกเลิกนัด
    await db.query(
      `
      UPDATE Appointment a
      JOIN Patient p ON a.patient_id = p.patient_id
      SET a.status = 'cancelled'
      WHERE a.appointment_id = ? AND p.user_id = ?
      `,
      [appointment_id, userId],
    );

    // =====================
    // 🔔 LINE NOTIFICATION
    // =====================

    if (data.line_user_id) {
      await lineClient.pushMessage(data.line_user_id, {
        type: "flex",
        altText: "การนัดหมายถูกยกเลิก",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "❌ การนัดหมายถูกยกเลิก",
                weight: "bold",
                size: "xl",
              },
              {
                type: "separator",
                margin: "md",
              },
              {
                type: "box",
                layout: "vertical",
                margin: "lg",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: `👨‍⚕️ แพทย์: ${data.doctor_name}`,
                  },
                  {
                    type: "text",
                    text: `📆 วันที่: ${formattedDate}`,
                  },
                  {
                    type: "text",
                    text: `⏰ เวลา: ${formattedTime}`,
                  },
                ],
              },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "separator",
              },
              {
                type: "text",
                text: "🏥 HelloDoctor Clinic",
                align: "center",
                size: "sm",
                color: "#888888",
                margin: "md",
              },
            ],
          },
        },
      });
    }

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
// 🔹 BOOK APPOINTMENT + LINE NOTIFICATION
// =====================================================

const bookAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time } = req.body;
    const userId = req.user.id;

    const [doctorStatus] = await db.query(
      "SELECT available FROM Doctor WHERE doctor_id=?",
      [doctor_id],
    );

    if (!doctorStatus.length || doctorStatus[0].available !== 1) {
      return res.json({
        success: false,
        message: "Doctor is not available for booking",
      });
    }

    const [patient] = await db.query(
      "SELECT patient_id,line_user_id FROM Patient WHERE user_id=?",
      [userId],
    );

    if (!patient.length) {
      return res.json({
        success: false,
        message: "Patient not found",
      });
    }

    const patientId = patient[0].patient_id;
    const lineUserId = patient[0].line_user_id;

    const [patientConflict] = await db.query(
      `SELECT * FROM Appointment
       WHERE patient_id=?
       AND appointment_date=?
       AND appointment_time=?
       AND status!='cancelled'`,
      [patientId, appointment_date, appointment_time],
    );

    if (patientConflict.length > 0) {
      return res.json({
        success: false,
        message: "You already have an appointment at this time",
      });
    }

    const [existing] = await db.query(
      `SELECT * FROM Appointment
       WHERE doctor_id=?
       AND appointment_date=?
       AND appointment_time=?`,
      [doctor_id, appointment_date, appointment_time],
    );

    if (existing.length > 0) {
      if (existing[0].status === "cancelled") {
        await db.query(
          `UPDATE Appointment
           SET patient_id=?, status='confirmed'
           WHERE appointment_id=?`,
          [patientId, existing[0].appointment_id],
        );
      } else {
        return res.json({
          success: false,
          message: "This time slot is already booked",
        });
      }
    } else {
      await db.query(
        `INSERT INTO Appointment
         (doctor_id,patient_id,appointment_date,appointment_time,status)
         VALUES (?,?,?,?, 'confirmed')`,
        [doctor_id, patientId, appointment_date, appointment_time],
      );
    }

    // =============================
    // 🔔 LINE NOTIFICATION
    // =============================

    if (lineUserId) {
      const [doctor] = await db.query(
        `
        SELECT u.name
        FROM Doctor d
        JOIN Users u ON d.user_id = u.user_id
        WHERE d.doctor_id = ?
      `,
        [doctor_id],
      );

      const doctorName = doctor[0]?.name || "Doctor";

      await lineClient.pushMessage(lineUserId, {
        type: "flex",
        altText: "การนัดหมายสำเร็จ",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "📅 การนัดหมายสำเร็จ",
                weight: "bold",
                size: "xl",
              },
              {
                type: "separator",
                margin: "md",
              },
              {
                type: "text",
                text: `👨‍⚕️ แพทย์: ${doctorName}`,
                margin: "lg",
              },
              {
                type: "text",
                text: `📆 วันที่: ${formatThaiDate(appointment_date)}`,
              },
              {
                type: "text",
                text: `⏰ เวลา: ${formatTime(appointment_time)}`,
              },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "separator",
              },
              {
                type: "text",
                text: "🏥 HelloDoctor Clinic",
                align: "center",
                size: "sm",
                color: "#888888",
                margin: "md",
              },
            ],
          },
        },
      });
    }

    res.json({
      success: true,
      message: "Appointment booked successfully",
    });
  } catch (error) {
    console.log("Book Appointment Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// 🔹 GET DOCTOR APPOINTMENTS
// =====================================================

const getDoctorAppointments = async (req, res) => {
  try {
    const { docId } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        DATE_FORMAT(appointment_date,'%Y-%m-%d') AS appointment_date,
        TIME_FORMAT(appointment_time,'%H:%i:%s') AS appointment_time,
        status
      FROM Appointment
      WHERE doctor_id=?
      AND appointment_date >= CURDATE()
      AND status!='cancelled'
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
    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        mr.record_id,
        mr.symptom,
        mr.treatment,
        DATE_FORMAT(mr.record_date,'%Y-%m-%d') AS record_date,
        TIME_FORMAT(a.appointment_time,'%H:%i') AS appointment_time,
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

    res.json({
      success: true,
      history: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// 🔹 CHANGE PASSWORD
// =====================================================

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // 🔸 เช็คว่ากรอกครบไหม
    if (!currentPassword || !newPassword) {
      return res.json({
        success: false,
        message: "Please fill all fields",
      });
    }

    // 🔸 ดึง user
    const [rows] = await db.query(
      "SELECT password FROM Users WHERE user_id = ?",
      [userId]
    );

    if (!rows.length) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0];

    // 🔸 เช็ค password เดิม
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // 🔸 hash password ใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 🔸 update
    await db.query(
      "UPDATE Users SET password = ? WHERE user_id = ?",
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    console.log("Change Password Error:", error);

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
  changePassword
};
