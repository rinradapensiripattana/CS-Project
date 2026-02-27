import React, { useContext, useEffect, useState } from "react"
import { AppContext } from "../context/AppContext"
import { assets } from "../assets/assets"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import axios from "axios"

const Appointment = () => {

  const { docId } = useParams()
  const { doctors, backendUrl, token, getDoctorsData } = useContext(AppContext)

  const navigate = useNavigate()

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

  const [docInfo, setDocInfo] = useState(null)
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState("")

  // =========================
  // 🔹 Fetch Doctor Info (SQL FIX)
  // =========================
  const fetchDocInfo = () => {
    const doctor = doctors.find(
      (doc) => doc.doctor_id === Number(docId)
    )
    setDocInfo(doctor || null)
  }

  // =========================
  // 🔹 Generate Available Slots
  // =========================
  const getAvailableSlots = () => {

    if (!docInfo) return

    let today = new Date()
    let allSlots = []

    for (let i = 0; i < 10; i++) {

      let currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)

      let endTime = new Date(currentDate)
      endTime.setHours(21, 0, 0, 0)

      // Start at 9 AM
      currentDate.setHours(9)
      currentDate.setMinutes(0)

      let timeSlots = []

      while (currentDate < endTime) {

        let formattedTime = currentDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })

        // 🔥 SQL version ไม่มี slots_booked → เปิดหมดก่อน
        timeSlots.push({
          datetime: new Date(currentDate),
          time: formattedTime,
        })

        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }

      allSlots.push(timeSlots)
    }

    setDocSlots(allSlots)
  }

  // =========================
  // 🔹 Book Appointment
  // =========================
  const bookAppointment = async () => {

    if (!token) {
      toast.warning("Login to book appointment")
      return navigate("/login")
    }

    if (!slotTime) {
      toast.warning("Please select a time slot")
      return
    }

    const date = docSlots[slotIndex][0].datetime

    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    const slotDate = `${day}_${month}_${year}`

    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/book-appointment",
        {
          doctor_id: Number(docId), // 🔥 SQL FIX
          slotDate,
          slotTime
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (data.success) {
        toast.success(data.message)
        getDoctorsData()
        navigate("/my-appointments")
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  // =========================
  // 🔹 Effects
  // =========================
  useEffect(() => {
    fetchDocInfo()
  }, [doctors, docId])

  useEffect(() => {
    getAvailableSlots()
  }, [docInfo])

  // =========================
  // 🔹 UI
  // =========================
  return (
    docInfo && (
      <div>

        {/* Doctor Details */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4">

          <div>
            <img
              src={docInfo.image ? docInfo.image : "/default_image.png"}
              alt=""
              className="w-full sm:w-32 md:w-36 h-auto max-h-60 rounded-lg"
            />
          </div>

          <div className="flex-1 border border-gray-300 rounded-lg p-6 bg-white mx-2 sm:mx-0 mt-[-32px] sm:mt-0">

            <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
              {docInfo.name}
            </p>

            <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
              <p>{docInfo.degree}</p>
              <button className="py-0.5 px-2 border text-xs rounded-full">
              {docInfo.experience} {docInfo.experience > 1 ? "Years" : "Year"} experience
              </button>
            </div>

            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-2">
                About <img className="w-3" src={assets.info_icon} alt="" />
              </p>
              <p className="text-sm text-gray-600 max-w-[800px] leading-relaxed mt-2">
                {docInfo.about}
              </p>
            </div>

          </div>
        </div>

        {/* Booking Slots */}
        <div className="sm:ml-[160px] mt-4 font-medium text-gray-700">

          <p>Booking slots</p>

          <div className="flex gap-3 items-center w-full overflow-x-scroll scrollbar-hide mt-4">
            {docSlots.map((item, index) => (
              <div
                key={index}
                onClick={() => setSlotIndex(index)}
                className={`text-center py-6 min-w-16 rounded-full cursor-pointer border transition-all duration-200 
                ${slotIndex === index ? "bg-primary text-white" : "border-gray-200"}`}
              >
                <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                <p>{item[0] && item[0].datetime.getDate()}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full overflow-x-scroll scrollbar-hide mt-4">
            {docSlots[slotIndex] &&
              docSlots[slotIndex].map((item, index) => (
                <p
                  key={index}
                  onClick={() => setSlotTime(item.time)}
                  className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer border transition-all duration-200 
                  ${item.time === slotTime ? "bg-primary text-white" : "text-gray-400 border-gray-300"}`}
                >
                  {item.time.toLowerCase()}
                </p>
              ))}
          </div>

          <button
            onClick={bookAppointment}
            className="bg-primary text-white text-sm font-light px-8 py-3 rounded-full my-6"
          >
            Book an appointment
          </button>

        </div>
      </div>
    )
  )
}

export default Appointment