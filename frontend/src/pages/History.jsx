import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const History = () => {
  const { backendUrl, token } = useContext(AppContext);
  const [historyData, setHistoryData] = useState([]);
  const [filterDate, setFilterDate] = useState("");

  const months = [
    " ",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split("_");
    return (
      dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    );
  };

  const getHistory = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/appointments", {
        headers: { token },
      });
      if (data.success) {
        // กรองเฉพาะนัดหมายที่เสร็จสิ้นและมีประวัติการรักษา
        const filteredData = data.appointments.filter(
          (item) => item.isCompleted && item.medicalRecord,
        );
        setHistoryData(filteredData.reverse());
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (token) {
      getHistory();
    }
  }, [token, backendUrl]);

  const filteredHistory = historyData.filter((item) => {
    if (!filterDate) return true;
    const parts = item.slotDate.split("_");
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate === filterDate;
  });

  return (
    <div>
      <div className="flex justify-between items-center pb-3 border-b">
        <p className="font-medium text-zinc-700">Medical History</p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm text-black"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-5">
        {filteredHistory.map((item, index) => (
          <div
            key={index}
            className="border border-blue-200 rounded-xl p-3 sm:p-4 bg-white shadow-sm"
          >
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-3">
                <img
                  className="w-12 h-12 rounded-full object-cover bg-indigo-50"
                  src={item.docData.image}
                  alt=""
                />
                <div>
                  <p className="text-sm font-medium text-zinc-700">
                    Dr. {item.docData.name}
                  </p>
                  <p className="text-sm text-zinc-600">{item.docData.degree}</p>
                  <p className="text-sm text-zinc-500 font-medium mt-1">
                    Date: {item.slotDate && slotDateFormat(item.slotDate)} |{" "}
                    {item.slotTime}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-sm font-medium text-zinc-700 mb-0.5">
                Symptom (อาการ) :
              </p>
              <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
                {item.medicalRecord.symptoms}
              </p>

              <p className="text-sm font-medium text-zinc-700 mb-0.5">
                Treatment (วิธีการรักษา) :
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {item.medicalRecord.treatment}
              </p>
            </div>
          </div>
        ))}
        {filteredHistory.length === 0 && (
          <p className="text-center text-gray-500 mt-10">
            No medical history found.
          </p>
        )}
      </div>
    </div>
  );
};

export default History;
