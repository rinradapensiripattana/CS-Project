import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const DoctorMedicalRecord = () => {
  const { dToken, appointments, getAppointments } =
    useContext(DoctorContext);

  const { backendUrl, calculateAge } =
    useContext(AppContext);

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
    }
  }, [dToken]);

  // หา appointment จาก id
  useEffect(() => {
    if (appointments.length > 0) {

      const found = appointments.find(
        (item) =>
          item.appointment_id.toString() === appointmentId
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
          followup_time: followupTime
        },
        {
          headers: {
            Authorization: `Bearer ${dToken}`,
          },
        }
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

    <div className="m-5 w-full max-w-5xl">

      <h2 className="text-lg font-medium mb-4">
        Medical Record & Treatment
      </h2>

      <div className="bg-white p-8 border rounded shadow-sm">

        {/* Patient Info */}
        <div className="flex items-center gap-5 mb-8">

          <img
            className="w-24 h-24 rounded-full object-cover border"
            src={
              appointmentData.image
                ? `${backendUrl}${appointmentData.image}`
                : "/default_image.png"
            }
            onError={(e) => {
              e.target.src = "/default_image.png";
            }}
            alt=""
          />

          <div>
            <p className="text-2xl font-semibold">
              {appointmentData.name}
            </p>

            <p className="text-gray-600">
              Age: {calculateAge(appointmentData.date_of_birth)}
            </p>

            <p className="text-gray-600">
              {new Date(
                appointmentData.appointment_date
              ).toLocaleDateString("th-TH")}
              {" | "}
              {appointmentData.appointment_time}
            </p>
          </div>

        </div>


        {/* FORM */}
        <form
          onSubmit={onSubmitHandler}
          className="flex flex-col gap-6"
        >

          {/* Symptoms */}
          <div>
            <label className="font-medium text-gray-700">
              Symptoms
            </label>

            <textarea
              className="w-full border rounded px-4 py-3 mt-2 outline-primary"
              rows="4"
              value={symptoms}
              onChange={(e) =>
                setSymptoms(e.target.value)
              }
              required
            />
          </div>


          {/* Treatment */}
          <div>
            <label className="font-medium text-gray-700">
              Treatment
            </label>

            <textarea
              className="w-full border rounded px-4 py-3 mt-2 outline-primary"
              rows="4"
              value={treatment}
              onChange={(e) =>
                setTreatment(e.target.value)
              }
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
                onChange={(e) =>
                  setFollowupDate(e.target.value)
                }
                className="border rounded px-4 py-2 outline-primary"
              />

              <input
                type="time"
                value={followupTime}
                onChange={(e) =>
                  setFollowupTime(e.target.value)
                }
                className="border rounded px-4 py-2 outline-primary"
              />

            </div>

          </div>


          {/* Save Button */}
          <button
            type="submit"
            className="bg-primary text-white py-4 rounded-full mt-4
                       hover:bg-primary/90 transition-all
                       w-full max-w-lg mx-auto text-lg font-medium"
          >
            Save & Complete Appointment
          </button>

        </form>

      </div>

    </div>

  ) : (

    <div className="m-5 text-gray-500">
      Loading appointment data...
    </div>

  );
};

export default DoctorMedicalRecord;