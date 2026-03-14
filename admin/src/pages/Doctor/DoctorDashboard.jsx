import React, { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";
import axios from "axios";

const CountUp = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuad animation
      setCount(Math.floor(progress * (2 - progress) * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <>{count}</>;
};

const DoctorDashboard = () => {
  const { dToken, setDToken } = useContext(DoctorContext);
  const { backendUrl, calculateAge } = useContext(AppContext);
  const navigate = useNavigate();

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });

  const [dashData, setDashData] = useState(false);

  const getDashData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/dashboard", {
        headers: { Authorization: `Bearer ${dToken}` },
      });
      if (data.success) {
        setDashData(data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast.error("Session Expired. Please login again.");
        setDToken("");
        localStorage.removeItem("dToken");
        navigate("/");
      }
      console.log(error);
      toast.error(error.message);
    }
  };

  // สร้างฟังก์ชัน Cancel แยกมาไว้ในนี้เพื่อให้สามารถเรียก getDashData() รีเฟรชหน้าจอได้ทันที
  const cancelAppointment = async (appointment_id) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/cancel-appointment",
        { appointment_id },
        { headers: { Authorization: `Bearer ${dToken}` } },
      );
      if (data.success) {
        toast.success(data.message);
        getDashData(); // ดึงข้อมูลใหม่เพื่ออัปเดต UI ทันที
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // สร้างฟังก์ชัน Complete แบบทันที (ข้ามการกรอกประวัติ) พร้อมรีเฟรชหน้าจอ
  const completeAppointment = async (appointment_id) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/complete-appointment",
        { appointment_id, symptoms: "", treatment: "" },
        { headers: { Authorization: `Bearer ${dToken}` } },
      );
      if (data.success) {
        toast.success("Appointment Completed");
        getDashData(); // ดึงข้อมูลใหม่เพื่ออัปเดต UI ทันที
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const [dateFilter, setDateFilter] = useState("last7");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    if (dToken) {
      getDashData();
    }
  }, [dToken]);

  // Prepare Chart Data
  const chartData = useMemo(() => {
    if (!dashData?.appointmentsGraph) return [];

    const dateList = [];
    if (dateFilter === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dateList.push(new Date(d));
      }
    } else if (dateFilter === "thisMonth") {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        dateList.push(new Date(year, month, i));
      }
    } else if (dateFilter === "thisYear") {
      const today = new Date();
      const year = today.getFullYear();
      for (let i = 0; i < 12; i++) {
        // สร้างวันที่เป็นวันแรกของแต่ละเดือน
        dateList.push(new Date(year, i, 1));
      }
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dateList.push(d);
      }
    }

    const dataMap = {};
    // ฟังก์ชันช่วยจัดกลุ่มวันที่
    const getDateKey = (dateStr) => {
      if (dateFilter === "thisYear") {
        return dateStr.substring(0, 7); // YYYY-MM
      }
      return dateStr; // YYYY-MM-DD
    };

    dashData.appointmentsGraph?.forEach((item) => {
      const dateKey = getDateKey(item.date);

      if (!dataMap[dateKey]) {
        dataMap[dateKey] = {
          total: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
        };
      }
      dataMap[dateKey].total += item.count;
      if (item.status) {
        const s = item.status.toLowerCase();
        if (dataMap[dateKey][s] !== undefined) {
          dataMap[dateKey][s] += item.count;
        }
      }
    });

    return dateList.map((date) => {
      let dateKey;
      let labelWeekday = "";
      let labelDayMonth = "";

      if (dateFilter === "thisYear") {
        // Key: YYYY-MM
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        // Label: Month Year
        labelWeekday = date.getFullYear().toString();
        labelDayMonth = date.toLocaleDateString("en-GB", { month: "short" });
      } else {
        // Key: YYYY-MM-DD
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        labelWeekday =
          dateFilter === "thisMonth"
            ? ""
            : date.toLocaleDateString("en-GB", { weekday: "short" });
        labelDayMonth =
          dateFilter === "thisMonth"
            ? date.getDate().toString()
            : date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              });
      }

      const dayData = dataMap[dateKey] || {
        total: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      };

      return {
        label: `${labelDayMonth} ${labelWeekday}`,
        weekday: labelWeekday,
        dayMonth: labelDayMonth,
        count: dayData.total,
        details: dayData,
      };
    });
  }, [dashData, dateFilter, customStartDate, customEndDate]);

  const maxCount = Math.max(...chartData.map((d) => d.count), 1) * 1.1;

  const statusColors = {
    confirmed: "#3B82F6", // Blue
    completed: "#22C55E", // Green
    cancelled: "#EF4444", // Red
  };

  // 🎨 ฟังก์ชันสร้างกราฟวงกลมด้วย CSS
  const renderPieChart = (data) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full">
          <div className="flex justify-center sm:justify-end flex-1">
            <div
              className="relative w-48 h-48 rounded-full shadow-inner bg-gray-100"
              style={{ background: `conic-gradient(#e5e7eb 0% 100%)` }}
            >
              <div className="absolute inset-0 m-auto w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-300">0</p>
                  <p className="text-xs text-gray-400">Patients</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center sm:justify-start flex-1">
            <p className="text-gray-400 text-sm">
              No patient data available yet.
            </p>
          </div>
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);
    let currentAngle = 0;

    const getColor = (gender) => {
      switch (gender?.toLowerCase()) {
        case "male":
          return "#36A2EB"; // Blue
        case "female":
          return "#FF6384"; // Pink
        default:
          return "#FFCE56"; // Yellow
      }
    };

    const gradient = data
      .map((item, index) => {
        const percentage = (item.count / total) * 100;
        const start = currentAngle;
        currentAngle += percentage;
        return `${getColor(item.gender)} ${start}% ${currentAngle}%`;
      })
      .join(", ");

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full">
        <style>{`
          @keyframes spinLoad {
            from { transform: rotate(-180deg) scale(0.5); opacity: 0; }
            to { transform: rotate(0deg) scale(1); opacity: 1; }
          }
        `}</style>
        <div className="flex justify-center sm:justify-end flex-1">
          <div
            className="relative w-48 h-48 rounded-full shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
            style={{
              background: `conic-gradient(${gradient})`,
              animation: "spinLoad 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const dx = x - centerX;
              const dy = y - centerY;

              // คำนวณระยะห่างจากจุดศูนย์กลาง (เพื่อไม่ให้แสดง Tooltip ตรงรูโดนัท)
              const distance = Math.sqrt(dx * dx + dy * dy);
              const radius = rect.width / 2;
              if (distance < radius * 0.6) {
                setTooltip({ ...tooltip, visible: false });
                return;
              }

              // คำนวณองศา (0 ที่ด้านบน, หมุนตามเข็มนาฬิกา)
              let angle = Math.atan2(dy, dx) * (180 / Math.PI);
              angle += 90;
              if (angle < 0) angle += 360;

              const percentage = (angle / 360) * 100;

              let currentP = 0;
              const item = data.find((d) => {
                const p = (d.count / total) * 100;
                if (percentage >= currentP && percentage < currentP + p) {
                  return true;
                }
                currentP += p;
                return false;
              });

              if (item) {
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  content: `${item.gender || "Not Specified"}: ${item.count} (${((item.count / total) * 100).toFixed(1)}%)`,
                });
              }
            }}
            onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
          >
            <div className="absolute inset-0 m-auto w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-inner pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">{total}</p>
                <p className="text-xs text-gray-500">Patients</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip.visible && (
          <div
            className="fixed bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none z-50 shadow-lg whitespace-nowrap"
            style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
          >
            {tooltip.content}
          </div>
        )}

        <div className="flex justify-center sm:justify-start flex-1">
          <div className="flex flex-col gap-3 text-sm">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-md shadow-sm"
                  style={{ backgroundColor: getColor(item.gender) }}
                ></span>
                <div className="flex flex-col">
                  <span className="text-gray-700 font-medium capitalize">
                    {item.gender || "Not Specified"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.count} people (
                    {((item.count / total) * 100).toFixed(1)}
                    %)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const downloadCSV = async () => {
    // 1. Fetch fresh data from DB
    let appointmentsToExport = [];
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/appointments",
        {
          headers: { Authorization: `Bearer ${dToken}` },
        },
      );
      if (data.success) {
        appointmentsToExport = data.appointments;
        // เรียงวันที่จากน้อยไปมาก
        appointmentsToExport.sort((a, b) => {
          const dateA = new Date(a.appointment_date);
          const dateB = new Date(b.appointment_date);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
          }
          return a.appointment_time.localeCompare(b.appointment_time);
        });
      } else {
        toast.error(data.message);
        return;
      }
    } catch (error) {
      toast.error("Failed to export data");
      return;
    }

    // 1. BOM for UTF-8 Support
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";

    // 2. Report Header
    csvContent += "Doctor Dashboard Report\n";
    csvContent += "\n"; // Empty Line

    // Appointments Data
    csvContent += "Detailed Appointments List\n";
    csvContent +=
      "Date,Time,Patient Name,Patient Age,Patient Phone,Status,Gender\n";

    // Use fetched data
    appointmentsToExport.forEach((item) => {
      const date = `"${new Date(item.appointment_date).toLocaleDateString("en-GB")}"`;
      const time = item.appointment_time
        ? `"${item.appointment_time.slice(0, 5)}"`
        : '""';
      const name = item.name ? `"${item.name}"` : '""'; // Patient Name
      const age = item.date_of_birth ? calculateAge(item.date_of_birth) : "";
      const phone = item.phone ? `="${item.phone}"` : '""';
      const status = item.status ? `"${item.status}"` : '""';
      const gender = item.gender ? `"${item.gender}"` : '"Not Specified"';

      csvContent += `${date},${time},${name},${age},${phone},${status},${gender}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "doctor_dashboard_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!dashData) {
    return <p className="m-5">Loading...</p>;
  }

  return (
    <div className="w-full p-5">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Appointments */}
        <div className="flex items-center gap-3 bg-white p-6 rounded-xl border border-gray-100 shadow-md hover:shadow-lg hover:-translate-y-2 transition-all duration-300">
          <img className="w-14" src={assets.appointments_icon} alt="" />
          <div>
            <p className="text-xl font-semibold text-gray-600">
              <CountUp end={dashData.totalAppointments} />
            </p>
            <p className="text-gray-500 text-sm">Appointments</p>
          </div>
        </div>

        {/* Total Patients */}
        <div className="flex items-center gap-3 bg-white p-6 rounded-xl border border-gray-100 shadow-md hover:shadow-lg hover:-translate-y-2 transition-all duration-300">
          <img className="w-14" src={assets.patients_icon} alt="" />
          <div>
            <p className="text-xl font-semibold text-gray-600">
              <CountUp end={dashData.totalPatients} />
            </p>
            <p className="text-gray-500 text-sm">Patients</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={downloadCSV}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-all text-sm shadow-sm"
        >
          Export CSV
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mt-4">
        {/* ===== Gender Chart ===== */}
        <div className="bg-white rounded border p-6 w-full lg:w-1/3 shadow-md min-w-0">
          <p className="font-semibold text-lg mb-4">My Patients by Gender</p>
          <div
            className="flex justify-center py-4"
            style={{ animation: "fadeIn 1.5s ease-out" }}
          >
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            {renderPieChart(dashData.genderData)}
          </div>
        </div>

        {/* ===== Appointments Bar Chart (Last 7 Days) ===== */}
        <div className="bg-white rounded border p-6 w-full lg:w-2/3 flex-1 shadow-md min-w-0">
          <div className="flex flex-col mb-4 gap-3">
            <p className="font-semibold text-lg">My Appointments</p>

            <div className="flex flex-wrap gap-2 items-center">
              <select
                className="border rounded px-2 py-1 text-sm outline-none text-gray-600"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="last7">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateFilter === "custom" && (
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    className="border rounded px-2 py-1 text-sm"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="date"
                    className="border rounded px-2 py-1 text-sm"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: statusColors.confirmed }}
              ></span>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: statusColors.completed }}
              ></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: statusColors.cancelled }}
              ></span>
              <span>Cancelled</span>
            </div>
          </div>

          <style>{`
            @keyframes growUp {
              from { transform: scaleY(0); }
              to { transform: scaleY(1); }
            }
          `}</style>
          <div className="relative w-full">
            <div className="h-64 flex items-end gap-0.5 sm:gap-1 w-full pb-2 border-b border-gray-200 relative z-10">
              {chartData.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center justify-end gap-1 sm:gap-2 group h-full relative min-w-0"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 z-20 shadow-lg min-w-[120px]">
                    <p className="font-semibold border-b border-gray-600 pb-1 mb-1 text-center">
                      {item.label}
                    </p>
                    <div className="flex justify-between gap-2">
                      <span style={{ color: statusColors.confirmed }}>
                        Confirmed:
                      </span>
                      <span>{item.details.confirmed}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span style={{ color: statusColors.completed }}>
                        Completed:
                      </span>
                      <span>{item.details.completed}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span style={{ color: statusColors.cancelled }}>
                        Cancelled:
                      </span>
                      <span>{item.details.cancelled}</span>
                    </div>
                    <div className="w-2 h-2 bg-gray-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                  </div>

                  <p className="text-xs text-gray-500 font-medium">
                    {item.count > 0 ? item.count : ""}
                  </p>

                  {/* Stacked Bar Container */}
                  <div
                    className="w-full rounded-t overflow-hidden flex flex-col-reverse relative group-hover:brightness-105 transition-all duration-300 bg-gray-100"
                    style={{
                      height: `${(item.count / maxCount) * 100}%`,
                      animation: "growUp 1s ease-out forwards",
                      transformOrigin: "bottom",
                    }}
                  >
                    {item.count > 0 && (
                      <>
                        {item.details.confirmed > 0 && (
                          <div
                            style={{
                              height: `${(item.details.confirmed / item.count) * 100}%`,
                              backgroundColor: statusColors.confirmed,
                            }}
                          ></div>
                        )}
                        {item.details.completed > 0 && (
                          <div
                            style={{
                              height: `${(item.details.completed / item.count) * 100}%`,
                              backgroundColor: statusColors.completed,
                            }}
                          ></div>
                        )}
                        {item.details.cancelled > 0 && (
                          <div
                            style={{
                              height: `${(item.details.cancelled / item.count) * 100}%`,
                              backgroundColor: statusColors.cancelled,
                            }}
                          ></div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-center text-[9px] sm:text-[11px] text-gray-500 w-full text-center mt-1 overflow-hidden">
                    {item.weekday && (
                      <p className="uppercase truncate w-full">
                        {item.weekday}
                      </p>
                    )}
                    <p className="truncate w-full">{item.dayMonth}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Latest Bookings */}
      <div className="bg-white mt-10 rounded border shadow-md">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-4 border-b">
          <img src={assets.list_icon} alt="" />
          <p className="font-semibold">Latest Bookings (Today)</p>
        </div>

        {/* Appointment List */}
        <div>
          {dashData.latestAppointments?.filter(
            (item) =>
              new Date(item.appointment_date).toDateString() ===
              new Date().toDateString(),
          ).length === 0 && (
            <p className="text-gray-500 text-center py-6 text-sm">
              No bookings for today.
            </p>
          )}
          {dashData.latestAppointments
            ?.filter(
              (item) =>
                new Date(item.appointment_date).toDateString() ===
                new Date().toDateString(),
            )
            .sort((a, b) => {
              const timeA = a.appointment_time || "00:00";
              const timeB = b.appointment_time || "00:00";
              return timeB.localeCompare(timeA); // เรียงจากเวลามากไปน้อย (ใหม่ไปเก่า)
            })
            .map((item) => (
              <div
                key={item.appointment_id}
                className="flex items-center px-6 py-3 gap-3 hover:bg-gray-100"
              >
                {/* Patient Image */}
                <img
                  className="rounded-full w-10 h-10 object-cover"
                  src={
                    item?.image
                      ? item.image.startsWith("http")
                        ? item.image
                        : `${import.meta.env.VITE_BACKEND_URL}${item.image}`
                      : "/default_image.png"
                  }
                  alt=""
                />

                {/* Patient Info */}
                <div className="flex-1 text-sm">
                  <p className="text-gray-800 font-medium">{item.name}</p>
                  <p className="text-gray-600">
                    {new Date(item.appointment_date).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}{" "}
                    , {item.appointment_time?.slice(0, 5)}
                  </p>
                </div>

                {/* Status */}
                {item.status === "cancelled" && (
                  <p className="text-red-400 text-xs font-medium">Cancelled</p>
                )}

                {item.status === "completed" && (
                  <p className="text-green-500 text-xs font-medium">
                    Completed
                  </p>
                )}

                {/* Action Buttons */}
                {item.status === "confirmed" && (
                  <div className="flex gap-2">
                    {/* Cancel */}
                    <img
                      onClick={() => cancelAppointment(item.appointment_id)}
                      className="w-8 cursor-pointer"
                      src={assets.cancel_icon}
                      alt=""
                    />

                    {/* Go to Medical Record */}
                    <img
                      onClick={() => {
                        const appointmentDateTime = new Date(
                          item.appointment_date,
                        );
                        if (!item.appointment_time) {
                          toast.error("Appointment time is missing.");
                          return;
                        }
                        const [hours, minutes] =
                          item.appointment_time.split(":");
                        appointmentDateTime.setHours(hours, minutes, 0, 0);

                        // Allow access 30 minutes before the appointment
                        const allowedTime = new Date(
                          appointmentDateTime.getTime() - 30 * 60 * 1000,
                        );

                        if (new Date() < allowedTime) {
                          toast.error("ยังไม่ถึงเวลานัดหมาย");
                          return;
                        }

                        // เรียกใช้ฟังก์ชันให้เปลี่ยนสถานะทันที (Quick Complete)
                        completeAppointment(item.appointment_id);
                      }}
                      className="w-8 cursor-pointer"
                      src={assets.tick_icon}
                      alt=""
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
