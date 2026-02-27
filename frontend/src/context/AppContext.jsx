import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext = createContext();

const AppContextProvider = (props) => {

  const currencySymbol = "$";
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userData, setUserData] = useState(null);

  // ✅ Axios Instance
  const axiosInstance = axios.create({
    baseURL: backendUrl,
  });

  // ✅ Attach token automatically
  axiosInstance.interceptors.request.use((config) => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
    return config;
  });

  // ===================================
  // 🔹 Get Doctors (SQL Version Safe)
  // ===================================
  const getDoctorsData = async () => {
    try {
      const { data } = await axiosInstance.get("/api/doctor/list");

      if (data.success) {

        // ✅ ป้องกัน undefined
        if (Array.isArray(data.doctors)) {
          setDoctors(data.doctors);
        } else {
          setDoctors([]);
        }

      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.log("Doctor fetch error:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ===================================
  // 🔹 Load User Profile
  // ===================================
  const loadUserProfileData = async () => {
    try {
      const { data } = await axiosInstance.get("/api/user/get-profile");

      if (data.success) {
        setUserData({
          ...data.userData,
          dob: data.userData.dob
            ? data.userData.dob.split("T")[0]
            : ""
        });
      }
    } catch (error) {
      console.log("Profile load error:", error);
    }
  };

  // ===================================
  // 🔹 Save Token Automatically
  // ===================================
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      loadUserProfileData();
    } else {
      localStorage.removeItem("token");
      setUserData(null);
    }
  }, [token]);

  // ===================================
  // 🔹 Initial Load
  // ===================================
  useEffect(() => {
    getDoctorsData();
  }, []);

  // ===================================
  // Context Value
  // ===================================
  const value = {
    doctors,
    getDoctorsData,
    currencySymbol,
    backendUrl,
    token,
    setToken,
    userData,
    setUserData,
    loadUserProfileData,
    axiosInstance,
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;