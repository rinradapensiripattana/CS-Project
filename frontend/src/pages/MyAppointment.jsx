import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const MyAppointment = () => {
  const { axiosInstance, token, backendUrl } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);

  // เพิ่ม State สำหรับจัดการ Tab (ค่าเริ่มต้นคือ upcoming)
  const [activeTab, setActiveTab] = useState("upcoming");

  // ========================
  // FORMAT DATE & TIME
  // ========================
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ฟังก์ชันแปลงเวลา (String) เป็นจำนวนนาที เพื่อใช้เปรียบเทียบ
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    // รองรับทั้ง 24h ("14:30") และ 12h ("02:30 PM")
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10) || 0;

    if (modifier) {
      if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
  };

  // ========================
  // GET APPOINTMENTS
  // ========================
  const getUserAppointments = async () => {
    try {
      const { data } = await axiosInstance.get("/api/user/appointments");

      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ========================
  // CANCEL APPOINTMENT
  // ========================
  const cancelAppointment = async (appointment_id) => {
    try {
      const { data } = await axiosInstance.post(
        "/api/user/cancel-appointment",
        { appointment_id },
      );

      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
    }
  }, [token]);

  // ========================
  // SEPARATE & SORT APPOINTMENTS
  // ========================
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Upcoming: เรียงวันที่ใกล้สุดขึ้นก่อน -> ถ้าวันเดียวกัน เอาเวลาเช้าสุดขึ้นก่อน
  const upcomingAppointments = appointments
    .filter(
      (item) =>
        new Date(item.appointment_date) >= currentDate &&
        item.status !== "cancelled" &&
        item.status !== "completed"
    )
    .sort((a, b) => {
      const dateA = new Date(a.appointment_date).setHours(0, 0, 0, 0);
      const dateB = new Date(b.appointment_date).setHours(0, 0, 0, 0);

      if (dateA !== dateB) return dateA - dateB; // เทียบวัน
      return parseTime(a.appointment_time) - parseTime(b.appointment_time); // เทียบเวลา
    });

  // Past: เรียงวันที่เพิ่งผ่านมาล่าสุดขึ้นก่อน -> ถ้าวันเดียวกัน เอาเวลาดึกล่าสุดขึ้นก่อน
  const pastAppointments = appointments
    .filter(
      (item) =>
        new Date(item.appointment_date) < currentDate ||
        item.status === "cancelled" ||
        item.status === "completed"
    )
    .sort((a, b) => {
      const dateA = new Date(a.appointment_date).setHours(0, 0, 0, 0);
      const dateB = new Date(b.appointment_date).setHours(0, 0, 0, 0);

      if (dateA !== dateB) return dateB - dateA; // เทียบวัน
      return parseTime(b.appointment_time) - parseTime(a.appointment_time); // เทียบเวลา
    });

  // ฟังก์ชันเช็คสีของ Status
  const getStatusColor = (status) => {
    if (status === "completed") return "text-green-500";
    if (status === "confirmed") return "text-blue-500";
    if (status === "cancelled") return "text-red-500";
    return "text-stone-500";
  };

  return (
    <div>
      <p className="pb-3 mt-3 font-medium text-zinc-700 border-b">
        My Appointments
      </p>

      {/* -----------------------------
          TAB NAVIGATION
      ------------------------------ */}
      <div className="flex gap-6 pt-4 pb-2 mb-4 border-b text-sm">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`pb-2 font-medium transition-all duration-300 ${activeTab === "upcoming"
              ? "text-primary border-b-2 border-primary"
              : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`pb-2 font-medium transition-all duration-300 ${activeTab === "past"
              ? "text-primary border-b-2 border-primary"
              : "text-zinc-500 hover:text-zinc-700"
            }`}
        >
          Past & Cancelled
        </button>
      </div>

      {/* -----------------------------
          TAB CONTENT
      ------------------------------ */}
      <div>
        {/* แสดงผลเมื่อเลือกแท็บ Upcoming */}
        {activeTab === "upcoming" && (
          <div>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4">No upcoming appointments.</p>
            ) : (
              upcomingAppointments.map((item) => (
                <div
                  key={item.appointment_id}
                  className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-3 border-b"
                >
                  <div>
                    <img
                      className="w-24 h-28 object-cover object-top rounded-lg"
                      src={
                        item.doctor_image
                          ? item.doctor_image.startsWith("http")
                            ? item.doctor_image
                            : backendUrl + item.doctor_image
                          : "/default_image.png"
                      }
                      alt=""
                    />
                  </div>
                  <div className="flex-1 flex flex-col text-sm text-zinc-600">
                    <p className="text-neutral-800 font-semibold">{item.doctor_name}</p>
                    <p className="mt-auto">
                      <span className="text-neutral-700 font-medium">Date & Time :</span>{" "}
                      {formatDate(item.appointment_date)} | {item.appointment_time}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium">Status :</span>{" "}
                      <span className={getStatusColor(item.status)}>{item.status}</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 justify-end w-48">
                    {item.status === "confirmed" && (
                      <button
                        onClick={() => cancelAppointment(item.appointment_id)}
                        className="text-sm text-stone-500 text-center py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300"
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* แสดงผลเมื่อเลือกแท็บ Past */}
        {activeTab === "past" && (
          <div>
            {pastAppointments.length === 0 ? (
              <p className="text-sm text-gray-500 mt-4">No past or cancelled appointments.</p>
            ) : (
              pastAppointments.map((item) => (
                <div
                  key={item.appointment_id}
                  className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-3 border-b"
                >
                  <div>
                    <img
                      className="w-24 h-28 object-cover object-top rounded-lg opacity-70"
                      src={
                        item.doctor_image
                          ? item.doctor_image.startsWith("http")
                            ? item.doctor_image
                            : backendUrl + item.doctor_image
                          : "/default_image.png"
                      }
                      alt=""
                    />
                  </div>
                  <div className="flex-1 flex flex-col text-sm text-zinc-600">
                    <p className="text-neutral-800 font-semibold">{item.doctor_name}</p>
                    <p className="mt-auto">
                      <span className="text-neutral-700 font-medium">Date & Time :</span>{" "}
                      {formatDate(item.appointment_date)} | {item.appointment_time}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium">Status :</span>{" "}
                      <span className={getStatusColor(item.status)}>{item.status}</span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 justify-end w-48">
                    {item.status === "cancelled" && (
                      <button className="py-2 border border-red-500 rounded text-red-500 text-sm cursor-not-allowed">
                        Appointment cancelled
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointment;