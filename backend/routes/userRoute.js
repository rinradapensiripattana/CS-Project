import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  listAppointment,
  cancelAppointment,
  bookAppointment
} from "../controllers/userController.js";

import upload from "../middleware/multer.js";
import authUser from "../middleware/authUser.js";

const userRouter = express.Router();

// Auth
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// Profile
userRouter.get("/get-profile", authUser, getProfile);

userRouter.put(
  "/update-profile",
  authUser,
  upload.single("image"),
  updateProfile
);

// Appointment
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);

export default userRouter;