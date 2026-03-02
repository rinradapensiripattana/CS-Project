import { createContext, useState } from "react"
import axios from "axios"
import { toast } from "react-toastify"

export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const [aToken, setAToken] = useState(
        localStorage.getItem('aToken')
            ? localStorage.getItem('aToken')
            : ''
    )

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [doctors, setDoctors] = useState([])
    const [appointments, setAppointments] = useState([])
    const [dashData, setDashData] = useState(false)

    // =========================
    // Get All Doctors
    // =========================
    const getAllDoctors = async () => {
        try {
            const { data } = await axios.get(
                backendUrl + '/api/admin/all-doctors',
                { headers: { aToken } }
            )

            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    // =========================
    // Change Doctor Availability ✅ แก้ตรงนี้
    // =========================
    const changeAvailability = async (doctorId) => {
        try {

            const { data } = await axios.post(
                backendUrl + '/api/admin/change-availability',
                { doctorId },   // ✅ ชื่อต้องตรงกับ backend
                { headers: { aToken } }
            )

            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    // =========================
    // Get All Appointments
    // =========================
    const getAllAppointments = async () => {
        try {

            const { data } = await axios.get(
                backendUrl + '/api/admin/appointments',
                { headers: { aToken } }
            )

            if (data.success) {
                setAppointments(data.appointments)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    // =========================
    // Cancel Appointment
    // =========================
    const cancelAppointment = async (appointmentId) => {
        try {

            const { data } = await axios.post(
                backendUrl + '/api/admin/cancel-appointment',
                { id: appointmentId },
                { headers: { aToken } }
            )

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
                getDashData()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    // =========================
    // Dashboard Data
    // =========================
    const getDashData = async () => {
        try {

            const { data } = await axios.get(
                backendUrl + '/api/admin/dashboard',
                { headers: { aToken } }
            )

            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    const value = {
        aToken, setAToken,
        backendUrl,
        doctors, getAllDoctors,
        changeAvailability,
        appointments, setAppointments,
        getAllAppointments,
        cancelAppointment,
        dashData, getDashData
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextProvider