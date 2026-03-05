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

export default adminRouter;
