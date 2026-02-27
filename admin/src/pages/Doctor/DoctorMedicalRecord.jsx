import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const DoctorMedicalRecord = () => {
  const { dToken, appointments, getAppointments } = useContext(DoctorContext);
  const { backendUrl, slotDateFormat, calculateAge } = useContext(AppContext);
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointmentData, setAppointmentData] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [treatment, setTreatment] = useState("");

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

  useEffect(() => {
    if (appointments.length > 0 && appointmentId) {
      const doc = appointments.find((doc) => doc._id === appointmentId);
      if (doc) {
        setAppointmentData(doc);
        if (doc.medicalRecord) {
          setSymptoms(doc.medicalRecord.symptoms);
          setTreatment(doc.medicalRecord.treatment);
        }
      }
    }
  }, [appointments, appointmentId]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      // เรียก API complete-appointment พร้อมส่งข้อมูล medicalRecord ไปด้วย
      // หมายเหตุ: ต้องมีการแก้ไข Backend ให้รองรับการรับค่า medicalRecord
      const { data } = await axios.post(
        backendUrl + "/api/doctor/complete-appointment",
        {
          appointmentId,
          medicalRecord: {
            symptoms,
            treatment,
          },
        },
        { headers: { dToken } },
      );

      if (data.success) {
        toast.success(data.message);
        navigate("/doctor-appointments");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  return appointmentData ? (
    <div className="m-5 w-full max-w-4xl">
      <p className="mb-3 text-lg font-medium text-gray">
        Medical Record & Treatment
      </p>

      <div className="bg-white px-8 py-8 border rounded w-full max-w-4xl shadow-sm">
        {/* Patient Info */}
        <div className="flex items-center gap-4 mb-8">
          <img
            className="w-20 h-20 rounded-full object-cover"
            src={appointmentData.userData.image}
            alt=""
          />
          <div>
            <p className="text-xl font-medium text-gray-800">
              {appointmentData.userData.name}
            </p>
            <p className="text-gray-600">
              {appointmentData.userData.gender} | Age:{" "}
              {calculateAge(appointmentData.userData.dob)}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Date & Time :</span>{" "}
              {slotDateFormat(appointmentData.slotDate)} |{" "}
              {appointmentData.slotTime}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-medium text-gray-700">Symptom (อาการ) :</p>
            <textarea
              className="w-full border rounded px-3 py-2 outline-primary"
              rows={4}
              placeholder=""
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              required
              readOnly={appointmentData.isCompleted}
            />
          </div>

          <div className="flex flex-col gap-1">
            <p className="font-medium text-gray-700">
              Treatment (วิธีการรักษา) :
            </p>
            <textarea
              className="w-full border rounded px-3 py-2 outline-primary"
              rows={4}
              placeholder=""
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              required
              readOnly={appointmentData.isCompleted}
            />
          </div>

          {!appointmentData.isCompleted && (
            <button
              type="submit"
              className="bg-primary text-white px-10 py-3 rounded-full mt-4 hover:bg-primary/90 transition-all w-fit"
            >
              Complete & Save Record
            </button>
          )}
        </form>
      </div>
    </div>
  ) : (
    <div className="m-5 text-gray-500">Loading appointment data...</div>
  );
};

export default DoctorMedicalRecord;
