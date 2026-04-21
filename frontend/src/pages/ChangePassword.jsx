import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const PasswordInput = ({
  label,
  name,
  value,
  show,
  onToggle,
  onChange,
  placeholder,
  isError,
}) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-sm font-medium text-gray-700">{label}</label>

    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full border p-2.5 pr-12 rounded-lg outline-none transition-all duration-200 ${
          isError
            ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
            : "border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
        }`}
      />

      <button
        type="button"
        onClick={() => onToggle(name)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-normal text-gray-400 hover:text-primary transition-colors"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  </div>
);

const ChangePassword = () => {
  const { axiosInstance } = useContext(AppContext);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // เช็คว่ากด submit แล้ว
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleVisibility = (name) => {
    setShowPassword((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const isCurrentEmpty = submitted && !form.currentPassword;
  const isNewEmpty = submitted && !form.newPassword;
  const isConfirmEmpty = submitted && !form.confirmPassword;

  const isLengthError =
    form.newPassword !== "" && form.newPassword.length < 8;

  const isConfirmError =
    form.confirmPassword !== "" &&
    form.newPassword !== form.confirmPassword;

  const handleSubmit = async () => {
    setSubmitted(true); 

    if (!form.currentPassword) {
      return toast.error("Please enter current password");
    }

    if (!form.newPassword) {
      return toast.error("Please enter new password");
    }

    if (!form.confirmPassword) {
      return toast.error("Please confirm password");
    }

    if (form.newPassword.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }

    if (form.newPassword !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      const { data } = await axiosInstance.put(
        "/api/user/change-password",
        {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }
      );

      if (data.success) {
        toast.success("Password updated successfully");

        setForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setSubmitted(false); // reset error state
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Change Password
          </h2>
        </div>

        <div>
          <PasswordInput
            label="Current Password"
            name="currentPassword"
            placeholder="Enter current password"
            value={form.currentPassword}
            show={showPassword.currentPassword}
            onToggle={toggleVisibility}
            onChange={handleChange}
            isError={isCurrentEmpty}
          />

          <div className="py-1">
            <div className="h-[1px] bg-gray-100 w-full"></div>
          </div>

          <PasswordInput
            label="New Password"
            name="newPassword"
            placeholder="At least 8 characters"
            value={form.newPassword}
            show={showPassword.newPassword}
            onToggle={toggleVisibility}
            onChange={handleChange}
            isError={isNewEmpty || isLengthError}
          />

          {isLengthError && (
            <p className="text-xs text-red-500 -mt-3 mb-3">
              Password must be at least 8 characters
            </p>
          )}

          <PasswordInput
            label="Confirm New Password"
            name="confirmPassword"
            placeholder="Repeat new password"
            value={form.confirmPassword}
            show={showPassword.confirmPassword}
            onToggle={toggleVisibility}
            onChange={handleChange}
            isError={isConfirmEmpty || isConfirmError}
          />

          {isConfirmError && (
            <p className="text-xs text-red-500 -mt-3 mb-3">
              Passwords do not match
            </p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-6 bg-primary text-white py-3 rounded-xl font-medium shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98]"
        >
          Change Password
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;