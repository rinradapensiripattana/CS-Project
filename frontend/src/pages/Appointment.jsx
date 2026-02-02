import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

const Appointment = () => {

  const {docId} = useParams()
  const {doctors} = useContext(AppContext)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const [docInfo,setDocInfo] = useState(null)
  const [docSlots,setDocSlots] = useState([])
  const [slotIndex,setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')
  
  const fetchDocInFo = async () => {
    const docInfo = doctors.find(doc => doc._id === docId)
    setDocInfo(docInfo)
  }

  const getAvailaleSlots = async () => {
    setDocSlots([])

    // getting current date
    let today = new Date()
    for(let i = 0; i < 10; i++){
      // getting date with index
      let currentDate = new Date(today)
      currentDate.setDate(today.getDate()+i)
      
      // setting end time of the date with index
      let endTime = new Date()
      endTime.setDate(today.getDate()+i)
      endTime.setHours(21,0,0,0)

      // setting hours
      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(currentDate.getHours() > 9 ? currentDate.getHours() + 1 : 9)
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
      } else {
        currentDate.setHours(9)
        currentDate.setMinutes(0)
      }

      let timeSlot = []

      while(currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], {hour:'2-digit', minute: '2-digit'})

        // add slot to array
        timeSlot.push({
          datetime : new Date(currentDate),
          time : formattedTime
        })

        // Increment current time by 30 minutes
        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }

      setDocSlots(prev => ([...prev, timeSlot]))
    }
  }

  useEffect(()=>{
    fetchDocInFo()
  },[doctors,docId])

  useEffect(()=>{
    if (docInfo) {
      getAvailaleSlots()
    }
  },[docInfo])

  useEffect(()=>{
    console.log(docSlots)   
  },[docSlots])

  return docInfo && (
    <div>
      {/* Doctor Details */}
      <div className='grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4'>
        <div>
          <img src={docInfo?.image} alt="" className="w-full sm:w-32 md:w-36 h-auto max-h-60 rounded-lg" />
        </div>

        <div className='flex-1 border border-gray-300 rounded-lg p-6 bg-white mx-2 sm:mx-0 mt-[-32px] sm:mt-0'>
          {/* Doc Info : name, degree, experience */}
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
            {docInfo.name}
          </p>
          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <p>{docInfo.degree}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
          </div>

          {/* Doctor About */}
          <div>
            <p className='flex items-center gap-1 text-sm font-medium text-gray-900 mt-2'>About <img className='w-3' src={assets.info_icon} alt="" /></p>
            <p className='text-sm text-gray-600 max-w-[800px] leading-relaxed mt-2'> {docInfo.about}</p>
          </div>
        </div>
      </div>

    {/* Booking Slot */}
    <div className='sm:ml-[160px] mt-4 font-medium text-gray-700'>
      <p>Booking slots</p>
      <div className='flex gap-3 items-center w-full overflow-x-scroll scrollbar-hide mt-4'>
        {
          docSlots.length && docSlots.map((item,index)=>(
            <div onClick={() => setSlotIndex(index)} key={index} className={`text-center py-6 min-w-16 rounded-full cursor-pointer border transition-all duration-200 ${slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'}`}>
              <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
              <p>{item[0] && item[0].datetime.getDate()}</p>
            </div>
          ))
        }
      </div>

      <div className='flex items-center gap-3 w-full overflow-x-scroll scrollbar-hide mt-4'>
          {docSlots.length && docSlots[slotIndex].map((item,index)=>(
            <p onClick={()=>setSlotTime(item.time)} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer border transition-all duration-200 ${item.time === slotTime ? 'bg-primary text-white' : 'text-gray-400 border border-gray-300'}`} key={index}>
              {item.time.toLowerCase()}
            </p>
          ))}
      </div>

      {/* appointment button */}
      <button className='bg-primary text-white text-sm font-light px-8 py-3 rounded-full my-6'>Book an appointment</button>

    </div>
    </div>
  )
}

export default Appointment
