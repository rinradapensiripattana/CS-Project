import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { DoctorContext } from "../../context/DoctorContext";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";

const DoctorProfile = () => {
  const { dToken, profileData, setProfileData, getProfileData } =
    useContext(DoctorContext);
  const { backendUrl } = useContext(AppContext);
  const [isEdit, setIsEdit] = useState(false);

  const updateProfile = async () => {
    try {
      const updateData = {
        about: profileData.about,
        available: profileData.available,
        experience: profileData.experience,
      };

      const token = localStorage.getItem("dToken");

      const { data } = await axios.post(
        "http://localhost:4000/api/doctor/update-profile",
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
        toast.success(data.message);
        setIsEdit(false);
        getProfileData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (dToken) {
      getProfileData();
    }
  }, [dToken]);

  if (!profileData) return null;

  return (
    // ปรับ Container ใหม่ เอาส่วนที่ดึงกึ่งกลางหน้าจอออก เพื่อให้การ์ดไหลไปตาม Layout ของ Dashboard
    <div className="w-full p-4 sm:p-8">
      {/* Main Card */}
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col md:flex-row border border-gray-100">
        {/* ----- Left Side: Image & Key Info Header ----- */}
        <div className="md:w-2/5 bg-slate-50/50 p-8 sm:p-10 flex flex-col items-center text-center md:border-r border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent -z-10"></div>

          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
            <img
              className="w-48 h-48 sm:w-56 sm:h-56 object-cover rounded-full border-[6px] border-white shadow-lg relative z-10"
              src={
                profileData.image
                  ? `${backendUrl}${profileData.image}`
                  : "/default_image.png"
              }
              onError={(e) => (e.target.src = "/default_image.png")}
              alt={profileData.name}
            />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
            {profileData.name}
          </h2>
          <p className="text-lg text-primary font-medium mt-2">
            {profileData.degree}
          </p>

          <div className="mt-4 inline-flex items-center px-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
            <span className="text-sm font-semibold text-gray-700">
              {profileData.experience} Years Experience
            </span>
          </div>
        </div>

        {/* ----- Right Side: Details & Edit Form ----- */}
        <div className="md:w-3/5 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <div className="mb-8 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                Doctor Profile Details
              </h3>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center">
                About Me
              </h3>

              {isEdit ? (
                <textarea
                  className="w-full border-2 border-primary/50 focus:border-primary bg-primary/[0.02] rounded-xl p-4 text-gray-700 text-base leading-relaxed transition-all outline-none resize-none shadow-sm"
                  rows={6}
                  placeholder="Write something about yourself..."
                  value={profileData.about || ""}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      about: e.target.value,
                    }))
                  }
                />
              ) : (
                <p className="text-gray-600 text-base leading-relaxed whitespace-pre-line">
                  {profileData.about || "No description provided yet."}
                </p>
              )}
            </div>

            {/* Available Status */}
            <div
              className={`flex items-center gap-3 p-4 rounded-2xl transition-colors ${isEdit ? "bg-primary/[0.04] border border-primary/20" : "bg-gray-50 border border-gray-100"}`}
            >
              <div
                className={`w-3 h-3 rounded-full ${profileData.available ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-400"}`}
              ></div>

              <label
                htmlFor="available-checkbox"
                className="flex-1 text-gray-700 font-medium cursor-pointer select-none"
              >
                {profileData.available
                  ? "Available for Appointments"
                  : "Not Available"}
              </label>

              {/* แก้ไขตรงนี้: เอา disabled ออก แล้วใช้ pointer-events-none แทน เพื่อให้สียังคงความเข้มอยู่ (accent-primary) */}
              <input
                type="checkbox"
                id="available-checkbox"
                className={`w-6 h-6 rounded-md border-2 accent-primary cursor-pointer transition-all ${isEdit ? "border-primary" : "border-gray-200 pointer-events-none"}`}
                checked={profileData.available}
                onChange={() =>
                  isEdit &&
                  setProfileData((prev) => ({
                    ...prev,
                    available: !prev.available,
                  }))
                }
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex justify-end">
            {isEdit ? (
              <div className="flex gap-4">
                <button
                  onClick={() => setIsEdit(false)}
                  className="px-8 py-3 border-2 border-gray-200 text-gray-500 rounded-full font-semibold hover:bg-gray-50 hover:text-gray-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={updateProfile}
                  className="px-10 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEdit(true)}
                className="px-10 py-3 border-2 border-primary text-primary rounded-full font-semibold hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
