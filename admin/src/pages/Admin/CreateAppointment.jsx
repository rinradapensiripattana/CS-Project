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

  const [appointmentDate, setAppointmentDate] = useState(
    location.state?.prefillDate || "",
  );
  const [appointmentTime, setAppointmentTime] = useState("");

  const [searchPatient, setSearchPatient] = useState("");
  const [showPatientList, setShowPatientList] = useState(false);
  const [searchDoctor, setSearchDoctor] = useState("");
  const [showDoctorList, setShowDoctorList] = useState(false);

  const [bookedTimes, setBookedTimes] = useState([]);

  // generate time slot 09:00 - 20:30
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      ["00", "30"].forEach((minute) => {
        const time = `${String(hour).padStart(2, "0")}:${minute}`;
        slots.push(time);
      });
    }
    return slots;
  };

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

  const fetchBookedTimes = async (date, doctorId) => {
    if (!date || !doctorId) return;

    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/booked-times`, {
        params: {
          date: appointmentDate,
          doctorId: selectedDoctor,
          patientId: selectedPatient,
        },
        headers: { atoken: aToken },
      });

      if (data.success) {
        setBookedTimes(data.times);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (aToken) {
      getAllDoctors();
      fetchAllPatients();
    }
  }, [aToken]);

  useEffect(() => {
    if (appointmentDate && selectedDoctor) {
      fetchBookedTimes(appointmentDate, selectedDoctor);
    }
  }, [appointmentDate, selectedDoctor]);

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
        {/* PATIENT */}
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
              className="w-full border rounded px-3 py-2 outline-primary pr-8"
            />
            {searchPatient && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // ป้องกันการเสีย focus เพื่อไม่ให้ onBlur ทำงานขัดจังหวะ
                  setSearchPatient("");
                  setSelectedPatient("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-lg leading-none"
              >
                &times;
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

        {/* DOCTOR */}
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
              className="w-full border rounded px-3 py-2 outline-primary pr-8"
            />
            {searchDoctor && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // ป้องกันการเสีย focus
                  setSearchDoctor("");
                  setSelectedDoctor("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-lg leading-none"
              >
                &times;
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

        {/* DATE + TIME */}
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

            <select
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="border rounded pl-4 pr-10 py-2 outline-primary appearance-none bg-white
             bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E')] 
             bg-[length:16px] bg-[right_12px_center] bg-no-repeat"
            >
              <option value="">Select Time</option>
              {generateTimeSlots()
                .filter((time) => !bookedTimes.includes(time))
                .map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
            </select>
          </div>
        </div>

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
