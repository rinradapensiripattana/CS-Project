import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Axios instance
  const axiosInstance = axios.create({
    baseURL: backendUrl,
  });

  // ================= STATE =================
  const [dToken, setDToken] = useState(
    localStorage.getItem("dToken") || ""
  );

  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [profileData, setProfileData] = useState(false);

  // ================= INTERCEPTOR =================
  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("dToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // ================= GET APPOINTMENTS =================
  const getAppointments = async () => {
    try {
      const { data } = await axiosInstance.get(
        "/api/doctor/appointments"
      );

      if (data.success) {
        const reversed = [...data.appointments].reverse();
        setAppointments(reversed);
        console.log("Appointments:", reversed);
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message ||
          "Error fetching appointments"
      );
    }
  };

  // ================= GET DASHBOARD =================
  const getDashData = async () => {
    try {
      const { data } = await axiosInstance.get(
        "/api/doctor/dashboard"
      );

      if (data.success) {
        setDashData(data.dashData);
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message ||
          "Error fetching dashboard"
      );
    }
  };

  // ================= GET PROFILE =================
  const getProfileData = async () => {
    try {
      const { data } = await axiosInstance.get(
        "/api/doctor/profile"
      );

      if (data.success) {
        setProfileData(data.profileData);
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message ||
          "Error fetching profile"
      );
    }
  };

  // ================= CANCEL =================
  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axiosInstance.post(
        "/api/doctor/cancel-appointment",
        { appointment_id: appointmentId }
      );

      if (data.success) {

        toast.success(data.message);

        // update appointments list
        setAppointments((prev) =>
          prev.map((item) =>
            item.appointment_id === appointmentId
              ? { ...item, status: "cancelled" }
              : item
          )
        );

        // update dashboard latest list
        setDashData((prev) =>
          prev
            ? {
                ...prev,
                latestAppointments: prev.latestAppointments.map((item) =>
                  item.appointment_id === appointmentId
                    ? { ...item, status: "cancelled" }
                    : item
                ),
              }
            : prev
        );
      }

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ================= COMPLETE =================
  const completeAppointment = async (appointmentId) => {
    try {
      const { data } = await axiosInstance.post(
        "/api/doctor/complete-appointment",
        { appointment_id: appointmentId }
      );

      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDashData();
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ================= LOGIN =================
  const loginDoctor = async (email, password) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/login",
        { email, password }
      );

      if (data.success) {
        setDToken(data.token);
        localStorage.setItem("dToken", data.token);
        toast.success("Login Success");
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ================= LOGOUT =================
  const logout = () => {
    setDToken("");
    localStorage.removeItem("dToken");
    setAppointments([]);
    setDashData(false);
    setProfileData(false);
  };

  // ================= AUTO FETCH =================
  useEffect(() => {
    if (dToken) {
      getAppointments();
      getDashData();
      getProfileData();
    }
  }, [dToken]);

  // ================= PROVIDER VALUE =================
  const value = {
    dToken,
    setDToken,
    backendUrl,

    appointments,
    setAppointments,
    getAppointments,

    dashData,
    setDashData,
    getDashData,

    profileData,
    setProfileData,
    getProfileData,

    cancelAppointment,
    completeAppointment,

    loginDoctor,
    logout,
  };

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;