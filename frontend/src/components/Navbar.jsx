import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { token, setToken, userData, loadingUser } = useContext(AppContext);

  const [showMenu, setShowMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/");
  };

  return (
    <div className="flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400">
      <img
        onClick={() => navigate("/")}
        className="max-w-[180px] w-full cursor-pointer"
        src={assets.logo}
        alt="logo"
      />

      <ul className="hidden md:flex items-center gap-5 font-medium">
        <NavLink to="/">
          <li>HOME</li>
        </NavLink>
        <NavLink to="/doctors">
          <li>ALL DOCTOR</li>
        </NavLink>
        <NavLink to="/about">
          <li>ABOUT</li>
        </NavLink>
        <NavLink to="/contact">
          <li>CONTACT</li>
        </NavLink>
      </ul>

      <div className="flex items-center gap-4">
        {/* ✅ ถ้า login แล้ว */}
        {token && !loadingUser && userData ? (
          <div className="flex items-center gap-2 cursor-pointer group relative">
            <div className="flex flex-col items-end">
              <p className="font-medium text-gray-700">{userData.name}</p>
              <p className="text-[12px] text-gray-500">
                {formatDateTime(currentTime)}
              </p>
            </div>

            <img
              className="w-8 h-8 rounded-full object-cover"
              src={
                userData?.image
                  ? userData.image.startsWith("http")
                    ? userData.image
                    : `${import.meta.env.VITE_BACKEND_URL}${userData.image}`
                  : "/default_image.png"
              }
              alt=""
            />

            <div className="absolute top-0 right-0 pt-14 z-20 hidden group-hover:block">
              <div className="min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4 text-base text-gray-600">
                <p
                  onClick={() => navigate("/my-profile")}
                  className="hover:text-black cursor-pointer"
                >
                  My Profile
                </p>
                <p
                  onClick={() => navigate("/my-appointments")}
                  className="hover:text-black cursor-pointer"
                >
                  My Appointment
                </p>
                <p
                  onClick={() => navigate("/history")}
                  className="hover:text-black cursor-pointer"
                >
                  History
                </p>
                <p onClick={logout} className="hover:text-black cursor-pointer">
                  Logout
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-[11px] text-gray-500">
              {formatDateTime(currentTime)}
            </div>

            <button
              onClick={() => navigate("/login")}
              className="bg-primary text-white px-4 py-3 rounded-full font-light hidden md:block"
            >
              Create account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
