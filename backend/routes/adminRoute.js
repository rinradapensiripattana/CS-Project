import express from "express";
import {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  changeAvailability,
  getAllPatients,
  createAppointment,
  getBookedTimes,
  getPatientAppointments,
  getPatientMedicalRecords
} from "../controllers/adminController.js";
import upload from "../middleware/multer.js";
import authAdmin from "../middleware/authAdmin.js";
// import { changeAvailablity } from '../controllers/doctorController.js';

const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin);
adminRouter.post("/add-doctor", upload.single("image"), addDoctor);
adminRouter.post("/change-availability", authAdmin, changeAvailability);
adminRouter.get("/all-doctors", authAdmin, allDoctors);
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel);
adminRouter.get("/dashboard", authAdmin, adminDashboard);
adminRouter.get("/all-patients", authAdmin, getAllPatients);
adminRouter.post("/create-appointment", authAdmin, createAppointment);
adminRouter.get("/booked-times", authAdmin, getBookedTimes);
adminRouter.get("/patient-appointments/:patientId", authAdmin, getPatientAppointments);
adminRouter.get("/patient-medical/:patientId",authAdmin, getPatientMedicalRecords);

export default adminRouter;
