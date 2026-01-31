import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {
  return (
    <div>

      <div className='text-center text-2xl pt-10 text-[#707070]'>
        <p>CONTACT <span className='text-gray-700 font-semibold'>US</span></p>
      </div>

      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 text-sm'>
        <img className='w-full md:max-w-[470px]' src={assets.contact_image} alt="" />
        <div className='flex flex-col justify-start items-start gap-6'>
          <p className=' font-semibold text-lg text-gray-600'>OUR OFFICE</p>
          <p className=' text-gray-500'>เลขที่ 128/45 ถนนสุขุมวิท 77 <br /> แขวงพระโขนงเหนือ เขตวัฒนา กรุงเทพมหานคร 10260</p>
          <p className=' text-gray-500'>Tel: 021231234 <br /> Email: hellodoctor@gmail.com</p>
        </div>
      </div>

    </div>
  )
}

export default Contact
