import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div>
        <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-18 my-10 mt-16 text-sm'>

            {/* ---- Left Section*/}
            <div>
                <img className='mb-3 w-40'src={assets.logo} alt="" />
                <p className='w-full md:w-2/3 text-gray-600 leading-6'>We believe that quality healthcare begins with understanding and genuine care for each individual. Every step of examination, diagnosis, and treatment is carried out with professionalism, safety, and responsibility. Our goal is to provide care you can trust, so you can live each day with confidence and peace of mind.</p>
            </div>

            
            {/* ---- Center Section*/}
            <div>
                <p className='text-xl font-medium mb-3'>COMPANY</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>Home</li>
                    <li>About us</li>
                    <li>Contact us</li>
                </ul>
            </div>

            {/* ---- Right Section*/}
            <div>
                <p className='text-xl font-medium mb-3'>GET IN TOUCH</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>021231234</li>
                    <li>hellodoctor@gmail.com</li>
                </ul>
            </div>
       </div>

       <div>
            <hr />
            <p className='py-5 text-sm text-center text-gray-600'>Copyright 2025@ HelloDoctor - All Right Reserved.</p>
        </div>

    </div>
  )
}

export default Footer
