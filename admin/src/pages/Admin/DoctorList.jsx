import React, { useContext, useEffect } from "react";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";

const DoctorsList = () => {
  const { doctors, aToken, getAllDoctors, changeAvailability } =
    useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);

  useEffect(() => {
    if (aToken) {
      getAllDoctors();
    }
  }, [aToken]);

  return (
    <div className="m-5 max-h-[90vh] overflow-y-scroll">
      <h1 className="text-lg font-medium">All Doctors</h1>

      <div className="w-full flex flex-wrap gap-4 pt-5 gap-y-6">
        {doctors.map((item) => (
          <div
            key={item.doctor_id}
            className="border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden cursor-pointer group"
          >
            <img
              className="group-hover:bg-primary transition-all duration-500 w-full aspect-[1/1.2] object-cover object-top"
              src={
                item.image
                  ? item.image.startsWith("http")
                    ? item.image
                    : backendUrl + item.image
                  : "/default_image.png"
              }
              alt=""
            />

            <div className="p-4">
              <p className="text-[#262626] text-lg font-medium whitespace-nowrap">
                {item.name}
              </p>

              <p className="text-[#5C5C5C] text-sm">{item.degree}</p>

              <p className="text-[#5C5C5C] text-sm">
                {item.experience} Years Experience
              </p>

              <div className="mt-2 flex items-center gap-1 text-sm">
                <input
                  onChange={() => changeAvailability(item.doctor_id)}
                  type="checkbox"
                  checked={item.available === 1}
                />
                <p>Available</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorsList;
