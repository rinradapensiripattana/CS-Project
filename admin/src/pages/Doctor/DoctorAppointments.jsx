import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";
import axios from "axios";

const DoctorAppointments = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const { dToken, setDToken } = useContext(DoctorContext);

  const { calculateAge } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [appointments, setAppointments] = useState([]);
  const [viewMode, setViewMode] = useState(
    location.state?.initialViewMode || "list",
  ); // "list" | "calendar"
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getAppointments = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/appointments",
        {
          headers: { Authorization: `Bearer ${dToken}` },
        },
      );
      if (data.success) {
        setAppointments(data.appointments.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast.error("Session Expired. Please login again.");
        setDToken("");
        localStorage.removeItem("dToken");
      }
      console.log(error);
      toast.error(error.message);
    }
  };

  // สร้างฟังก์ชัน Cancel แยกมาไว้ในนี้เพื่อให้สามารถเรียก getAppointments() รีเฟรชหน้าจอได้ทันที
  const cancelAppointment = async (appointment_id) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/cancel-appointment",
        { appointment_id },
        { headers: { Authorization: `Bearer ${dToken}` } },
      );
      if (data.success) {
        toast.success(data.message);
        getAppointments(); // ดึงข้อมูลใหม่เพื่ออัปเดต UI ทันที
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredByStatus = appointments.filter((item) => {
    const appointmentDate = new Date(item.appointment_date);
    appointmentDate.setHours(0, 0, 0, 0);

    if (activeTab === "upcoming") {
      return (
        (item.status === "confirmed" || item.status === "ongoing") &&
        appointmentDate >= today
      );
    }

    if (activeTab === "completed") return item.status === "completed";
    if (activeTab === "cancelled") return item.status === "cancelled";

    return true;
  });

  // Search
  const filteredBySearch = filteredByStatus.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()),
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

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, fromDate, toDate, sortOrder]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAppointments = finalFiltered.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(finalFiltered.length / itemsPerPage);

  // Data for Calendar View (All statuses, but still applies search and date filters)
  const calendarAppointments = appointments.filter((item) => {
    // Search filter
    if (search && !item.name?.toLowerCase().includes(search.toLowerCase()))
      return false;

    // Date filter
    const appointmentDate = new Date(item.appointment_date);
    if (fromDate && appointmentDate < new Date(fromDate)) return false;
    if (toDate && appointmentDate > new Date(toDate)) return false;

    return true;
  });

  // ========================
  // CALENDAR LOGIC
  // ========================
  const daysInMonth = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth(),
    1,
  ).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const prevMonth = () =>
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1),
    );
  const nextMonth = () =>
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1),
    );

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

      {/* Tabs & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b mb-4">
        <div className="flex gap-6">
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

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-2 sm:mb-0">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-1 text-sm rounded-md transition-colors ${viewMode === "list" ? "bg-white shadow-sm font-medium text-primary" : "text-gray-500 hover:text-gray-700"}`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-1 text-sm rounded-md transition-colors ${viewMode === "calendar" ? "bg-white shadow-sm font-medium text-primary" : "text-gray-500 hover:text-gray-700"}`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-white border rounded text-sm max-h-[70vh] overflow-y-auto">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[0.5fr_2fr_1fr_2fr_1fr] gap-2 py-3 px-6 border-b bg-gray-50 font-medium">
            <p>#</p>
            <p>Patient</p>
            <p>Age</p>

            <p
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
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

          {currentAppointments.map((item, index) => (
            <div
              key={item.appointment_id}
              className="grid grid-cols-[0.5fr_2fr_1fr_2fr_1fr] gap-2 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50"
            >
              <p>{indexOfFirstItem + index + 1}</p>

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
                  <p className="text-green-500 text-xs font-medium">
                    Completed
                  </p>
                )}

                {item.status === "confirmed" && (
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
                          item.appointment_date,
                        );

                        const [hours, minutes] =
                          item.appointment_time.split(":");

                        appointmentDateTime.setHours(hours, minutes, 0, 0);

                        const allowedTime = new Date(
                          appointmentDateTime.getTime() - 30 * 60 * 1000,
                        );

                        if (new Date() < allowedTime) {
                          toast.error("ยังไม่ถึงเวลานัดหมาย");
                          return;
                        }

                        navigate(
                          `/doctor-medical-record/${item.appointment_id}`,
                          { state: { initialViewMode: viewMode } },
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-end items-center gap-4 p-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Prev
              </button>
              <span className="text-sm text-gray-600 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={prevMonth}
              className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              &lt; Prev
            </button>
            <h2 className="text-xl font-bold text-gray-700">
              {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCalendarDate(new Date())}
                className="px-4 py-2 border border-primary text-primary rounded hover:bg-blue-50 transition-colors text-sm font-medium"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Next &gt;
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center font-semibold text-gray-500 text-sm py-2 bg-gray-50 rounded"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="bg-gray-50/50 border border-gray-100 rounded-lg min-h-[100px] sm:min-h-[120px]"
              ></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const cellDate = new Date(
                calendarDate.getFullYear(),
                calendarDate.getMonth(),
                day,
              );
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isPastDate = cellDate < today;
              const isToday = cellDate.getTime() === today.getTime();
              const currentDateStr = cellDate.toDateString();

              const dayAppointments = calendarAppointments
                .filter(
                  (app) =>
                    new Date(app.appointment_date).toDateString() ===
                    currentDateStr,
                )
                .sort((a, b) => {
                  const timeA = a.appointment_time || "00:00";
                  const timeB = b.appointment_time || "00:00";
                  return timeA.localeCompare(timeB);
                });

              return (
                <div
                  key={day}
                  className={`rounded-lg p-1.5 sm:p-2 h-28 sm:h-36 flex flex-col transition-shadow ${isToday ? "border-2 border-yellow-300 shadow-sm bg-yellow-50/50" : "border border-gray-200"} ${isPastDate ? "bg-gray-50/50" : "bg-white hover:shadow-md"}`}
                >
                  <div className="flex justify-end mb-1">
                    <span
                      className={`text-sm font-medium ${isToday ? "text-yellow-700 bg-yellow-100 px-1.5 rounded" : "text-gray-600"}`}
                    >
                      {day}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {dayAppointments.map((app) => (
                      <div
                        key={app.appointment_id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(app);
                          setShowModal(true);
                        }}
                        className={`shrink-0 text-[10px] sm:text-xs px-1.5 py-1 rounded truncate text-white shadow-sm cursor-pointer hover:opacity-80 transition-opacity ${app.status === "cancelled" ? "bg-red-400" : app.status === "completed" ? "bg-green-500" : "bg-primary"}`}
                        title={`${app.appointment_time.slice(0, 5)} - ${app.name}`}
                      >
                        <span className="font-semibold">
                          {app.appointment_time.slice(0, 5)}
                        </span>{" "}
                        {app.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* APPOINTMENT MODAL */}
      {/* ======================== */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            style={{ animation: "fadeIn 0.2s ease-out" }}
          >
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>

            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">
                Appointment Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={
                    selectedAppointment.image
                      ? selectedAppointment.image.startsWith("http")
                        ? selectedAppointment.image
                        : `${backendUrl}${selectedAppointment.image}`
                      : "/default_image.png"
                  }
                  className="w-16 h-16 rounded-full object-cover border shadow-sm"
                  alt=""
                />
                <div>
                  <p className="text-xl font-bold text-gray-800">
                    {selectedAppointment.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Age: {calculateAge(selectedAppointment.date_of_birth)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-gray-500 mb-1">Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(
                      selectedAppointment.appointment_date,
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Time</p>
                  <p className="font-semibold text-gray-800">
                    {selectedAppointment.appointment_time.slice(0, 5)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Status</p>
                  <p
                    className={`font-semibold capitalize ${selectedAppointment.status === "completed" ? "text-green-500" : selectedAppointment.status === "cancelled" ? "text-red-500" : "text-blue-500"}`}
                  >
                    {selectedAppointment.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            {selectedAppointment.status === "confirmed" && (
              <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    cancelAppointment(selectedAppointment.appointment_id);
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow-sm"
                >
                  Cancel Appointment
                </button>
                <button
                  onClick={() => {
                    const appointmentDateTime = new Date(
                      selectedAppointment.appointment_date,
                    );
                    const [hours, minutes] =
                      selectedAppointment.appointment_time.split(":");
                    appointmentDateTime.setHours(hours, minutes, 0, 0);
                    const allowedTime = new Date(
                      appointmentDateTime.getTime() - 30 * 60 * 1000,
                    );
                    if (new Date() < allowedTime) {
                      toast.error("ยังไม่ถึงเวลานัดหมาย");
                      return;
                    }
                    setShowModal(false);
                    navigate(
                      `/doctor-medical-record/${selectedAppointment.appointment_id}`,
                      { state: { initialViewMode: viewMode } },
                    );
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Complete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
