import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import db from "../config/mysql.js";
import { v2 as cloudinary } from "cloudinary";

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
      followup_time,
    } = req.body;

    // 1️⃣ หา doctor_id
    const [doctor] = await db.query(
      "SELECT doctor_id FROM Doctor WHERE user_id = ?",
      [userId],
    );

    if (doctor.length === 0) {
      return res.json({
        success: false,
        message: "Doctor not found",
      });
    }

    const doctorId = doctor[0].doctor_id;

    // 2️⃣ เช็คว่า appointment เป็นของหมอจริง
    const [check] = await db.query(
      "SELECT * FROM Appointment WHERE appointment_id = ? AND doctor_id = ?",
      [appointment_id, doctorId],
    );

    if (check.length === 0) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const appointment = check[0];

    // 3️⃣ เช็คว่ามี Medical_Record แล้วหรือยัง
    const [record] = await db.query(
      "SELECT * FROM Medical_Record WHERE appointment_id = ?",
      [appointment_id],
    );

    if (record.length > 0) {
      // update record
      await db.query(
        `UPDATE Medical_Record
           SET symptom = ?, treatment = ?, record_date = NOW()
           WHERE appointment_id = ?`,
        [symptoms, treatment, appointment_id],
      );
    } else {
      // insert record
      await db.query(
        `INSERT INTO Medical_Record
           (appointment_id, symptom, treatment, record_date)
           VALUES (?, ?, ?, NOW())`,
        [appointment_id, symptoms, treatment],
      );
    }

    // 4️⃣ update appointment status
    await db.query(
      "UPDATE Appointment SET status = 'completed' WHERE appointment_id = ?",
      [appointment_id],
    );

    // 5️⃣ create follow-up appointment
    if (followup_date && followup_time) {
      // Check if doctor is available before creating follow-up
      const [doctorStatus] = await db.query(
        "SELECT available FROM Doctor WHERE doctor_id = ?",
        [appointment.doctor_id],
      );

      if (!doctorStatus.length || doctorStatus[0].available !== 1) {
        return res.json({
          success: false,
          message:
            "You are currently set to 'Not Available', cannot create a follow-up.",
        });
      }

      // 🔥 Check if patient already has an appointment at this time
      const [patientConflict] = await db.query(
        `SELECT * FROM Appointment 
         WHERE patient_id = ? 
         AND appointment_date = ? 
         AND appointment_time = ?
         AND status != 'cancelled'`,
        [appointment.patient_id, followup_date, followup_time],
      );

      if (patientConflict.length > 0) {
        return res.json({
          success: false,
          message: "Patient already has an appointment at this time",
        });
      }

      // 🔥 เช็คว่ามีนัดหมายเดิมหรือไม่ (ป้องกัน Duplicate entry)
      const [existing] = await db.query(
        `SELECT * FROM Appointment 
           WHERE doctor_id = ? 
           AND appointment_date = ? 
           AND appointment_time = ?`,
        [appointment.doctor_id, followup_date, followup_time],
      );

      if (existing.length > 0) {
        if (existing[0].status === "cancelled") {
          // ถ้ามีและเป็น cancelled ให้ update กลับมาใช้ใหม่
          await db.query(
            `UPDATE Appointment SET patient_id = ?, status = 'ongoing' WHERE appointment_id = ?`,
            [appointment.patient_id, existing[0].appointment_id],
          );
        } else {
          return res.json({
            success: false,
            message: "Follow-up time slot is already booked",
          });
        }
      } else {
        // ถ้าไม่มี ให้ insert ใหม่
        await db.query(
          `INSERT INTO Appointment (patient_id, doctor_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, 'ongoing')`,
          [
            appointment.patient_id,
            appointment.doctor_id,
            followup_date,
            followup_time,
          ],
        );
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
    const userId = req.doctor.id;
    const { appointment_id } = req.body;

    // หา doctor_id จาก user_id
    const [doctor] = await db.query(
      "SELECT doctor_id FROM Doctor WHERE user_id = ?",
      [userId],
    );

    if (!doctor.length) {
      return res.json({
        success: false,
        message: "Doctor not found",
      });
    }

    const doctorId = doctor[0].doctor_id;

    // update status
    await db.query(
      "UPDATE Appointment SET status = 'cancelled' WHERE appointment_id = ? AND doctor_id = ?",
      [appointment_id, doctorId],
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
