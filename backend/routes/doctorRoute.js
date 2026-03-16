import express from "express";
import {
  loginDoctor,
  appointmentComplete,
  appointmentsDoctor,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  doctorList,
  getBookedTimes
} from "../controllers/doctorController.js";

import authDoctor from "../middleware/authDoctor.js";
import upload from "../middleware/multer.js";

const doctorRouter = express.Router();

doctorRouter.post("/login", loginDoctor);
doctorRouter.get("/list", doctorList);

doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);

doctorRouter.get("/dashboard", authDoctor, doctorDashboard);
doctorRouter.get("/profile", authDoctor, doctorProfile);
doctorRouter.post(
  "/update-profile",
  authDoctor,
  upload.single("image"),
  updateDoctorProfile,
);
doctorRouter.get("/booked-times", authDoctor, getBookedTimes);

export default doctorRouter;
