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
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [policy, setPolicy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { backendUrl, token, setToken } = useContext(AppContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    const newErrors = {};

    if (state === "Sign Up") {
      if (!name) newErrors.name = true;
      if (!phone || phone.length !== 10) newErrors.phone = true;
      if (!idNumber || idNumber.length !== 13) newErrors.idNumber = true;
      if (gender === "Not Selected") newErrors.gender = true;
      if (!dob) newErrors.dob = true;
      if (!policy) {
        toast.error("Please agree to the policy");
        return;
      }
    }

    if (!email) newErrors.email = true;
    if (!password) newErrors.password = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      if (state === "Sign Up") {
        const { data } = await axios.post(backendUrl + "/api/user/register", {
          name,
          email,
          password,
          dob,
          gender,
          phone,
          id_number: idNumber,
        });

        if (data.success) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
          toast.success("Register Success");
        } else {
          const serverErrors = {};
          const isDuplicateEmail = data.message.toLowerCase().includes("email");
          const isDuplicateId =
            data.message.toLowerCase().includes("id number") ||
            data.message.toLowerCase().includes("id_number");

          if (isDuplicateEmail) {
            serverErrors.email = true;
          }
          if (isDuplicateId) {
            serverErrors.idNumber = true;
          }

          if (isDuplicateEmail && isDuplicateId) {
            toast.error("This email address and id number have already been used");
          } else if (isDuplicateId) {
            toast.error("This id number has already been used");
          } else if (isDuplicateEmail) {
            toast.error("This email address has already been used");
          } else {
            toast.error(data.message);
          }
          setErrors(serverErrors);
        }
      } else {
        const { data } = await axios.post(backendUrl + "/api/user/login", {
          email,
          password,
        });

        if (data.success) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
          toast.success("Login Success");
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

        {/* ================= REGISTER FIELDS ================= */}
        {state === "Sign Up" && (
          <>
            <div className="w-full">
              <p>Full Name</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className={`border rounded w-full p-2 mt-1 ${errors.name ? "border-red-500" : ""}`}
                type="text"
              />
            </div>

            <div className="w-full">
              <p>Phone Number</p>
              <input
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setPhone(value);
                  }
                }}
                value={phone}
                className={`border rounded w-full p-2 mt-1 ${errors.phone ? "border-red-500" : ""}`}
                type="text"
                maxLength={10}
              />
            </div>

            <div className="w-full">
              <p>ID Number</p>
              <input
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setIdNumber(value);
                  }
                }}
                value={idNumber}
                className={`border rounded w-full p-2 mt-1 ${errors.idNumber ? "border-red-500" : ""}`}
                type="text"
                maxLength={13}
              />
            </div>

            <div className="flex w-full gap-2">
              <div className="w-full">
                <p>Gender</p>
                <select
                  onChange={(e) => setGender(e.target.value)}
                  value={gender}
                  className={`border rounded w-full p-2 mt-1 ${errors.gender ? "border-red-500" : ""}`}
                >
                  <option value="Not Selected">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="w-full">
                <p>Date of Birth</p>
                <input
                  onChange={(e) => setDob(e.target.value)}
                  value={dob}
                  className={`border rounded w-full p-2 mt-1 ${errors.dob ? "border-red-500" : ""}`}
                  type="date"
                />
              </div>
            </div>
          </>
        )}

        {/* ================= EMAIL ================= */}
        <div className="w-full">
          <p>Email</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className={`border rounded w-full p-2 mt-1 ${errors.email ? "border-red-500" : ""}`}
            type="email"
          />
        </div>

        {/* ================= PASSWORD ================= */}
        <div className="w-full">
          <p>Password</p>
          <div className="relative">
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className={`border rounded w-full p-2 mt-1 ${errors.password ? "border-red-500" : ""}`}
              type={showPassword ? "text" : "password"}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 cursor-pointer"
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>
        </div>

        {/* ================= CONSENT ================= */}
        {state === "Sign Up" && (
          <>
            <div className="flex items-center gap-2 w-full mt-2">
              <input
                onChange={(e) => setPolicy(e.target.checked)}
                checked={policy}
                type="checkbox"
                className="mt-1"
              />
              <p className="text-sm leading-relaxed">
                ข้าพเจ้าตกลงและยอมรับข้อกำหนดและเงื่อนไข
              </p>
            </div>

            <div className="w-full -mt-2 ml-5 relative">
              <details className="w-full">
                <summary className="p-1 text-xs cursor-pointer text-gray-500 hover:text-gray-700">
                  นโยบายความเป็นส่วนตัว
                </summary>

                <div className="absolute left-0 top-full mt-2 w-full max-h-64 overflow-y-auto bg-white border border-[#DADADA] rounded-md shadow-lg p-4 z-20">
                  <div className="text-xs text-[#5E5E5E] leading-relaxed space-y-2">
                    <p>
                      HelloDr. คลินิก
                      ให้ความสำคัญสูงสุดต่อสิทธิความเป็นส่วนตัวและความปลอดภัยของข้อมูลส่วนบุคคลของท่าน
                      โดยปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ.
                      2562 อย่างเคร่งครัด
                    </p>

                    <p>
                      ข้อมูลของท่านจะถูกใช้เพื่อวัตถุประสงค์ในการให้บริการทางการแพทย์
                      การวินิจฉัย และการติดตามผลการรักษาเท่านั้น
                    </p>

                    <p>
                      เราจะไม่เปิดเผยข้อมูลส่วนบุคคลแก่บุคคลภายนอก
                      โดยไม่ได้รับความยินยอมจากท่าน
                      เว้นแต่เป็นไปตามที่กฎหมายกำหนด
                    </p>
                  </div>
                </div>
              </details>
            </div>
          </>
        )}

        {/* ================= BUTTON ================= */}
        <button className="bg-primary text-white w-full py-2 rounded-md mt-2">
          {state === "Sign Up" ? "Create account" : "Login"}
        </button>

        {/* ================= TOGGLE ================= */}
        <p>
          {state === "Sign Up"
            ? "Already have account?"
            : "Create new account?"}
          <span
            onClick={() => setState(state === "Sign Up" ? "Login" : "Sign Up")}
            className="text-primary underline cursor-pointer ml-1"
          >
            {state === "Sign Up" ? "Login here" : "Sign Up"}
          </span>
        </p>
      </div>
    </form>
  );
};

export default Login;
