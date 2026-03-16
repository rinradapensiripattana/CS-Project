import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../context/AdminContext";
import axios from "axios";
import { toast } from "react-toastify";

const AllPatients = () => {
  const { aToken } = useContext(AdminContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [medicalRecords, setMedicalRecords] = useState([]);
  const [showMedicalModal, setShowMedicalModal] = useState(false);


  const [sortAppointmentOrder, setSortAppointmentOrder] = useState("desc"); 
  const [sortMedicalOrder, setSortMedicalOrder] = useState("desc");

  // =========================
  // CALCULATE AGE
  // =========================
  const calculateAge = (dob) => {
    if (!dob) return "-";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : "-";
  };

  // =========================
  // GET ALL PATIENTS
  // =========================
  const getAllPatients = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/admin/all-patients", {
        headers: { atoken: aToken },
      });
      if (data.success) {
        setPatients(data.patients);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // =========================
  // GET APPOINTMENT HISTORY
  // =========================
  const getPatientAppointments = async (patientId, patient) => {
    try {
      const { data } = await axios.get(
        backendUrl + `/api/admin/patient-appointments/${patientId}`,
        { headers: { atoken: aToken } }
      );
      if (data.success) {
        setAppointments(data.appointments);
        setSelectedPatient(patient);
        setShowModal(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // =========================
  // GET MEDICAL RECORD
  // =========================
  const getMedicalRecord = async (patientId, patient) => {
    try {
      const { data } = await axios.get(
        backendUrl + `/api/admin/patient-medical/${patientId}`,
        { headers: { atoken: aToken } }
      );
      if (data.success) {
        setMedicalRecords(data.records);
        setSelectedPatient(patient);
        setShowMedicalModal(true);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (aToken) {
      getAllPatients();
    }
  }, [aToken]);

  const clearFilters = () => {
    setSearch("");
  };

  // =========================
  // SEARCH FILTER
  // =========================
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl m-5">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        <p className="text-lg font-medium">All Patients</p>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-1 rounded text-sm w-48 sm:w-64"
          />

          {search && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main List Container */}
      <div className="border rounded text-sm bg-white overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header Row - Adjusted Grid Ratios */}
          <div className="grid grid-cols-[0.5fr_2.5fr_2fr_1.5fr_0.7fr_0.8fr_1.5fr] py-3 px-6 border-b bg-gray-50 font-medium">
            <p>#</p>
            <p>Patient</p>
            <p>Email</p>
            <p>Phone</p>
            <p>Gender</p>
            <p className="pl-8">Age</p> {/* Moved Age header to the right */}
            <p className="text-center">Action</p>
          </div>

          {/* Data Rows */}
          {filteredPatients.map((patient, index) => (
            <div
              key={patient.patient_id}
              className="grid grid-cols-[0.5fr_2.5fr_2fr_1.5fr_0.7fr_0.8fr_1.5fr] items-center text-gray-600 py-3 px-6 border-b hover:bg-gray-50 transition-colors"
            >
              <p>{index + 1}</p>

              {/* Patient Info */}
              <div className="flex items-center gap-2">
                <img
                  src={
                    patient.image
                      ? patient.image.startsWith("http")
                        ? patient.image
                        : `${backendUrl}${patient.image}`
                      : "/default_image.png"
                  }
                  className="w-8 h-8 rounded-full object-cover border shadow-sm"
                  alt=""
                  onError={(e) => {
                    e.target.src = "/default_image.png";
                  }}
                />
                <p className="font-medium text-gray-700 truncate">{patient.name}</p>
              </div>

              {/* Email */}
              <p className="truncate pr-2" title={patient.email}>
                {patient.email}
              </p>

              {/* Phone */}
              <p>{patient.phone || "-"}</p>

              {/* Gender */}
              <p className="capitalize">{patient.gender || "-"}</p>

              {/* Age - Added Padding Left to shift it from Gender */}
              <p className="pl-8">{calculateAge(patient.date_of_birth)}</p>

              {/* Action Buttons */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => getPatientAppointments(patient.patient_id, patient)}
                  className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  History
                </button>
                <button
                  onClick={() => getMedicalRecord(patient.patient_id, patient)}
                  className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-xs font-medium hover:bg-emerald-100 transition-colors"
                >
                  Medical
                </button>
              </div>
            </div>
          ))}

          {filteredPatients.length === 0 && (
            <p className="text-center py-6 text-gray-400">
              No patients found matching "{search}"
            </p>
          )}
        </div>
      </div>

        {/* =========================
          APPOINTMENT HISTORY MODAL
         ========================= */}
      {showModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
            style={{ animation: "fadeIn 0.2s ease-out" }}
          >
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>

            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b bg-gray-50/80">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Appointment History
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-0.5">
                  {selectedPatient.name}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-2xl font-medium"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {appointments.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden text-sm shadow-sm">
                  
                  {/* Table Header */}
                  <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr] bg-gray-50 text-gray-500 font-semibold py-3 px-5 border-b text-xs uppercase tracking-wider gap-4">
                    <p>Doctor</p>
                    <p 
                      onClick={() => setSortAppointmentOrder(prev => prev === "desc" ? "asc" : "desc")}
                      className="cursor-pointer flex items-center gap-1 hover:text-gray-800 transition-colors"
                    >
                      Date {sortAppointmentOrder === "asc" ? "↑" : "↓"}
                    </p>
                    <p>Time</p>
                    <p className="text-center">Status</p>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-gray-100">
                    {[...appointments]
                      .sort((a, b) => {
                        const dateA = new Date(a.appointment_date).getTime();
                        const dateB = new Date(b.appointment_date).getTime();
                        return sortAppointmentOrder === "desc" ? dateB - dateA : dateA - dateB;
                      })
                      .map((item) => (
                      <div
                        key={item.appointment_id}
                        className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr] items-center py-4 px-5 hover:bg-blue-50/40 transition-colors gap-4"
                      >
                        <p className="text-gray-900 font-semibold truncate" title={item.doctor_name}>
                          {item.doctor_name}
                        </p>
                        <p className="text-gray-600">
                          {new Date(item.appointment_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-gray-600">
                          {item.appointment_time?.slice(0, 5)}
                        </p>
                        <div className="flex justify-center">
                          <span
                            className={`font-medium capitalize px-3 py-1 rounded-full text-[13px] ${
                              item.status === "completed"
                                ? "bg-green-50 text-green-600 border border-green-100"
                                : item.status === "cancelled"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <p className="text-gray-600 font-medium">No appointment history found</p>
                  <p className="text-sm text-gray-400 mt-1">This patient hasn't booked any appointments yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* =========================
          MEDICAL RECORD MODAL
         ========================= */}
      {showMedicalModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
            style={{ animation: "fadeIn 0.2s ease-out" }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b bg-gray-50/80">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Medical Records
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-0.5">
                  {selectedPatient.name}
                </p>
              </div>
              <button
                onClick={() => setShowMedicalModal(false)}
                className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-2xl font-medium"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {medicalRecords.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden text-sm shadow-sm">
                  {/* Table Header */}
                  <div className="grid grid-cols-[1.5fr_2fr_2fr] bg-gray-50 text-gray-500 font-semibold py-3 px-5 border-b text-xs uppercase tracking-wider">
                    <p 
                      onClick={() => setSortMedicalOrder(prev => prev === "desc" ? "asc" : "desc")}
                      className="cursor-pointer flex items-center gap-1 hover:text-gray-800 transition-colors"
                    >
                      Doctor & Date {sortMedicalOrder === "asc" ? "↑" : "↓"}
                    </p>
                    <p>Symptoms</p>
                    <p>Treatment</p>
                  </div>
                  
                  {/* Table Body */}
                  <div className="divide-y divide-gray-100">
                    {[...medicalRecords]
                      .sort((a, b) => {
                        const dateA = new Date(a.record_date).getTime();
                        const dateB = new Date(b.record_date).getTime();
                        return sortMedicalOrder === "desc" ? dateB - dateA : dateA - dateB;
                      })
                      .map((record) => (
                      <div
                        key={record.record_id}
                        className="grid grid-cols-[1.5fr_2fr_2fr] items-start py-4 px-5 hover:bg-blue-50/40 transition-colors gap-4"
                      >
                        <div className="pr-2">
                          <p className="text-gray-900 font-semibold">
                            {record.doctor_name}
                          </p>
                          <div className="flex items-center text-[13px] text-gray-500 mt-1.5 gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <span>
                              {new Date(record.record_date).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <p className={`whitespace-pre-wrap leading-relaxed ${record.symptom ? "text-gray-700" : "text-gray-300 font-light"}`}>
                          {record.symptom || "-"}
                        </p>
                        <p className={`whitespace-pre-wrap leading-relaxed ${record.treatment ? "text-gray-700" : "text-gray-300 font-light"}`}>
                          {record.treatment || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <p className="text-gray-600 font-medium">No medical records found</p>
                  <p className="text-sm text-gray-400 mt-1">This patient hasn't had any recorded treatments yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPatients;