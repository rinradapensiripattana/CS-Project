import React, { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

const Doctor = () => {

  const { doctors, backendUrl } = useContext(AppContext)
  const navigate = useNavigate()

  return (
    <div>
      <p className='text-gray-600'>All Doctors</p>

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(210px,max-content))] 
          justify-items-center md:justify-items-start
          gap-6 pt-3 text-gray-800'>

        {doctors.map((item) => (

          <div 
            onClick={() => navigate(`/appointment/${item.doctor_id}`)}
            className='max-w-[210px] border border-blue-200 rounded-xl
            overflow-hidden cursor-pointer
            hover:-translate-y-1 transition-all duration-300' 
            key={item.doctor_id}
          >

            <img 
              className='w-full aspect-[1/1.2] object-cover object-top'
              src={
                item.image
                  ? `${backendUrl}/uploads/${item.image}`
                  : "/default_image.png"
              }
            />

            <div className='p-4'>
              <div className={`flex items-center gap-2 text-sm text-center 
                ${item.available === 1 ? 'text-green-500' : "text-gray-500"}`}>

                <p className={`w-2 h-2 rounded-full 
                  ${item.available === 1 ? 'bg-green-500' : "bg-gray-500"}`}>
                </p>

                <p>
                  {item.available === 1 ? 'Available' : "Not Available"}
                </p>
              </div>

              <p className='text-l font-medium text-gray-700'>
                {item.name}
              </p>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}

export default Doctor