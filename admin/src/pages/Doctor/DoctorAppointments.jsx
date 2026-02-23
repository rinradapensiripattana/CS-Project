import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorAppointments = () => {

  const { 
    dToken, 
    appointments, 
    getAppointments, 
    cancelAppointment, 
    completeAppointment 
  } = useContext(DoctorContext)

  const { slotDateFormat, calculateAge } = useContext(AppContext)

  const [activeTab, setActiveTab] = useState("upcoming")
  const [search, setSearch] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  const clearFilters = () => {
    setSearch("")
    setFromDate("")
    setToDate("")
  }

  // 🔎 Filter by status
  const filteredByStatus = appointments.filter(item => {
    if (activeTab === "upcoming") return !item.cancelled && !item.isCompleted
    if (activeTab === "completed") return item.isCompleted
    if (activeTab === "cancelled") return item.cancelled
    return true
  })

  // 🔎 Filter by search
  const filteredBySearch = filteredByStatus.filter(item =>
    item.userData.name.toLowerCase().includes(search.toLowerCase())
  )

  // 🔎 Filter by date range
  const finalFiltered = filteredBySearch.filter(item => {
    const appointmentDate = new Date(item.slotDate)

    if (fromDate && appointmentDate < new Date(fromDate)) return false
    if (toDate && appointmentDate > new Date(toDate)) return false

    return true
  })

  return (
    <div className='w-full max-w-6xl m-5'>

      {/* Header + Filters */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3'>
        <p className='text-lg font-medium'>Doctor Appointments</p>

        <div className='flex flex-wrap items-center gap-2'>
          <input
            type="text"
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='border px-3 py-1 rounded text-sm w-48'
          />

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className='border px-2 py-1 rounded text-sm'
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className='border px-2 py-1 rounded text-sm'
          />

          {(search || fromDate || toDate) && (
            <button
              onClick={clearFilters}
              className='px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded'
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-6 border-b mb-4'>
        <button 
          onClick={() => setActiveTab("upcoming")}
          className={`pb-2 capitalize ${
            activeTab === "upcoming" 
              ? "border-b-2 border-primary text-primary font-medium" 
              : "text-gray-500"
          }`}
        >
          Upcoming
        </button>

        <button 
          onClick={() => setActiveTab("completed")}
          className={`pb-2 capitalize ${
            activeTab === "completed" 
              ? "border-b-2 border-primary text-primary font-medium" 
              : "text-gray-500"
          }`}
        >
          Completed
        </button>

        <button 
          onClick={() => setActiveTab("cancelled")}
          className={`pb-2 capitalize ${
            activeTab === "cancelled" 
              ? "border-b-2 border-primary text-primary font-medium" 
              : "text-gray-500"
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* Table */}
      <div className='bg-white border rounded text-sm max-h-[70vh] overflow-y-auto'>

        {/* Table Header */}
        <div className='hidden sm:grid grid-cols-[0.5fr_2fr_1fr_2fr_1fr] gap-2 py-3 px-6 border-b bg-gray-50 font-medium'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p className='text-center'>Action</p>
        </div>

        {/* Empty */}
        {finalFiltered.length === 0 && (
          <p className='text-center py-6 text-gray-400'>
            No appointments found
          </p>
        )}

        {/* Rows */}
        {finalFiltered.map((item, index) => (
          <div
            key={item._id}
            className='grid grid-cols-[0.5fr_2fr_1fr_2fr_1fr] gap-2 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
          >
            <p>{index + 1}</p>

            <div className='flex items-center gap-2'>
              <img 
                src={item.userData.image} 
                className='w-8 h-8 rounded-full object-cover' 
                alt=""
              />
              <p>{item.userData.name}</p>
            </div>

            <p>{calculateAge(item.userData.dob)}</p>

            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>

            {/* Action */}
            <div className='flex justify-center gap-2'>
              {item.cancelled && (
                <p className='text-red-400 text-xs font-medium'>Cancelled</p>
              )}

              {item.isCompleted && (
                <p className='text-green-500 text-xs font-medium'>Completed</p>
              )}

              {!item.cancelled && !item.isCompleted && (
                <>
                  <img 
                    onClick={() => cancelAppointment(item._id)} 
                    className='w-8 cursor-pointer' 
                    src={assets.cancel_icon} 
                    alt=""
                  />
                  <img 
                    onClick={() => completeAppointment(item._id)} 
                    className='w-8 cursor-pointer' 
                    src={assets.tick_icon} 
                    alt=""
                  />
                </>
              )}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}

export default DoctorAppointments