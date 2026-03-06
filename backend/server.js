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

/* =============================
   CLOUDINARY CONFIG
============================= */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

/* =============================
   LINE CONFIG
============================= */

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(lineConfig);
const registerUsers = {};

/* =============================
   LINE WEBHOOK
   ต้องมาก่อน express.json()
============================= */

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
          text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก",
        });
      }

      // กำลังสมัคร
      else if (registerUsers[userId]) {
        const idNumber = text.trim();

        if (!/^\d{13}$/.test(idNumber)) {
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "กรุณากรอกเลขบัตรประชาชน 13 หลัก",
          });
          continue;
        }

        try {
          const [rows] = await db.query(
            "SELECT * FROM Patient WHERE id_number = ?",
            [idNumber]
          );

          if (rows.length === 0) {
            await client.replyMessage(event.replyToken, {
              type: "text",
              text: "ไม่พบข้อมูลผู้ป่วยในระบบ",
            });
          } else {
            await db.query(
              "UPDATE Patient SET line_user_id = ? WHERE id_number = ?",
              [userId, idNumber]
            );

            await client.replyMessage(event.replyToken, {
              type: "text",
              text: "เชื่อม LINE สำเร็จ",
            });
          }

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

/* =============================
   NORMAL MIDDLEWARE
============================= */

// CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

// JSON Parser
app.use(express.json());

/* =============================
   STATIC FILES
============================= */

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =============================
   API ROUTES
============================= */

app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);
app.use("/api/doctor", doctorRouter);

/* =============================
   TEST ROUTE
============================= */

app.get("/", (req, res) => {
  res.send("API IS WORKING");
});

/* =============================
   START SERVER
============================= */

app.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`);
});