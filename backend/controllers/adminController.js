import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import db from "../config/mysql.js";
import * as line from "@line/bot-sdk";

const lineClient = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

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

    // Upload image to Cloudinary
    const imageUpload = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "image",
    });
    const imageUrl = imageUpload.secure_url;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert Users
    const [userResult] = await connection.execute(
      `INSERT INTO Users (name, email, password, role, image)
         VALUES (?, ?, ?, 'doctor', ?)`,
      [name, email, hashedPassword, imageUrl],
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
          p.phone AS patient_phone,
          p.gender,
          p.date_of_birth,
  
          du.name AS doctor_name,
          du.image AS doctor_image
  
        FROM Appointment a
  
        LEFT JOIN Patient p ON a.patient_id = p.patient_id
        LEFT JOIN Users pu ON p.user_id = pu.user_id
  
        LEFT JOIN Doctor d ON a.doctor_id = d.doctor_id
        LEFT JOIN Users du ON d.user_id = du.user_id
  
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
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
    const { id } = req.body;

    // ดึงข้อมูลการนัด
    const [rows] = await db.execute(
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
      [id],
    );

    if (!rows.length) {
      return res.json({
        success: false,
        message: "Appointment not found",
      });
    }

    const data = rows[0];

    const formattedDate = new Date(data.appointment_date).toLocaleDateString(
      "th-TH",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    const formattedTime = data.appointment_time.slice(0, 5);

    // update status
    await db.execute(
      "UPDATE Appointment SET status = 'cancelled' WHERE appointment_id = ?",
      [id],
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
                text: "❌ การนัดหมายถูกยกเลิกโดยคลินิก",
                weight: "bold",
                //size:"xl"
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
                u.image AS doctor_image,
                p.gender,
                p.date_of_birth,
                pu.name AS patient_name
            FROM Appointment a
            JOIN Doctor d ON a.doctor_id = d.doctor_id
            JOIN Users u ON d.user_id = u.user_id
            LEFT JOIN Patient p ON a.patient_id = p.patient_id
            LEFT JOIN Users pu ON p.user_id = pu.user_id
            ORDER BY a.appointment_id DESC
        `);

    // 🔥 ข้อมูลเพศ (Gender Distribution)
    const [genderData] = await db.execute(`
        SELECT gender, COUNT(*) as count 
        FROM Patient 
        GROUP BY gender
    `);

    // 🔥 ข้อมูลสำหรับกราฟแท่ง (Last 7 Days)
    const [appointmentsGraph] = await db.execute(`
        SELECT 
            DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as date, 
            u.name as doctor_name,
            a.status,
            COUNT(*) as count 
        FROM Appointment a
        JOIN Doctor d ON a.doctor_id = d.doctor_id
        JOIN Users u ON d.user_id = u.user_id
        GROUP BY date, doctor_name, a.status
        ORDER BY date ASC
    `);

    const dashData = {
      doctors: doctorCount[0].total,
      patients: patientCount[0].total,
      appointments: appointmentCount[0].total,
      latestAppointments,
      genderData,
      appointmentsGraph,
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
      return res.json({
        success: false,
        message: "All fields are required.",
      });
    }

    // =========================
    // FORMAT TIME
    // =========================

    const formattedTime =
      appointment_time.length === 5
        ? `${appointment_time}:00`
        : appointment_time;

    // =========================
    // CHECK DOCTOR AVAILABLE
    // =========================

    const [doctorStatus] = await db.execute(
      "SELECT available FROM Doctor WHERE doctor_id = ?",
      [doctor_id],
    );

    if (!doctorStatus.length || doctorStatus[0].available !== 1) {
      return res.json({
        success: false,
        message: "Selected doctor is not available",
      });
    }

    // =========================
    // CHECK PATIENT CONFLICT
    // =========================

    const [patientConflict] = await db.execute(
      `SELECT * FROM Appointment 
       WHERE patient_id = ?
       AND appointment_date = ?
       AND appointment_time = ?
       AND status != 'cancelled'`,
      [patient_id, appointment_date, formattedTime],
    );

    if (patientConflict.length > 0) {
      return res.json({
        success: false,
        message: "The patient already has an appointment at this time",
      });
    }

    // =========================
    // CHECK DOCTOR SLOT
    // =========================

    const [existing] = await db.execute(
      `SELECT * FROM Appointment 
       WHERE doctor_id = ?
       AND appointment_date = ?
       AND appointment_time = ?`,
      [doctor_id, appointment_date, formattedTime],
    );

    if (existing.length > 0) {
      // 🔹 reuse slot ถ้าเคย cancel
      if (existing[0].status === "cancelled") {
        await db.execute(
          `UPDATE Appointment
           SET patient_id = ?, status = 'confirmed'
           WHERE appointment_id = ?`,
          [patient_id, existing[0].appointment_id],
        );
      } else {
        return res.json({
          success: false,
          message: "This time slot is already booked for the selected doctor.",
        });
      }
    } else {
      // =========================
      // INSERT NEW APPOINTMENT
      // =========================

      await db.execute(
        `INSERT INTO Appointment 
         (doctor_id, patient_id, appointment_date, appointment_time, status)
         VALUES (?, ?, ?, ?, 'confirmed')`,
        [doctor_id, patient_id, appointment_date, formattedTime],
      );
    }

    // =========================
    // 🔔 LINE NOTIFICATION
    // =========================

    const [patient] = await db.execute(
      "SELECT line_user_id FROM Patient WHERE patient_id = ?",
      [patient_id],
    );

    const lineUserId = patient[0]?.line_user_id;

    if (lineUserId) {
      const [doctor] = await db.execute(
        `SELECT u.name
         FROM Doctor d
         JOIN Users u ON d.user_id = u.user_id
         WHERE d.doctor_id = ?`,
        [doctor_id],
      );

      const doctorName = doctor[0]?.name || "Doctor";

      // =========================
      // FORMAT DATE + TIME (THAI)
      // =========================

      const formattedDate = new Date(appointment_date).toLocaleDateString(
        "th-TH",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      const formattedTimeDisplay = formattedTime.substring(0, 5);

      await lineClient.pushMessage(lineUserId, {
        type: "flex",
        altText: "มีการนัดหมายใหม่",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "📅 มีการนัดหมายใหม่",
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
                text: `📆 วันที่: ${formattedDate}`,
              },
              {
                type: "text",
                text: `⏰ เวลา: ${formattedTimeDisplay}`,
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

    // =========================
    // SUCCESS RESPONSE
    // =========================

    res.json({
      success: true,
      message: "Appointment created successfully",
    });
  } catch (error) {
    console.log("Create Appointment Error:", error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const getBookedTimes = async (req, res) => {
  try {

    const { date, doctorId, patientId } = req.query;

    const [appointments] = await db.query(
      `SELECT TIME_FORMAT(appointment_time,'%H:%i') as time
       FROM Appointment
       WHERE appointment_date = ?
       AND (doctor_id = ? OR patient_id = ?)
       AND status != 'cancelled'`,
      [date, doctorId, patientId]
    );

    const times = appointments.map(a => a.time);

    res.json({
      success: true,
      times
    });

  } catch (error) {

    console.log(error);

    res.json({
      success:false,
      message:error.message
    });

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
  getBookedTimes
};
