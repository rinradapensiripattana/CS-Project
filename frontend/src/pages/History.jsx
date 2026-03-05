import React, { useContext, useEffect, useState, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const History = () => {
  const { axiosInstance, token, backendUrl } = useContext(AppContext);
  const [historyData, setHistoryData] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getHistory = async () => {
    try {
      const { data } = await axiosInstance.get("/api/user/history");
      if (data.success) {
        setHistoryData(data.history);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (token) {
      getHistory();
    }
  }, [token]);

  const filteredHistory = useMemo(() => {
    return historyData
      .filter((item) => {
        if (!filterDate) return true;
        return item.record_date === filterDate;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.record_date}T${a.appointment_time}`);
        const dateB = new Date(`${b.record_date}T${b.appointment_time}`);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [historyData, filterDate, sortOrder]);

  return (
    <div>
      <div className="flex justify-between items-center pb-3 border-b">
        <p className="font-medium text-zinc-700">Medical History</p>
        <div className="flex items-center gap-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border rounded px-2 py-1 text-sm text-black"
          >
            <option value="desc">Latest</option>
            <option value="asc">Oldest</option>
          </select>

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

      <div className="flex flex-col gap-4 mt-5">
        {filteredHistory.map((item) => (
          <div
            key={item.record_id}
            className="border border-primary/40 rounded-xl p-4 sm:p-5 bg-white shadow-sm"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              {/* Doctor */}
              <div className="flex items-center gap-3">
                <img
                  className="w-12 h-12 rounded-full object-cover bg-indigo-50"
                  src={
                    item.doctor_image
                      ? backendUrl + item.doctor_image
                      : "/default_image.png"
                  }
                  alt=""
                />
                <p className="text-sm font-semibold text-zinc-800">
                  {item.doctor_name}
                </p>
              </div>

              {/* Date */}
              <p className="text-sm text-gray-500 font-medium">
                {formatDate(item.record_date)} | {item.appointment_time}
              </p>
            </div>

            {/* Content */}
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium text-zinc-800">
                  Symptom (อาการ) :
                </span>{" "}
                {item.symptom || "-"}
              </p>

              <p>
                <span className="font-medium text-zinc-800">
                  Treatment (วิธีการรักษา) :
                </span>{" "}
                {item.treatment || "-"}
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
