import React, { useContext } from 'react'
import { AppContext } from '../context/AppContext'

const MyAppointment = () => {

  const { doctors } = useContext(AppContext)

  return (
    <div>
      <p className='pb-3 mt-3 font-medium text-zinc-700 border-b'>My Appointments</p>
      <div>
        {doctors.slice(0,2).map((item,index)=>(
          <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key={index}>
            <div>
              <img className='w-24 h-28 object-cover object-top rounded-lg' src={item.image} alt="" />
            </div>
            <div className='flex-1 flex flex-col text-ml text-zinc-600'>
              <p className='text-neutral-800 font-semibold'>{item.name}</p>
              <p className='text-sm mt-auto'><span className='text-sm text-neutral-700 font-medium'>Date & Time :</span> 2 Feb 2026 | 9:30</p>
            </div>

            <div className='flex flex-col gap-2 justify-end'>
              <button className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounde hover:bg-red-700 hover:text-white translate-all duration-300 '>Cancel appointment</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyAppointment
