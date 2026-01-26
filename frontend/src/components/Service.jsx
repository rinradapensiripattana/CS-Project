import React from 'react'
import { ourservices } from '../assets/assets'

const Service = () => {
  return (
    <div>
        <div className="mt-8 text-center">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 leading-snug">
                A general clinic ready to take care of your health every day
            </h2>
            <p className="mt-1 text-lg md:text-xl font-light text-gray-800 leading-snug">
                with a team of expert doctors and standard treatments.
            </p>
        </div>

        <section className="mt-6 md:mt-8"></section>

        <div className="mb-2">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                Our Services
            </h2>
            <p className="mt-1 text-base md:text-lg font-light text-gray-600">
                Medical services for common ailments, covering all ages.
            </p>
        </div>

        {/* card  */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {ourservices.map((service, index) => (
          <div
            key={index}
            className="
              flex flex-col items-center justify-center
              bg-white rounded-2xl p-6
              border border-gray-100
              hover:shadow-md transition-all duration-300
            "
          >
            <img
              src={service.image}
              alt={service.title}
              className="w-17 h-17 object-contain mb-4"
            />
            <p className="text-sm font-medium text-gray-700 text-center">
              {service.title}
            </p>
          </div>
        ))}
        </div>

        <section className="mt-6 md:mt-8"></section>

    </div>

    
  )
}

export default Service
