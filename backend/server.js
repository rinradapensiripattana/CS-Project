import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import * as line from "@line/bot-sdk";
import db from "./config/mysql.js";

// Import Routes
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// App Config
const app = express();
const port = process.env.PORT || 4000;

// Cloudinary Config 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// Line Config
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(lineConfig);
const registerUsers = {};

// Line Webhook ต้องมาก่อน express.json()
app.post("/webhook", line.middleware(lineConfig), async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const text = event.message.text;
      const userId = event.source.userId;

      console.log("User:", userId);
      console.log("Message:", text);

      // เริ่มสมัคร
      if (text === "รับการแจ้งเตือน") {
        registerUsers[userId] = true;

        await client.replyMessage(event.replyToken, {
          type: "text",
          text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก ที่ใช้ลงทะเบียนในเว็บไซต์",
        });
      }

      // นัดของฉัน
      else if (text === "รายการนัดหมายของฉัน") {
        try {
          // 1. หา patient จาก LINE
          const [patient] = await db.query(
            "SELECT patient_id FROM Patient WHERE line_user_id = ?",
            [userId]
          );

          if (patient.length === 0) {
            // เข้า flow
            registerUsers[userId] = true;
          
            await client.replyMessage(event.replyToken, {
              type: "text",
              text: `❗ คุณยังไม่ได้เชื่อมบัญชี
กรุณากรอกเลขบัตรประชาชน 13 หลัก ที่ใช้ลงทะเบียนในเว็บไซต์`,
            });
            return;
          }

          const patientId = patient[0].patient_id;

          // 2. ดึงนัด
          const [appointments] = await db.query(
            `SELECT 
                a.appointment_date, 
                a.appointment_time, 
                u.name AS doctor_name
             FROM Appointment a
             JOIN Doctor d ON a.doctor_id = d.doctor_id
             JOIN Users u ON d.user_id = u.user_id
             WHERE a.patient_id = ?
             AND a.status = 'confirmed'
             AND (
                  a.appointment_date > CURDATE()
                  OR (a.appointment_date = CURDATE() AND a.appointment_time >= CURTIME())
                 )
             ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
            [patientId]
          );

          // ไม่มีรายการนัดหมาย
          if (appointments.length === 0) {
            await client.replyMessage(event.replyToken, {
              type: "text",
              text: `📋 รายการนัดหมายของคุณ

คุณยังไม่มีนัดหมายในขณะนี้`,
            });
            return;
          }

          // 3. format ข้อความ
          const list = appointments
          .slice(0, 10)
          .map((a) => {
            const date = new Date(a.appointment_date);
        
            const formattedDate = date.toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
        
            const formattedTime = a.appointment_time.slice(0, 5);
        
            return `📆 วันที่: ${formattedDate}\n⏰ เวลา: ${formattedTime}\n👨‍⚕️ แพทย์: ${a.doctor_name}`;
          })
          .join(appointments.length > 1 ? "\n────────────\n" : "")
        
        const message = `📋 รายการนัดหมายของคุณ\n\n${list}`;
        
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: message,
        });

        } catch (err) {
          console.error(err);

          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "เกิดข้อผิดพลาดในการดึงข้อมูล",
          });
        }
      }

      // กำลังสมัคร
      else if (registerUsers[userId]) {
        const idNumber = text.trim();

        if (!/^\d{13}$/.test(idNumber)) {
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก ที่ใช้ลงทะเบียนในเว็บไซต์",
          });
          return;
        }

        try {
          const [rows] = await db.query(
            "SELECT * FROM Patient WHERE id_number = ?",
            [idNumber]
          );

          if (rows.length === 0) {
            await client.replyMessage(event.replyToken, {
              type: "text",
              text: "ไม่พบข้อมูลผู้ป่วยในระบบ กรุณาลองใหม่อีกครั้ง",
            });

            return;
          }

          // เจอข้อมูล
          await db.query(
            "UPDATE Patient SET line_user_id = ? WHERE id_number = ?",
            [userId, idNumber]
          );

          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "เชื่อม LINE สำเร็จ",
          });

          // ลบเฉพาะตอนสำเร็จ
          delete registerUsers[userId];

        } catch (error) {
          console.error(error);

          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "เกิดข้อผิดพลาด",
          });
        }
      }
    }
  }

  res.sendStatus(200);
});

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);
app.use("/api/doctor", doctorRouter);

app.get("/", (req, res) => {
  res.send("API IS WORKING");
});

app.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`);
});