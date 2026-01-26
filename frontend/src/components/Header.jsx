import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'


const Header = () => {
  return (
    <div className='flex flex-col md:flex-row
    bg-gradient-to-b from-[#9BBBC7] via-[#7FA0AF] to-[#547792]
    rounded-none md:rounded-xl
    px-6 md:px-12 lg:px-16
    min-h-[220px] md:min-h-[300px] lg:min-h-[340px]
    w-full md:max-w-[1200px] mx-auto
    overflow-hidden'>
        {/* ---- Left Side ----*/}
        <div className='md:w-1/2 flex flex-col justify-center gap-3 py-6 md:py-04'>
            <p className='text-2xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight'>
            Book Appointment <br /> With Trusted Doctors 
            </p>
            <Link to="doctors" className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full text-gray-700 text-sm font-medium self-start hover:scale-105 transition-all duration-300">
                Book appointment <img className="w-3" src={assets.arrow_icon} alt="" />
            </Link>
        </div>

        {/* ---- Right Side ----*/}
        <div className='md:w-1/2 flex justify-center md:justify-end items-end'>
            <img className='w-[80%] md:w-auto md:max-h-[90%]' src={assets.header_image} alt="" />
        </div>
    </div>
  )
}

export default Header
