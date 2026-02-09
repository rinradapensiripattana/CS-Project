import express from 'express'
import { addDoctor } from '../controllers/adminController.js' 
import upload from '../middleware/multer.js'

const adminRouter = express.Router();



// adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-doctor", upload.single('image'), addDoctor)
// adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
// adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
// adminRouter.get("/all-doctors", authAdmin, allDoctors)
// adminRouter.post("/change-availability", authAdmin, changeAvailablity)
// adminRouter.get("/dashboard", authAdmin, adminDashboard)

export default adminRouter