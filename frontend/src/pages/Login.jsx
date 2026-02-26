import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [state, setState] = useState("Sign Up");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Not Selected");
  const [policy, setPolicy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { backendUrl, token, setToken } = useContext(AppContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      if (state === "Sign Up") {
        if (gender === "Not Selected") {
          toast.error("Please select gender");
          return;
        }

        if (!policy) {
          toast.error("Please agree to the policy");
          return;
        }

        const { data } = await axios.post(backendUrl + "/api/user/register", {
          name,
          email,
          password,
          dob,
          gender,
        });

        if (data.success) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(backendUrl + "/api/user/login", {
          email,
          password,
        });

        if (data.success) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  return (
    <form onSubmit={onSubmitHandler} className="min-h-[80vh] flex items-center">
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg">

        <p className="text-2xl font-semibold">
          {state === "Sign Up" ? "Create Account" : "Login"}
        </p>

        <p>
          Please {state === "Sign Up" ? "sign up" : "log in"} to book appointment
        </p>

        {/* Full Name */}
        {state === "Sign Up" && (
          <div className="w-full">
            <p>Full Name</p>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              className="border border-[#DADADA] rounded w-full p-2 mt-1"
              type="text"
              required
            />
          </div>
        )}

        {/* Gender + DOB */}
        {state === "Sign Up" && (
          <div className="flex w-full gap-2">
            <div className="w-full">
              <p>Gender</p>
              <select
                onChange={(e) => setGender(e.target.value)}
                value={gender}
                className="border border-[#DADADA] rounded w-full p-2 mt-1"
                required
              >
                <option value="Not Selected">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="w-full">
              <p>Date of Birth</p>
              <input
                onChange={(e) => setDob(e.target.value)}
                value={dob}
                className="border border-[#DADADA] rounded w-full p-2 mt-1"
                type="date"
                required
              />
            </div>
          </div>
        )}

        {/* Email */}
        <div className="w-full">
          <p>Email</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className="border border-[#DADADA] rounded w-full p-2 mt-1"
            type="email"
            required
          />
        </div>

        {/* Password */}
        <div className="w-full">
          <p>Password</p>
          <div className="relative mt-1">
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="border border-[#DADADA] rounded w-full p-2"
              type={showPassword ? "text" : "password"}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-sm text-gray-500"
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>
        </div>

        {/* Policy Checkbox */}
        {state === "Sign Up" && (
          <>
            <div className="flex items-center gap-2 w-full mt-2">
              <input
                onChange={(e) => setPolicy(e.target.checked)}
                checked={policy}
                type="checkbox"
                required
                className="mt-1"
              />
              <p className="text-sm leading-relaxed">
                ข้าพเจ้าตกลงและยอมรับข้อกำหนดและเงื่อนไข
              </p>
            </div>

            {/* Privacy Policy */}
            <div className="w-full -mt-2 ml-5 relative">
              <details className="w-full">
                <summary className="p-1 text-xs cursor-pointer text-gray-500 hover:text-gray-700">
                  นโยบายความเป็นส่วนตัว
                </summary>

                <div className="absolute left-0 top-full mt-2 w-full max-h-64 overflow-y-auto bg-white border border-[#DADADA] rounded-md shadow-lg p-4 z-20">
                  <div className="text-xs text-[#5E5E5E] leading-relaxed space-y-2">

                    <p>
                      HelloDr. คลินิก ให้ความสำคัญสูงสุดต่อสิทธิความเป็นส่วนตัวและความปลอดภัยของข้อมูลส่วนบุคคลของท่าน
                      โดยปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 อย่างเคร่งครัด
                    </p>

                    <p>
                      เราได้ดำเนินการมาตรการด้านเทคนิคและมาตรการด้านการบริหารจัดการที่เหมาะสม
                      เพื่อป้องกันไม่ให้ข้อมูลส่วนบุคคลถูกเข้าถึงหรือเปิดเผยโดยไม่ได้รับอนุญาต
                    </p>

                    <p>
                      ข้อมูลของท่านจะถูกใช้เพื่อวัตถุประสงค์ในการให้บริการทางการแพทย์
                      การวินิจฉัย และการติดตามผลการรักษาเท่านั้น
                    </p>

                  </div>
                </div>
              </details>
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-primary text-white w-full py-2 my-2 rounded-md text-base"
        >
          {state === "Sign Up" ? "Create account" : "Login"}
        </button>

        {/* Toggle Login / Sign Up */}
        {state === "Sign Up" ? (
          <p>
            Already have an account?{" "}
            <span
              onClick={() => setState("Login")}
              className="text-primary underline cursor-pointer"
            >
              Login here
            </span>
          </p>
        ) : (
          <p>
            Create a new account?{" "}
            <span
              onClick={() => setState("Sign Up")}
              className="text-primary underline cursor-pointer"
            >
              Click here
            </span>
          </p>
        )}
      </div>
    </form>
  );
};

export default Login;