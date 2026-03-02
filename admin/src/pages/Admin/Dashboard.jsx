import React, { useContext, useEffect } from "react";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";

const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData } =
    useContext(AdminContext);

  useEffect(() => {
    if (aToken) {
      getDashData();
    }
  }, [aToken]);

  // ✅ ฟังก์ชันแปลงวันที่ให้สวย
  const formatDate = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!dashData) return null;

  return (
    <div className="m-5">
      {/* ===== Cards ===== */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border">
          <img className="w-14" src={assets.doctor_icon} alt="" />
          <div>
            <p className="text-xl font-semibold text-gray-600">
              {dashData.doctors}
            </p>
            <p className="text-gray-400">Doctors</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border">
          <img className="w-14" src={assets.appointments_icon} alt="" />
          <div>
            <p className="text-xl font-semibold text-gray-600">
              {dashData.appointments}
            </p>
            <p className="text-gray-400">Appointments</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border">
          <img className="w-14" src={assets.patients_icon} alt="" />
          <div>
            <p className="text-xl font-semibold text-gray-600">
              {dashData.patients}
            </p>
            <p className="text-gray-400">Patients</p>
          </div>
        </div>
      </div>

      {/* ===== Latest Bookings ===== */}
      <div className="bg-white mt-10 rounded border">
        <div className="flex items-center gap-2 px-4 py-4 border-b">
          <img src={assets.list_icon} alt="" className="w-6 h-6" />
          <p className="font-semibold">Latest Bookings</p>
        </div>

        <div>
          {dashData.latestAppointments.map((item, index) => (
            <div
              className="flex items-center px-6 py-3 gap-3 hover:bg-gray-100"
              key={index}
            >
              {/* ✅ Default Image */}
              <img
                className="rounded-full w-10 h-10 object-cover"
                src={
                  item.doctor_image
                    ? `${import.meta.env.VITE_BACKEND_URL}${item.doctor_image}`
                    : "/default_image.png"
                }
                alt=""
              />

              <div className="flex-1 text-sm">
                <p className="text-gray-800 font-medium">
                  {item.doctor_name}
                </p>

                <p className="text-gray-600">
                  Booking on {formatDate(item.appointment_date)} at{" "}
                  {item.appointment_time}
                </p>
              </div>

              {/* Status */}
              {item.status === "cancelled" ? (
                <p className="text-red-400 text-xs font-medium">
                  Cancelled
                </p>
              ) : item.status === "completed" ? (
                <p className="text-green-500 text-xs font-medium">
                  Completed
                </p>
              ) : (
                <img
                  onClick={() =>
                    cancelAppointment(item.appointment_id)
                  }
                  className="w-8 cursor-pointer"
                  src={assets.cancel_icon}
                  alt=""
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;