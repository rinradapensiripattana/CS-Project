import React, { useEffect, useState, useMemo, useContext } from "react";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";

const AllAppointments = () => {
  const { aToken, appointments, getAllAppointments, cancelAppointment } =
    useContext(AdminContext);

  const [activeTab, setActiveTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (aToken) {
      getAllAppointments();
    }
  }, [aToken]);

  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  const getType = (item) => {
    if (item.status === "cancelled") return "cancelled";
    if (item.status === "completed") return "completed";
    return "upcoming";
  };

  const formatDateTime = (dateString, timeString) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${formattedDate} , ${timeString.slice(0, 5)}`;
  };

  const filteredAppointments = useMemo(() => {
    const now = new Date();

    let filtered = appointments
      .filter((item) => {
        if (getType(item) !== activeTab) return false;

        // ซ่อน appointment ที่ผ่านเวลาแล้วจาก upcoming
        if (activeTab === "upcoming") {
          const appointmentDateTime = new Date(item.appointment_date);
          const [hour, minute] = item.appointment_time.split(":");
          appointmentDateTime.setHours(hour, minute, 0);

          if (appointmentDateTime < now) return false;
        }

        return true;
      })

      .filter((item) => {
        if (!search) return true;

        return (
          item.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
          item.doctor_name?.toLowerCase().includes(search.toLowerCase())
        );
      })

      .filter((item) => {
        const appointmentDate = new Date(item.appointment_date);

        if (fromDate && appointmentDate < new Date(fromDate)) return false;
        if (toDate && appointmentDate > new Date(toDate)) return false;

        return true;
      });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.appointment_date);
      const dateB = new Date(b.appointment_date);

      const [hourA, minuteA] = a.appointment_time.split(":");
      const [hourB, minuteB] = b.appointment_time.split(":");

      dateA.setHours(hourA, minuteA, 0);
      dateB.setHours(hourB, minuteB, 0);

      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [appointments, activeTab, search, fromDate, toDate, sortOrder]);

  return (
    <div className="w-full max-w-6xl m-5">

      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        <p className="text-lg font-medium">All Appointments</p>

        <div className="flex flex-wrap items-center gap-2">

          <input
            type="text"
            placeholder="Search patient or doctor..."
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
      <div className="flex gap-6 border-b mb-5">
        {["upcoming", "completed", "cancelled"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 capitalize transition ${
              activeTab === tab
                ? "border-b-2 border-primary font-medium text-primary"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded text-sm">

        {/* Header */}
        <div className="grid grid-cols-[0.5fr_3fr_3fr_3fr_1fr] py-3 px-6 border-b bg-gray-50 font-medium">
          <p>#</p>
          <p>Patient</p>

          <p
            onClick={() =>
              setSortOrder(sortOrder === "asc" ? "desc" : "asc")
            }
            className="cursor-pointer flex items-center gap-1"
          >
            Date & Time {sortOrder === "asc" ? "↑" : "↓"}
          </p>

          <p>Doctor</p>
          <p className="text-center">Action</p>
        </div>

        {filteredAppointments.map((item, index) => (
          <div
            key={item.appointment_id}
            className="grid grid-cols-[0.5fr_3fr_3fr_3fr_1fr] items-center text-gray-600 py-3 px-6 border-b hover:bg-gray-50"
          >
            <p>{index + 1}</p>

            {/* Patient */}
            <div className="flex items-center gap-2">
              <img
                src={
                  item.patient_image
                    ? item.patient_image.startsWith("http")
                      ? item.patient_image
                      : `${import.meta.env.VITE_BACKEND_URL}${item.patient_image}`
                    : "/default_image.png"
                }
                className="w-8 h-8 rounded-full object-cover"
                alt=""
              />
              <p>{item.patient_name}</p>
            </div>

            {/* Date */}
            <p>
              {formatDateTime(item.appointment_date, item.appointment_time)}
            </p>

            {/* Doctor */}
            <div className="flex items-center gap-2">
              <img
                src={
                  item.doctor_image
                    ? item.doctor_image.startsWith("http")
                      ? item.doctor_image
                      : `${import.meta.env.VITE_BACKEND_URL}${item.doctor_image}`
                    : "/default_image.png"
                }
                className="w-8 h-8 rounded-full object-cover"
                alt=""
              />
              <p>{item.doctor_name}</p>
            </div>

            {/* Action */}
            <div className="flex justify-center">
              {item.status === "cancelled" ? (
                <p className="text-red-400 text-xs font-medium">Cancelled</p>
              ) : item.status === "completed" ? (
                <p className="text-green-500 text-xs font-medium">Completed</p>
              ) : (
                <img
                  onClick={() => cancelAppointment(item.appointment_id)}
                  className="w-8 cursor-pointer"
                  src={assets.cancel_icon}
                  alt=""
                />
              )}
            </div>
          </div>
        ))}

        {filteredAppointments.length === 0 && (
          <p className="text-center py-6 text-gray-400">
            No appointments found
          </p>
        )}
      </div>
    </div>
  );
};

export default AllAppointments;