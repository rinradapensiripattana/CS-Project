import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const MyAppointment = () => {

  const { axiosInstance, token, backendUrl } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);

  // ========================
  // 🔹 FORMAT DATE
  // ========================
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // ========================
  // 🔹 GET APPOINTMENTS
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
  // 🔹 CANCEL APPOINTMENT
  // ========================
  const cancelAppointment = async (appointment_id) => {
    try {
      const { data } = await axiosInstance.post(
        "/api/user/cancel-appointment",
        { appointment_id }
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

  return (
    <div>
      <p className="pb-3 mt-3 font-medium text-zinc-700 border-b">
        My Appointments
      </p>

      <div>
        {appointments.map((item) => (
          <div
            key={item.appointment_id}
            className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b"
          >

            {/* Doctor Image */}
            <div>
              <img
                className="w-24 h-28 object-cover object-top rounded-lg"
                src={
                  item.doctor_image
                    ? backendUrl + item.doctor_image
                    : "/default_image.png"
                }
                alt=""
              />
            </div>

            {/* Doctor Info */}
            <div className="flex-1 flex flex-col text-ml text-zinc-600">
              <p className="text-neutral-800 font-semibold">
                {item.doctor_name}
              </p>

              <p className="text-sm mt-auto">
                <span className="text-sm text-neutral-700 font-medium">
                  Date & Time :
                </span>{" "}
                {formatDate(item.appointment_date)} | {item.appointment_time}
              </p>

              <p className="text-sm mt-1">
                <span className="font-medium">Status :</span>{" "}
                <span className={
                  item.status === "cancelled"
                    ? "text-red-500"
                    : "text-green-600"
                }>
                  {item.status}
                </span>
              </p>
            </div>

            {/* Button */}
            <div className="flex flex-col gap-2 justify-end">
              {item.status !== "cancelled" && (
                <button
                  onClick={() => cancelAppointment(item.appointment_id)}
                  className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-700 hover:text-white transition-all duration-300"
                >
                  Cancel Appointment
                </button>
              )}

              {item.status === "cancelled" && (
                <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500 text-sm">
                  Appointment cancelled
                </button>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default MyAppointment;