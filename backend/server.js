import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

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

// Middleware
// 1. CORS - ควรอยู่บนสุดเพื่อจัดการ Cross-Origin Requests ก่อน
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
);

// 2. JSON Parser - สำหรับแปลง Request Body ที่เป็น JSON
app.use(express.json());

// 3. Static Folder - สำหรับให้บริการไฟล์รูปภาพจากโฟลเดอร์ uploads (สำหรับรูปเก่า)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);
app.use("/api/doctor", doctorRouter);

app.get("/", (req, res) => {
  res.send("API IS WORKING");
});

// Start Server
app.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`);
});
