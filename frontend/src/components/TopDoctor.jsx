import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const TopDoctor = () => {
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);

  // ✅ เพิ่มบรรทัดนี้
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800">
          Top Doctors
        </h2>
        <p className="mt-1 text-base md:text-lg font-light text-gray-600">
          Our experienced doctors are committed to providing safe and reliable
          care.
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 
                md:grid-cols-[repeat(auto-fit,minmax(210px,max-content))] 
                justify-items-center md:justify-items-start
                gap-6 pt-3 text-gray-800"
      >
        {doctors?.map((item, index) => (
          <div
            key={index}
            onClick={() => {
              navigate(`/appointment/${item._id}`);
              window.scrollTo(0, 0);
            }}
            className="max-w-[210px] border border-blue-200 
                        rounded-xl overflow-hidden cursor-pointer 
                        hover:-translate-y-1 transition-all duration-300"
          >
            <img
              className="w-full aspect-[1/1.2] object-cover object-top"
              src={
                item.image
                  ? item.image.startsWith("http")
                    ? item.image
                    : `${backendUrl}${item.image}`
                  : "/default_image.png"
              }
              alt={item.name}
            />

            <div className="p-4">
              <div
                className={`flex items-center gap-2 text-sm 
                                ${item.available ? "text-green-500" : "text-gray-500"}`}
              >
                <p
                  className={`w-2 h-2 rounded-full 
                                    ${item.available ? "bg-green-500" : "bg-gray-500"}`}
                ></p>
                <p>{item.available ? "Available" : "Not Available"}</p>
              </div>

              <p className="text-l font-medium text-gray-700">{item.name}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-6 md:mt-8"></section>
    </div>
  );
};

export default TopDoctor;
