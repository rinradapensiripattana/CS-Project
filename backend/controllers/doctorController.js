import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import db from "../config/mysql.js";
import { v2 as cloudinary } from "cloudinary";
import * as line from "@line/bot-sdk";

const lineClient = new line.Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

// ==========================
// FORMAT DATE + TIME (THAI)
// ==========================
const formatDateTime = (date, time) => {

  const formattedDate = new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const formattedTime = time ? time.slice(0, 5) : "-";

  return {
    date: formattedDate,
    time: formattedTime
  };
};

// API for doctor Login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM Users WHERE email = ? AND role = 'doctor'",
      [email],
    );

    if (!rows.length) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({ success: true, token });
  } catch (error) {
    console.log("Doctor Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
  try {
    // ดึง doctor_id จากตาราง Doctor โดยใช้ user_id
    const userId = req.doctor.id;

    const [doctor] = await db.query(
      "SELECT doctor_id FROM Doctor WHERE user_id = ?",
      [userId],
    );

    if (!doctor.length) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    const doctorId = doctor[0].doctor_id;
    //console.log("Doctor ID from token:", doctorId)

    const [rows] = await db.query(
      `
            SELECT 
            a.appointment_id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            u.name,
            u.image,
            p.date_of_birth,
            m.symptom AS symptoms,
            m.treatment
          FROM Appointment a
          JOIN Patient p ON a.patient_id = p.patient_id
          JOIN Users u ON p.user_id = u.user_id
          LEFT JOIN Medical_Record m ON a.appointment_id = m.appointment_id
          WHERE a.doctor_id = ?
          ORDER BY a.appointment_date DESC
        `,
      [doctorId],
    );

    res.json({
      success: true,
      appointments: rows,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// API to mark appointment completed for doctor panel
// API to complete appointment + save medical record
const appointmentComplete = async (req, res) => {
  try {

    const userId = req.doctor.id;

    const {
      appointment_id,
      symptoms,
      treatment,
      followup_date,
      followup_time
    } = req.body;

    // =========================
    // 1️⃣ หา doctor_id
    // =========================

    const [doctor] = await db.query(
      "SELECT doctor_id FROM Doctor WHERE user_id = ?",
      [userId]
    );

    if (!doctor.length) {
      return res.json({
        success: false,
        message: "Doctor not found",
      });
    }

    const doctorId = doctor[0].doctor_id;

    // =========================
    // 2️⃣ เช็ค appointment
    // =========================

    const [check] = await db.query(
      "SELECT * FROM Appointment WHERE appointment_id = ? AND doctor_id = ?",
      [appointment_id, doctorId]
    );

    if (!check.length) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const appointment = check[0];

    // =========================
    // 3️⃣ save medical record
    // =========================

    const [record] = await db.query(
      "SELECT * FROM Medical_Record WHERE appointment_id = ?",
      [appointment_id]
    );

    if (record.length > 0) {

      await db.query(
        `UPDATE Medical_Record
         SET symptom = ?, treatment = ?, record_date = NOW()
         WHERE appointment_id = ?`,
        [symptoms, treatment, appointment_id]
      );

    } else {

      await db.query(
        `INSERT INTO Medical_Record
         (appointment_id, symptom, treatment, record_date)
         VALUES (?, ?, ?, NOW())`,
        [appointment_id, symptoms, treatment]
      );

    }

    // =========================
    // 4️⃣ update status completed
    // =========================

    await db.query(
      "UPDATE Appointment SET status = 'completed' WHERE appointment_id = ?",
      [appointment_id]
    );

    // =========================
    // 🔔 LINE RESULT NOTIFICATION
    // =========================

    // ดึง line user
    const [patient] = await db.query(
      "SELECT line_user_id FROM Patient WHERE patient_id = ?",
      [appointment.patient_id]
    );

    const lineUserId = patient[0]?.line_user_id;

    if (lineUserId) {

      const [doctorName] = await db.query(
        `SELECT u.name
     FROM Doctor d
     JOIN Users u ON d.user_id = u.user_id
     WHERE d.doctor_id = ?`,
        [appointment.doctor_id]
      );

      const name = doctorName[0]?.name || "Doctor";

      const { date: formattedDate, time: formattedTime } =
        formatDateTime(appointment.appointment_date, appointment.appointment_time);

      await lineClient.pushMessage(lineUserId, {
        type: "flex",
        altText: "ผลการรักษา",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            contents: [
              {
                type: "text",
                text: "📋 ผลการรักษา",
                weight: "bold",
                size: "xl"
              },
              {
                type: "separator"
              },
              {
                type: "text",
                text: `👨‍⚕️ แพทย์: ${name}`
              },
              {
                type: "text",
                text: `📅 วันที่: ${formattedDate}`
              },
              {
                type: "text",
                text: `⏰ เวลา: ${formattedTime}`
              },
              {
                type: "separator",
                margin: "md"
              },
              {
                type: "text",
                text: `🩺 อาการ: ${symptoms || "-"}`,
                wrap: true
              },
              {
                type: "text",
                text: `💊 วิธีการรักษา: ${treatment || "-"}`,
                wrap: true
              }
            ]
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "separator"
              },
              {
                type: "text",
                text: "🏥 HelloDoctor Clinic",
                align: "center",
                size: "sm",
                color: "#888888",
                margin: "md"
              }
            ]
          }
        }
      });

    }

    // =========================
    // 5️⃣ follow-up appointment
    // =========================

    if (followup_date && followup_time) {

      const [doctorStatus] = await db.query(
        "SELECT available FROM Doctor WHERE doctor_id = ?",
        [appointment.doctor_id]
      );

      if (!doctorStatus.length || doctorStatus[0].available !== 1) {
        return res.json({
          success: false,
          message:
            "You are currently set to 'Not Available', cannot create a follow-up.",
        });
      }

      const [patientConflict] = await db.query(
        `SELECT * FROM Appointment
         WHERE patient_id = ?
         AND appointment_date = ?
         AND appointment_time = ?
         AND status != 'cancelled'`,
        [appointment.patient_id, followup_date, followup_time]
      );

      if (patientConflict.length > 0) {
        return res.json({
          success: false,
          message: "Patient already has an appointment at this time",
        });
      }

      const [existing] = await db.query(
        `SELECT * FROM Appointment
         WHERE doctor_id = ?
         AND appointment_date = ?
         AND appointment_time = ?`,
        [appointment.doctor_id, followup_date, followup_time]
      );

      if (existing.length > 0) {

        if (existing[0].status === "cancelled") {

          await db.query(
            `UPDATE Appointment
             SET patient_id = ?, status = 'confirmed'
             WHERE appointment_id = ?`,
            [appointment.patient_id, existing[0].appointment_id]
          );

        } else {

          return res.json({
            success: false,
            message: "Follow-up time slot is already booked",
          });

        }

      } else {

        await db.query(
          `INSERT INTO Appointment
           (patient_id, doctor_id, appointment_date, appointment_time, status)
           VALUES (?, ?, ?, ?, 'confirmed')`,
          [
            appointment.patient_id,
            appointment.doctor_id,
            followup_date,
            followup_time,
          ]
        );

      }

      // =========================
      // 🔔 LINE FOLLOW-UP NOTIFICATION
      // =========================

      const [patient] = await db.query(
        "SELECT line_user_id FROM Patient WHERE patient_id = ?",
        [appointment.patient_id]
      );

      const lineUserId = patient[0]?.line_user_id;

      if (lineUserId) {

        const [doctorName] = await db.query(
          `SELECT u.name
           FROM Doctor d
           JOIN Users u ON d.user_id = u.user_id
           WHERE d.doctor_id = ?`,
          [appointment.doctor_id]
        );

        const name = doctorName[0]?.name || "Doctor";

        const { date: formattedDate, time: formattedTime } =
          formatDateTime(followup_date, followup_time);

        await lineClient.pushMessage(lineUserId, {
          type: "flex",
          altText: "มีการนัดหมายติดตามอาการ",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "📅 นัดหมายติดตามอาการ",
                  weight: "bold",
                  size: "xl"
                },
                {
                  type: "separator",
                  margin: "md"
                },
                {
                  type: "text",
                  text: `👨‍⚕️ แพทย์: ${name}`,
                  margin: "lg"
                },
                {
                  type: "text",
                  text: `📆 วันที่: ${formattedDate}`
                },
                {
                  type: "text",
                  text: `⏰ เวลา: ${formattedTime}`
                },
              ]
            },
            footer: {
              type: "box",
              layout: "vertical",
              margin: "lg",
              contents: [
                {
                  type: "separator"
                },
                {
                  type: "text",
                  text: "🏥 HelloDoctor Clinic",
                  align: "center",
                  size: "sm",
                  color: "#888888",
                  margin: "md"
                }
              ]
            }
          }

        });


      }

    }

    res.json({
      success: true,
      message: "Appointment Completed",
    });

  } catch (error) {

    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });

  }
};

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
  try {
    const [doctors] = await db.query(`
        SELECT d.*, u.name, u.email, u.image 
        FROM Doctor d
        JOIN Users u ON d.user_id = u.user_id
      `);

    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to change doctor availablity for Admin and Doctor Panel
// const changeAvailablity = async (req, res) => {
//     try {

//         const { docId } = req.body

//         const docData = await doctorModel.findById(docId)
//         await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
//         res.json({ success: true, message: 'Availablity Changed' })

//     } catch (error) {
//         console.log(error)
//         res.json({ success: false, message: error.message })
//     }
// }

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
  try {
    const userId = req.doctor.id;

    const [rows] = await db.query(
      `
        SELECT 
          d.degree,
          d.experience,
          d.about,
          d.available,
          u.name,
          u.image
        FROM Doctor d
        JOIN Users u ON d.user_id = u.user_id
        WHERE d.user_id = ?
      `,
      [userId],
    );

    if (!rows.length) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    res.json({ success: true, profileData: rows[0] });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
  try {
    const userId = req.doctor.id; // id จาก token = user_id

    const about = req.body.about || "";
    const experience = req.body.experience || 0;

    // แปลงค่า available เป็น 1 หรือ 0 (รองรับทั้ง boolean และ string จาก form-data)
    let available = 0;
    if (
      req.body.available === "true" ||
      req.body.available === true ||
      req.body.available === "1" ||
      req.body.available === 1
    ) {
      available = 1;
    }

    await db.query(
      "UPDATE Doctor SET about = ?, available = ?, experience = ? WHERE user_id = ?",
      [about, available, experience, userId],
    );

    // ถ้ามีการอัปโหลดรูปภาพ ให้บันทึกลงตาราง Users
    if (req.file) {
      const imageUpload = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
      });
      const imageUrl = imageUpload.secure_url;
      await db.query("UPDATE Users SET image = ? WHERE user_id = ?", [
        imageUrl,
        userId,
      ]);
    }

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    // 1️⃣ ดึง user_id จาก token
    const userId = req.doctor.id;

    // 2️⃣ หา doctor_id จากตาราง Doctor
    const [doctor] = await db.query(
      "SELECT doctor_id FROM Doctor WHERE user_id = ?",
      [userId],
    );

    if (!doctor.length) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    const doctorId = doctor[0].doctor_id;

    // 3️⃣ ดึง appointment ทั้งหมดของหมอ
    const [appointments] = await db.query(
      `
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        u.name,
        u.image
      FROM Appointment a
      JOIN Patient p ON a.patient_id = p.patient_id
      JOIN Users u ON p.user_id = u.user_id
      WHERE a.doctor_id = ?
      ORDER BY a.created_at DESC
    `,
      [doctorId],
    );

    // 4️⃣ นับจำนวนคนไข้ไม่ซ้ำ
    const [patientsCount] = await db.query(
      `
        SELECT COUNT(DISTINCT patient_id) as totalPatients
        FROM Appointment
        WHERE doctor_id = ?
      `,
      [doctorId],
    );

    res.json({
      success: true,
      dashData: {
        totalAppointments: appointments.length,
        totalPatients: patientsCount[0].totalPatients,
        latestAppointments: appointments,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const appointmentCancel = async (req, res) => {
  try {

    const userId = req.doctor.id
    const { appointment_id } = req.body

    // หา doctor_id จาก user_id
    const [doctor] = await db.query(
      "SELECT doctor_id FROM Doctor WHERE user_id = ?",
      [userId]
    )

    if (!doctor.length) {
      return res.json({
        success: false,
        message: "Doctor not found"
      })
    }

    const doctorId = doctor[0].doctor_id

    // ดึงข้อมูลการนัด
    const [rows] = await db.query(`
      SELECT 
        a.appointment_date,
        a.appointment_time,
        p.line_user_id,
        u.name AS doctor_name
      FROM Appointment a
      JOIN Patient p ON a.patient_id = p.patient_id
      JOIN Doctor d ON a.doctor_id = d.doctor_id
      JOIN Users u ON d.user_id = u.user_id
      WHERE a.appointment_id = ?
    `, [appointment_id])

    if (!rows.length) {
      return res.json({
        success: false,
        message: "Appointment not found"
      })
    }

    const data = rows[0]

    const { date: formattedDate, time: formattedTime } =
      formatDateTime(data.appointment_date, data.appointment_time);

    // update status
    await db.query(
      "UPDATE Appointment SET status = 'cancelled' WHERE appointment_id = ? AND doctor_id = ?",
      [appointment_id, doctorId]
    )

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
            spacing: "md",
            contents: [
              {
                type: "text",
                text: "⚠️ การนัดหมายถูกยกเลิกโดยแพทย์",
                weight: "bold",
                //size: "sm",
                wrap: true
              },
              {
                type: "separator"
              },
              {
                type: "text",
                text: `👨‍⚕️ แพทย์: ${data.doctor_name}`,
                wrap: true
              },
              {
                type: "text",
                text: `📅 วันที่: ${formattedDate}`,
                wrap: true
              },
              {
                type: "text",
                text: `⏰ เวลา: ${formattedTime}`,
                wrap: true
              }
            ]
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "separator"
              },
              {
                type: "text",
                text: "🏥 HelloDoctor Clinic",
                align: "center",
                size: "sm",
                color: "#888888",
                margin: "md"
              }
            ]
          }
        }
      })

    }

    res.json({
      success: true,
      message: "Appointment Cancelled"
    })

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    })
  }
}

export {
  loginDoctor,
  appointmentComplete,
  appointmentsDoctor,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  doctorList,
};
