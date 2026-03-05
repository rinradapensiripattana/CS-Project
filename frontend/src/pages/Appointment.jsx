import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");
  const [bookedAppointments, setBookedAppointments] = useState([]);

  // โหลดข้อมูลหมอ
  useEffect(() => {
    const doctor = doctors.find((doc) => doc.doctor_id === Number(docId));
    setDocInfo(doctor || null);
  }, [doctors, docId]);

  // โหลดเวลาที่ถูกจองแล้ว
  const fetchDoctorAppointments = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/user/doctor-appointments/${docId}`,
      );

      if (data.success) {
        setBookedAppointments(data.appointments);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (docInfo) {
      fetchDoctorAppointments();
    }
  }, [docInfo]);

  // สร้าง slot
  useEffect(() => {
    if (!docInfo) return;

    const now = new Date();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let allSlots = [];

    for (let i = 0; i < 12; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const slotDate =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");

      let timeSlots = [];

      for (let hour = 9; hour < 21; hour++) {
        for (let minute of [0, 30]) {
          const slotTimeStr =
            String(hour).padStart(2, "0") +
            ":" +
            String(minute).padStart(2, "0") +
            ":00";

          const slotDateTime = new Date(`${slotDate}T${slotTimeStr}`);

          // ถ้าเป็นวันนี้ และเวลานั้นเลยเวลาปัจจุบันแล้ว → ไม่แสดง
          if (d.toDateString() === now.toDateString() && slotDateTime <= now) {
            continue;
          }

          const isBooked = bookedAppointments.some(
            (appt) =>
              appt.appointment_date === slotDate &&
              appt.appointment_time === slotTimeStr,
          );

          if (!isBooked) {
            timeSlots.push({
              date: slotDate,
              time: slotTimeStr,
              displayDay: d.getDate(),
              displayWeek: d.getDay(),
            });
          }
        }
      }

      // ถ้าไม่มีเวลาเหลือเลย (เช่นเลย 20:30 แล้ว) → วันนั้นจะไม่แสดง
      if (timeSlots.length > 0) {
        allSlots.push(timeSlots);
      }
    }

    setDocSlots(allSlots);
  }, [docInfo, bookedAppointments]);

  // จองนัด
  const bookAppointment = async () => {
    if (!token) {
      toast.warning("Login to book appointment");
      return navigate("/login");
    }

    if (!slotTime) {
      toast.warning("Please select a time slot");
      return;
    }

    const selectedDate = docSlots[slotIndex][0]?.date;

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        {
          doctor_id: Number(docId),
          appointment_date: selectedDate,
          appointment_time: slotTime,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
        toast.success(data.message);
        await fetchDoctorAppointments();
        setSlotTime("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      await fetchDoctorAppointments();
    }
  };

  return (
    docInfo && (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4">
          <div>
            <img
              src={
                docInfo.image
                  ? docInfo.image.startsWith("http")
                    ? docInfo.image
                    : `${backendUrl}${docInfo.image}`
                  : "/default_image.png"
              }
              alt=""
              className="w-full sm:w-32 md:w-36 rounded-lg"
            />
          </div>

          <div className="flex-1 border rounded-lg p-6 bg-white">
            <p className="text-2xl font-medium">{docInfo.name}</p>

            <div className="flex gap-2 text-sm mt-1 text-gray-600">
              <p>{docInfo.degree}</p>
              <button className="px-2 border text-xs rounded-full">
                {docInfo.experience} Years experience
              </button>
            </div>

            <p className="text-sm mt-2 text-gray-600">{docInfo.about}</p>
          </div>
        </div>

        <div className="sm:ml-[160px] mt-6">
          <p className="font-medium">Booking slots</p>

          {/* Days */}
          <div className="flex gap-3 overflow-x-scroll mt-4">
            {docSlots.map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  setSlotIndex(index);
                  setSlotTime("");
                }}
                className={`text-center py-6 min-w-16 rounded-full cursor-pointer border
                ${slotIndex === index ? "bg-primary text-white" : ""}`}
              >
                <p>{item[0] && daysOfWeek[item[0].displayWeek]}</p>
                <p>{item[0] && item[0].displayDay}</p>
              </div>
            ))}
          </div>

          {/* Times */}
          <div className="flex gap-3 overflow-x-scroll mt-4">
            {docSlots[slotIndex] &&
              docSlots[slotIndex].map((item, index) => (
                <p
                  key={index}
                  onClick={() => setSlotTime(item.time)}
                  className={`px-5 py-2 rounded-full cursor-pointer border
                  ${
                    item.time === slotTime
                      ? "bg-primary text-white"
                      : "text-gray-400 border-gray-300"
                  }`}
                >
                  {item.time.slice(0, 5)}
                </p>
              ))}
          </div>

          <button
            onClick={bookAppointment}
            className="bg-primary text-white px-8 py-3 rounded-full my-6"
          >
            Book an appointment
          </button>
        </div>
      </div>
    )
  );
};

export default Appointment;
