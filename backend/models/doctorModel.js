import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // ใช้ login
    password: { type: String, required: true }, // ใช้ login
    image: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    slots_booked: { type: Object, default: {} },
    date: { type: Number, required: true },
}, { minimize: false })

const doctorModel = mongoose.models.doctor || mongoose.model("doctor", doctorSchema);
export default doctorModel;