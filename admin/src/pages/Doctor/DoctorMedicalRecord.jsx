import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";

const DoctorMedicalRecord = () => {
  const { dToken, appointments, getAppointments, profileData, getProfileData } =
    useContext(DoctorContext);

  const { backendUrl, calculateAge } = useContext(AppContext);

  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointmentData, setAppointmentData] = useState(null);

  const [symptoms, setSymptoms] = useState("");
  const [treatment, setTreatment] = useState("");

  // follow-up
  const [followupDate, setFollowupDate] = useState("");
  const [followupTime, setFollowupTime] = useState("");

  // โหลด appointment
  useEffect(() => {
    if (dToken) {
      getAppointments();
      getProfileData();
    }
  }, [dToken]);

  // หา appointment จาก id
  useEffect(() => {
    if (appointments.length > 0) {
      const found = appointments.find(
        (item) => item.appointment_id.toString() === appointmentId,
      );

      if (found) {
        setAppointmentData(found);
        setSymptoms(found.symptoms || "");
        setTreatment(found.treatment || "");
      }
    }
  }, [appointments, appointmentId]);

  // save medical record
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/complete-appointment",
        {
          appointment_id: appointmentId,
          symptoms,
          treatment,
          followup_date: followupDate,
          followup_time: followupTime,
        },
        {
          headers: {
            Authorization: `Bearer ${dToken}`,
          },
        },
      );

      if (data.success) {
        toast.success("Appointment Completed");

        if (followupDate) {
          toast.success("Follow-up appointment created");
        }

        navigate("/doctor-appointments");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return appointmentData ? (
    <>
      {/* ===================== */}
      {/* SCREEN UI (ซ่อนตอนปริ้นท์) */}
      {/* ===================== */}
      <div className="m-5 w-full max-w-5xl print:hidden">
        <h2 className="text-lg font-medium mb-4">Medical Record & Treatment</h2>

        <div className="bg-white p-8 border rounded shadow-sm">
          {/* Patient Info */}
          <div className="flex items-center gap-5 mb-8">
            <img
              className="w-24 h-24 rounded-full object-cover border"
              src={
                appointmentData.image
                  ? appointmentData.image.startsWith("http")
                    ? appointmentData.image
                    : `${backendUrl}${appointmentData.image}`
                  : "/default_image.png"
              }
              onError={(e) => {
                e.target.src = "/default_image.png";
              }}
              alt=""
            />

            <div>
              <p className="text-2xl font-semibold">{appointmentData.name}</p>

              <p className="text-gray-600">
                Age: {calculateAge(appointmentData.date_of_birth)}
              </p>

              <p className="text-gray-600">
                {new Date(appointmentData.appointment_date).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "short", year: "numeric" },
                )}
                {" | "}
                {appointmentData.appointment_time.slice(0, 5)}
              </p>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={onSubmitHandler} className="flex flex-col gap-6">
            {/* Symptoms */}
            <div>
              <label className="font-medium text-gray-700">Symptoms</label>

              <textarea
                className="w-full border rounded px-4 py-3 mt-2 outline-primary"
                rows="4"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
              />
            </div>

            {/* Treatment */}
            <div>
              <label className="font-medium text-gray-700">Treatment</label>

              <textarea
                className="w-full border rounded px-4 py-3 mt-2 outline-primary"
                rows="4"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                required
              />
            </div>

            {/* Follow-up */}
            <div>
              <label className="font-medium text-gray-700">
                Follow-up Appointment (optional)
              </label>

              <div className="flex gap-4 mt-2">
                <input
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="border rounded px-4 py-2 outline-primary"
                  min={new Date().toISOString().split("T")[0]}
                />

                <input
                  type="time"
                  value={followupTime}
                  onChange={(e) => setFollowupTime(e.target.value)}
                  className="border rounded px-4 py-2 outline-primary"
                />
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-white border-2 border-primary text-primary py-4 rounded-full hover:bg-blue-50 transition-all text-lg font-medium shadow-sm flex items-center justify-center gap-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  ></path>
                </svg>
                Print Certificate
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary text-white py-4 rounded-full hover:bg-primary/90 transition-all text-lg font-medium shadow-md"
              >
                Save & Complete
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===================== */}
      {/* PRINT UI (แสดงเฉพาะตอนปริ้นท์) */}
      {/* ===================== */}
      <div
        className="hidden print:flex flex-col w-[210mm] h-[296mm] overflow-hidden mx-auto text-black bg-white relative box-border"
        style={{ fontFamily: "'Sarabun', sans-serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
          @media print {
            @page { size: A4 portrait; margin: 0; }
            body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
            /* ซ่อน Popup แจ้งเตือนของ Toastify ตอนสั่งปริ้นท์ */
            .Toastify { display: none !important; }
          }
        `}</style>

        {/* กรอบสไตล์ใบรับรอง (Ornamental Border) */}
        <div className="absolute inset-4 border-[6px] border-double border-gray-300 pointer-events-none z-0"></div>

        {/* Main Content Wrapper */}
        <div className="flex flex-col h-full pt-12 pb-10 px-14 relative z-10">
          
          {/* Header */}
          <div className="text-center border-b-[3px] border-gray-800 pb-5 mb-6 mt-2">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-wide">
              ใบรับรองแพทย์
            </h1>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Medical Certificate
            </p>
            <h2 className="text-xl font-bold text-gray-800 uppercase">
              HelloDr. Clinic
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              เลขที่ 128/45 ถนนสุขุมวิท 77 แขวงพระโขนงเหนือ เขตวัฒนา กรุงเทพมหานคร 10260
            </p>
            <p className="text-sm text-gray-600">
              โทร: 02-123-1234 | อีเมล: hellodoctor@gmail.com
            </p>
          </div>

          {/* Body Paragraph */}
          <div className="mb-6 text-base leading-relaxed text-gray-800 space-y-2">
            <div className="flex items-center gap-2">
              <span>ข้าพเจ้า</span>
              <span className="font-semibold text-lg border-b border-dotted border-gray-400 flex-1 text-center">
                {profileData?.name || "แพทย์ผู้ทำการรักษา"}
              </span>
              <span>ผู้ประกอบวิชาชีพเวชกรรม</span>
            </div>
            <p className="mt-1">
              สถานที่ประกอบวิชาชีพเวชกรรม{" "}
              <span className="font-semibold text-lg ml-2">HelloDoctor Clinic</span>
            </p>
          </div>

          {/* Patient Info Box */}
          <div className="mb-6 text-base bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-300 pb-2">
              ข้อมูลผู้รับการตรวจ (Patient Information)
            </h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-gray-700">
              <p>
                <span className="text-gray-500 w-24 inline-block">ชื่อ-นามสกุล:</span>
                <span className="font-semibold text-lg text-gray-900">{appointmentData.name}</span>
              </p>
              <p>
                <span className="text-gray-500 w-12 inline-block">อายุ:</span>
                <span className="font-semibold text-lg text-gray-900">{calculateAge(appointmentData.date_of_birth)}</span> ปี
              </p>
              <p>
                <span className="text-gray-500 w-24 inline-block">เพศ:</span>
                <span className="font-semibold text-lg text-gray-900 capitalize">{appointmentData.gender || "-"}</span>
              </p>
              <p>
                <span className="text-gray-500 w-28 inline-block">วันที่รับการตรวจ:</span>
                <span className="font-semibold text-lg text-gray-900">
                  {new Date(appointmentData.appointment_date).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </p>
            </div>
          </div>

          {/* Medical Info */}
          <div className="flex-1 mb-4 flex flex-col gap-4">
            <h4 className="font-bold text-gray-800 border-b-2 border-gray-800 pb-1 text-lg uppercase">
              ความเห็นแพทย์ (Medical Assessment)
            </h4>

            <div className="flex flex-col flex-1">
              <p className="font-semibold text-gray-700 mb-2">อาการ และ การวินิจฉัยโรค (Diagnosis):</p>
              <div className="flex-1 text-base whitespace-pre-line text-gray-900 leading-relaxed min-h-[60px] p-4 bg-blue-50/30 border border-blue-100 rounded-md">
                {symptoms || "-"}
              </div>
            </div>

            <div className="flex flex-col flex-1">
              <p className="font-semibold text-gray-700 mb-2">การรักษา และ คำแนะนำ (Treatment & Recommendation):</p>
              <div className="flex-1 text-base whitespace-pre-line text-gray-900 leading-relaxed min-h-[60px] p-4 bg-green-50/30 border border-green-100 rounded-md">
                {treatment || "-"}
              </div>
            </div>
          </div>

          {/* Footer / Signature (จะถูกดันไปอยู่ล่างสุดของกระดาษเสมอด้วย mt-auto) */}
          <div className="mt-auto pt-6">
            <div className="mb-6 text-sm text-gray-500 text-center">
              <p>ขอรับรองว่าข้อความข้างต้นเป็นความจริง</p>
            </div>
            <div className="flex justify-end pr-8">
              <div className="text-center w-64">
                <div className="border-b border-gray-500 mb-2 h-10"></div>
                <p className="font-semibold text-base text-gray-900 mt-2">
                  ( {profileData?.name || ".............................................................."} )
                </p>
                <p className="text-sm text-gray-600 mt-1">แพทย์ผู้ตรวจรักษา (Attending Physician)</p>
                <p className="text-sm text-gray-600 mt-2">
                  วันที่ออกใบรับรอง:{" "}
                  <span className="border-b border-dotted border-gray-400 px-4 inline-block text-center min-w-[100px]">
                    {new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" })}
                  </span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  ) : (
    <div className="m-5 w-full max-w-5xl animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="bg-white p-8 border rounded shadow-sm">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-24 h-24 rounded-full bg-gray-200"></div>
          <div className="flex flex-col gap-3">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-32 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorMedicalRecord;
