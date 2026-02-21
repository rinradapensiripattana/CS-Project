import express from 'express'
import { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel } from '../controllers/adminController.js' 
import upload from '../middleware/multer.js'
import authAdmin from '../middleware/authAdmin.js'
import { changeAvailablity } from '../controllers/doctorController.js';

const adminRouter = express.Router();



adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-doctor", upload.single('image'), addDoctor)
adminRouter.post("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
// adminRouter.get("/dashboard", authAdmin, adminDashboard)

export default adminRouter