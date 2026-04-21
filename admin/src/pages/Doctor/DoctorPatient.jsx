import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const DoctorPatient = () => {
  const { dToken, setDToken } = useContext(DoctorContext);
  const { calculateAge, backendUrl } = useContext(AppContext);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState([]);

  const getAppointments = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/appointments",
        {
          headers: { Authorization: `Bearer ${dToken}` },
        },
      );
      if (data.success) {
        setAppointments(data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast.error("Session Expired. Please login again.");
        setDToken("");
        localStorage.removeItem("dToken");
      }
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

  // เอาเฉพาะ completed
  const completedAppointments = appointments.filter(
    (item) => item.status === "completed",
  );

  // รวม patient ไม่ให้ซ้ำ
  const patients = Object.values(
    completedAppointments.reduce((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = item;
      }
      return acc;
    }, {}),
  );

  // search filter
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  // history ของ patient ที่เลือก
  const patientHistory = completedAppointments.filter(
    (item) => item.name === selectedPatient,
  );

  return (
    <div className="w-full max-w-6xl m-5">

      {!selectedPatient && (
        <>
          <p className="mb-3 text-lg font-medium text-gray-600">
            Patient Medical History
          </p>

          {/* Search */}
          <div className="flex items-center gap-2 mb-5">
            <input
              type="text"
              placeholder="Search patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-2 rounded w-full sm:w-96 outline-primary"
            />
          </div>

          <div className="flex flex-col gap-3">
            {filteredPatients.map((item, index) => (
              <div
                key={index}
                onClick={() => setSelectedPatient(item.name)}
                className="flex items-center gap-4 p-4 bg-white border border-blue-200 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50"
              >
                <img
                  className="w-12 h-12 rounded-full object-cover"
                  src={
                    item?.image
                      ? item.image.startsWith("http")
                        ? item.image
                        : `${import.meta.env.VITE_BACKEND_URL}${item.image}`
                      : "/default_image.png"
                  }
                />

                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    Age: {calculateAge(item.date_of_birth)}
                  </p>
                </div>
              </div>
            ))}

            {filteredPatients.length === 0 && (
              <p className="text-gray-500 text-sm mt-4">No patient found.</p>
            )}
          </div>
        </>
      )}

      {/* Medical History */}
      {selectedPatient && (
        <>
          <button
            onClick={() => setSelectedPatient(null)}
            className="mb-4 text-sm text-blue-500"
          >
            ← Back
          </button>

          <p className="mb-5 text-lg font-medium text-gray-600">
            {selectedPatient} Medical History
          </p>

          <div className="flex flex-col gap-4">
            {patientHistory.map((item, index) => (
              <div
                key={index}
                className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm"
              >
                <div className="text-sm text-gray-500 mb-2">
                  {new Date(item.appointment_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  | {item.appointment_time.slice(0, 5)}
                </div>

                <p className="mb-1">
                  <span className="font-semibold text-gray-700">Symptom :</span>
                  <span className="text-gray-600 ml-1">{item.symptoms}</span>
                </p>

                <p>
                  <span className="font-semibold text-gray-700">
                    Treatment :
                  </span>
                  <span className="text-gray-600 ml-1">{item.treatment}</span>
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DoctorPatient;
