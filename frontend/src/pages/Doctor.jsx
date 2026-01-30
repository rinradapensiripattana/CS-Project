import React, {useContext} from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

const Doctor = () => {
  
  const {doctors} = useContext(AppContext)
  const navigate = useNavigate()

  return (
    <div>
      <p className='text-gray-600'>All Doctors</p>
      <div>
      <div className='  grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(210px,max-content))] gap-6 pt-3 /*justify-center*/ text-gray-800'>
            {doctors./*slice(0,5).*/map((item,index)=>(
                <div onClick={()=>navigate(`/appointment/${item._id}`)} className='max-w-[210px] border border-blue-200 rounded-xl
                overflow-hidden cursor-pointer
                hover:-translate-y-1 transition-all duration-300' key={index}>
                    <img className='w-full aspect-[1/1.2] object-cover object-top' src={item.image} alt="" />
                    <div className='p-4'>
                        <div className='flex items-center gap-2 text-sm text-center text-green-500'>
                            <p className='w-2 h-2 bg-green-500 rounded-full '></p><p>Available</p>
                        </div>
                        <p className='text-l font-medium text-gray-700'>{item.name}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default Doctor
