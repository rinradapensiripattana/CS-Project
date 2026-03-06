import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";

const DoctorAppointments = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const { dToken, appointments, getAppointments, cancelAppointment } =
    useContext(DoctorContext);

  const { calculateAge } = useContext(AppContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  // Filter by status
  const filteredByStatus = appointments.filter((item) => {
    if (activeTab === "upcoming")
      return item.status === "confirmed" || item.status === "ongoing";
    if (activeTab === "completed") return item.status === "completed";
    if (activeTab === "cancelled") return item.status === "cancelled";
    return true;
  });

  // Search
  const filteredBySearch = filteredByStatus.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Date filter
  const filteredByDate = filteredBySearch.filter((item) => {
    const appointmentDate = new Date(item.appointment_date);

    if (fromDate && appointmentDate < new Date(fromDate)) return false;
    if (toDate && appointmentDate > new Date(toDate)) return false;

    return true;
  });

  // Sort
  const finalFiltered = [...filteredByDate].sort((a, b) => {
    const dateA = new Date(a.appointment_date);
    const dateB = new Date(b.appointment_date);

    const [hourA, minuteA] = a.appointment_time.split(":");
    const [hourB, minuteB] = b.appointment_time.split(":");

    dateA.setHours(hourA, minuteA, 0);
    dateB.setHours(hourB, minuteB, 0);

    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  return (
    <div className="w-full max-w-6xl m-5">

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        <p className="text-lg font-medium">Doctor Appointments</p>

        <div className="flex flex-wrap items-center gap-2">

          <input
            type="text"
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-1 rounded text-sm w-48"
          />

          {/* From */}
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-600">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border px-2 py-1 rounded text-sm"
            />
          </div>

          {/* To */}
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-600">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border px-2 py-1 rounded text-sm"
            />
          </div>

          {(search || fromDate || toDate) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-4">
        {["upcoming", "completed", "cancelled"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 capitalize ${
              activeTab === tab
                ? "border-b-2 border-primary text-primary font-medium"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded text-sm max-h-[70vh] overflow-y-auto">

        {/* Header */}
        <div className="hidden sm:grid grid-cols-[0.5fr_2fr_1fr_2fr_1fr] gap-2 py-3 px-6 border-b bg-gray-50 font-medium">
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>

          <p
            onClick={() =>
              setSortOrder(sortOrder === "asc" ? "desc" : "asc")
            }
            className="cursor-pointer flex items-center gap-1"
          >
            Date & Time {sortOrder === "asc" ? "↑" : "↓"}
          </p>

          <p className="text-center">Action</p>
        </div>

        {finalFiltered.length === 0 && (
          <p className="text-center py-6 text-gray-400">
            No appointments found
          </p>
        )}

        {finalFiltered.map((item, index) => (
          <div
            key={item.appointment_id}
            className="grid grid-cols-[0.5fr_2fr_1fr_2fr_1fr] gap-2 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50"
          >
            <p>{index + 1}</p>

            <div className="flex items-center gap-2">
              <img
                src={
                  item.image
                    ? item.image.startsWith("http")
                      ? item.image
                      : `${backendUrl}${item.image}`
                    : "/default_image.png"
                }
                className="w-8 h-8 rounded-full object-cover"
                alt=""
              />
              <p>{item.name}</p>
            </div>

            <p>{calculateAge(item.date_of_birth)}</p>

            <p>
              {new Date(item.appointment_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              , {item.appointment_time.slice(0, 5)}
            </p>

            <div className="flex justify-center gap-2">

              {item.status === "cancelled" && (
                <p className="text-red-400 text-xs font-medium">Cancelled</p>
              )}

              {item.status === "completed" && (
                <p className="text-green-500 text-xs font-medium">Completed</p>
              )}

              {(item.status === "confirmed" || item.status === "ongoing") && (
                <>
                  <img
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelAppointment(item.appointment_id);
                    }}
                    className="w-8 cursor-pointer"
                    src={assets.cancel_icon}
                    alt=""
                  />

                  <img
                    onClick={(e) => {
                      e.stopPropagation();

                      const appointmentDateTime = new Date(
                        item.appointment_date
                      );

                      const [hours, minutes] =
                        item.appointment_time.split(":");

                      appointmentDateTime.setHours(hours, minutes, 0, 0);

                      const allowedTime = new Date(
                        appointmentDateTime.getTime() - 30 * 60 * 1000
                      );

                      if (new Date() < allowedTime) {
                        toast.error("ยังไม่ถึงเวลานัดหมาย");
                        return;
                      }

                      navigate(
                        `/doctor-medical-record/${item.appointment_id}`
                      );
                    }}
                    className="w-8 cursor-pointer"
                    src={assets.tick_icon}
                    alt=""
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorAppointments;