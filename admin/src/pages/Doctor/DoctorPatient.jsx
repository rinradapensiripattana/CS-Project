import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";

const DoctorPatient = () => {
  const { dToken, appointments, getAppointments } = useContext(DoctorContext);
  const { slotDateFormat, calculateAge } = useContext(AppContext);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

  // กรองเฉพาะรายการที่เสร็จสิ้น (Completed) มีประวัติการรักษา (Medical Record) และชื่อตรงกับคำค้นหา
  const filteredPatients = search
    ? appointments
        .filter(
          (item) =>
            item.isCompleted &&
            item.medicalRecord &&
            item.userData.name.toLowerCase().includes(search.toLowerCase()),
        )
        .reverse() // เรียงจากล่าสุดไปเก่าสุด
    : [];

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium text-gray-600">
        Patient Medical History
      </p>

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
            className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-2">
              <img
                className="w-12 h-12 rounded-full object-cover bg-gray-50"
                src={item.userData.image}
                alt=""
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {item.userData.name}
                </p>
                <p className="text-sm text-gray-600">
                  {item.userData.gender} | Age:{" "}
                  {calculateAge(item.userData.dob)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 font-medium mt-0">
                  {slotDateFormat(item.slotDate)} | {item.slotTime}
                </p>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Symptom (อาการ) :
              </p>
              <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
                {item.medicalRecord.symptoms}
              </p>

              <p className="text-sm font-medium text-gray-700 mb-1">
                Treatment (วิธีการรักษา) :
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {item.medicalRecord.treatment}
              </p>
            </div>
          </div>
        ))}

        {search && filteredPatients.length === 0 && (
          <p className="text-gray-500 text-sm mt-4">
            No patient history found.
          </p>
        )}
      </div>
    </div>
  );
};

export default DoctorPatient;
