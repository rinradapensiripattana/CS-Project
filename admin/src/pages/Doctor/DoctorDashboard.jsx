import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";

const DoctorDashboard = () => {
  const { dToken, dashData, getDashData, cancelAppointment } =
    useContext(DoctorContext);
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (dToken) {
      getDashData();
    }
  }, [dToken]);

  if (!dashData) {
    return <p className="m-5">Loading...</p>;
  }

  return (
    <div className="m-5">
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        {/* Total Appointments */}
        <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100">
          <img className="w-14" src={assets.appointments_icon} alt="" />
          <div>
            <p className="text-xl font-semibold text-gray-600">
              {dashData.totalAppointments}
            </p>
            <p className="text-gray-400">Appointments</p>
          </div>
        </div>

        {/* Total Patients */}
        <div className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100">
          <img className="w-14" src={assets.patients_icon} alt="" />
          <div>
            <p className="text-xl font-semibold text-gray-600">
              {dashData.totalPatients}
            </p>
            <p className="text-gray-400">Patients</p>
          </div>
        </div>
      </div>

      {/* Latest Bookings */}
      <div className="bg-white mt-10 rounded border">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-4 border-b">
          <img src={assets.list_icon} alt="" />
          <p className="font-semibold">Latest Bookings</p>
        </div>

        {/* Appointment List */}
        <div>
          {dashData.latestAppointments?.slice(0, 5).map((item) => (
            <div
              key={item.appointment_id}
              className="flex items-center px-6 py-3 gap-3 hover:bg-gray-100"
            >
              {/* Patient Image */}
              <img
                className="rounded-full w-10 h-10 object-cover"
                src={
                  item?.image
                    ? item.image.startsWith("http")
                      ? item.image
                      : `${import.meta.env.VITE_BACKEND_URL}${item.image}`
                    : "/default_image.png"
                }
                alt=""
              />

              {/* Patient Info */}
              <div className="flex-1 text-sm">
                <p className="text-gray-800 font-medium">{item.name}</p>
                <p className="text-gray-600">
                  {new Date(item.appointment_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  , {item.appointment_time?.slice(0, 5)}
                </p>
              </div>

              {/* Status */}
              {item.status === "cancelled" && (
                <p className="text-red-400 text-xs font-medium">Cancelled</p>
              )}

              {item.status === "completed" && (
                <p className="text-green-500 text-xs font-medium">Completed</p>
              )}

              {/* Action Buttons */}
              {(item.status === "confirmed" || item.status === "ongoing") && (
                <div className="flex gap-2">
                  {/* Cancel */}
                  <img
                    onClick={() => cancelAppointment(item.appointment_id)}
                    className="w-8 cursor-pointer"
                    src={assets.cancel_icon}
                    alt=""
                  />

                  {/* Go to Medical Record */}
                  <img
                    onClick={() => {
                      const appointmentDateTime = new Date(
                        item.appointment_date,
                      );
                      const [hours, minutes] = item.appointment_time.split(":");
                      appointmentDateTime.setHours(hours, minutes, 0, 0);

                      // Allow access 30 minutes before the appointment
                      const allowedTime = new Date(
                        appointmentDateTime.getTime() - 30 * 60 * 1000,
                      );

                      if (new Date() < allowedTime) {
                        toast.error("ยังไม่ถึงเวลานัดหมาย");
                        return;
                      }
                      navigate(`/doctor-medical-record/${item.appointment_id}`);
                    }}
                    className="w-8 cursor-pointer"
                    src={assets.tick_icon}
                    alt=""
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
