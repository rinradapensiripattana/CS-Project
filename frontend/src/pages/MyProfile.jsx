import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const MyProfile = () => {
  const { userData, setUserData, loadUserProfileData, axiosInstance } =
    useContext(AppContext);

  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const updateUserProfileData = async () => {
    try {
      const formData = new FormData();

      formData.append("name", userData.name || "");
      formData.append("email", userData.email || "");
      formData.append("phone", userData.phone || "");
      formData.append("gender", userData.gender || "");

      if (image) {
        formData.append("image", image);
      }

      const { data } = await axiosInstance.put(
        "/api/user/update-profile",
        formData,
      );

      if (data.success) {
        toast.success("Updated");
        await loadUserProfileData();
        setIsEdit(false);
        setImage(null);
      } else {
        toast.error("Update failed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Update failed");
    }
  };

  if (!userData) {
    return (
      <div className="text-center mt-20 text-gray-500">Loading profile...</div>
    );
  }

  const imageUrl = userData.image
    ? userData.image.startsWith("http")
      ? userData.image
      : `${backendUrl}${userData.image}`
    : "/default_image.png";

  return (
    <div className="max-w-lg flex flex-col gap-4 text-sm pt-5">
      {/* Image*/}
      {isEdit ? (
        <label htmlFor="image">
          <div className="cursor-pointer">
            <img
              className="w-36 h-36 object-cover rounded"
              src={image ? URL.createObjectURL(image) : imageUrl}
              alt="profile"
            />
          </div>
          <input
            type="file"
            id="image"
            hidden
            onChange={(e) => setImage(e.target.files[0])}
          />
        </label>
      ) : (
        <img
          className="w-36 h-36 object-cover rounded"
          src={imageUrl}
          alt="profile"
        />
      )}

      {/* Name*/}
      {isEdit ? (
        <input
          className="bg-gray-50 text-2xl font-medium p-1"
          type="text"
          value={userData.name || ""}
          onChange={(e) =>
            setUserData((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      ) : (
        <p className="text-2xl font-semibold mt-2">{userData.name}</p>
      )}

      <hr />

      {/* Contact */}
      <div>
        <p className="underline font-medium mb-2">CONTACT INFORMATION</p>

        <p>
          <b>Email:</b>
        </p>
        {isEdit ? (
          <input
            className="bg-gray-50 p-1"
            type="email"
            value={userData.email || ""}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, email: e.target.value }))
            }
          />
        ) : (
          <p>{userData.email}</p>
        )}

        <p>
          <b>Phone:</b>
        </p>
        {isEdit ? (
          <input
            className="bg-gray-50 p-1"
            type="text"
            value={userData.phone || ""}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
        ) : (
          <p>{userData.phone || "-"}</p>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="underline font-medium mt-4 mb-2">BASIC INFORMATION</p>

        <p>
          <b>Gender:</b>
        </p>
        {isEdit ? (
          <select
            className="bg-gray-50 p-1"
            value={userData.gender || ""}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, gender: e.target.value }))
            }
          >
            <option value="">Not Selected</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        ) : (
          <p>{userData.gender || "Not Selected"}</p>
        )}

        <p className="mt-2">
          <b>Birthday:</b>
        </p>

        <p>
          {userData.dob
            ? (() => {
                const [year, month, day] = userData.dob.split("-");
                return `${day}/${month}/${year}`;
              })()
            : "Not Selected"}
        </p>
      </div>
      
      <div className="mt-6">
        {isEdit ? (
          <button
            onClick={updateUserProfileData}
            className="border border-primary px-6 py-2 rounded-full hover:bg-primary hover:text-white transition"
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setIsEdit(true)}
            className="border border-primary px-6 py-2 rounded-full hover:bg-primary hover:text-white transition"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
