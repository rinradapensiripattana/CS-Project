import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../context/AdminContext";
import { toast } from "react-toastify";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const CreateAppointment = () => {
  const { doctors, getAllDoctors, aToken } = useContext(AdminContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const location = useLocation();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  // ดึงค่า prefillDate จาก state ถ้ามี
  const [appointmentDate, setAppointmentDate] = useState(
    location.state?.prefillDate || "",
  );
  const [appointmentTime, setAppointmentTime] = useState("");

  const [searchPatient, setSearchPatient] = useState("");
  const [showPatientList, setShowPatientList] = useState(false);
  const [searchDoctor, setSearchDoctor] = useState("");
  const [showDoctorList, setShowDoctorList] = useState(false);

  const fetchAllPatients = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/all-patients`, {
        headers: { atoken: aToken },
      });
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (error) {
      toast.error("Failed to fetch patients");
    }
  };

  useEffect(() => {
    if (aToken) {
      getAllDoctors();
      fetchAllPatients();
    }
  }, [aToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !selectedPatient ||
      !selectedDoctor ||
      !appointmentDate ||
      !appointmentTime
    ) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const appointmentData = {
        patient_id: selectedPatient,
        doctor_id: selectedDoctor,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
      };

      const { data } = await axios.post(
        `${backendUrl}/api/admin/create-appointment`,
        appointmentData,
        {
          headers: { atoken: aToken },
        },
      );

      if (data.success) {
        toast.success(data.message);
        if (location.state?.prefillDate) {
          navigate("/all-appointments", {
            state: { initialViewMode: "calendar" },
          });
        } else {
          setSelectedPatient("");
          setSearchPatient("");
          setSelectedDoctor("");
          setSearchDoctor("");
          setAppointmentDate("");
          setAppointmentTime("");
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="m-5 w-full max-w-2xl">
      {/* แสดงปุ่ม Back ถ้ามาจาหน้า Calendar */}
      {location.state?.prefillDate && (
        <button
          type="button"
          onClick={() =>
            navigate("/all-appointments", {
              state: { initialViewMode: "calendar" },
            })
          }
          className="text-xs text-blue-500 hover:text-primary transition-colors flex items-center gap-1 mb-1"
        >
          &larr; Back
        </button>
      )}

      <p className="text-lg font-medium mb-4">Create New Appointment</p>

      <div className="bg-white px-6 py-8 border rounded space-y-4 text-sm text-gray-600">
        <div className="relative">
          <p className="mb-1 font-medium">Select Patient</p>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Patient"
              value={searchPatient}
              onChange={(e) => {
                setSearchPatient(e.target.value);
                setSelectedPatient("");
                setShowPatientList(true);
              }}
              onFocus={() => setShowPatientList(true)}
              onBlur={() => setTimeout(() => setShowPatientList(false), 200)}
              className="w-full border rounded px-3 py-2 outline-primary pr-10"
            />
            {searchPatient && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchPatient("");
                  setSelectedPatient("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            )}
          </div>
          {showPatientList && (
            <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto mt-1">
              {patients
                .filter(
                  (p) =>
                    p.name
                      .toLowerCase()
                      .includes(searchPatient.toLowerCase()) ||
                    p.email.toLowerCase().includes(searchPatient.toLowerCase()),
                )
                .map((patient) => (
                  <div
                    key={patient.patient_id}
                    onClick={() => {
                      setSelectedPatient(patient.patient_id);
                      setSearchPatient(`${patient.name} (${patient.email})`);
                      setShowPatientList(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {patient.name}{" "}
                    <span className="text-gray-500 text-xs">
                      ({patient.email})
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="relative">
          <p className="mb-1 font-medium">Select Doctor</p>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Doctor"
              value={searchDoctor}
              onChange={(e) => {
                setSearchDoctor(e.target.value);
                setSelectedDoctor("");
                setShowDoctorList(true);
              }}
              onFocus={() => setShowDoctorList(true)}
              onBlur={() => setTimeout(() => setShowDoctorList(false), 200)}
              className="w-full border rounded px-3 py-2 outline-primary pr-10"
            />
            {searchDoctor && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchDoctor("");
                  setSelectedDoctor("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            )}
          </div>
          {showDoctorList && (
            <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto mt-1">
              {doctors
                .filter((d) =>
                  d.name.toLowerCase().includes(searchDoctor.toLowerCase()),
                )
                .map((doctor) => (
                  <div
                    key={doctor.doctor_id}
                    onClick={() => {
                      setSelectedDoctor(doctor.doctor_id);
                      setSearchDoctor(doctor.name);
                      setShowDoctorList(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {doctor.name}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div>
          <label className="font-medium text-gray-600">
            Appointment Date & Time
          </label>
          <div className="flex gap-4 mt-2">
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="border rounded px-4 py-2 outline-primary"
              min={new Date().toISOString().split("T")[0]}
            />
            <input
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="border rounded px-4 py-2 outline-primary"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="bg-primary text-white px-10 py-3 rounded-full mt-4
                       hover:bg-primary/90 transition-all mx-auto block"
        >
          Save Appointment
        </button>
      </div>
    </form>
  );
};

export default CreateAppointment;
