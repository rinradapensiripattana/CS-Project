import React, { useEffect, useState, useMemo, useContext } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AllAppointments = () => {

  const { aToken, appointments, getAllAppointments, cancelAppointment } = useContext(AdminContext)
  const { slotDateFormat, calculateAge } = useContext(AppContext)

  const [activeTab, setActiveTab] = useState('upcoming')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  const clearFilters = () => {
    setFromDate('')
    setToDate('')
    setSearch('')
  }

  const getType = (item) => {
    if (item.cancelled) return 'cancelled'
    if (item.isCompleted) return 'completed'
    return 'upcoming'
  }

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(item => getType(item) === activeTab)
      .filter(item => {
        const itemDate = new Date(item.slotDate)
        if (fromDate && itemDate < new Date(fromDate)) return false
        if (toDate && itemDate > new Date(toDate)) return false
        return true
      })
      .filter(item => {
        if (!search) return true
        const patient = item.userData?.name?.toLowerCase() || ''
        const doctor = item.docData?.name?.toLowerCase() || ''
        return (
          patient.includes(search.toLowerCase()) ||
          doctor.includes(search.toLowerCase())
        )
      })
  }, [appointments, activeTab, fromDate, toDate, search])

  const countByType = (type) =>
    appointments.filter(item => getType(item) === type).length

  return (
    <div className='w-full max-w-6xl m-5'>

      {/* 🔹 Header + Filters */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3'>

        <p className='text-lg font-medium'>All Appointments</p>

        <div className='flex flex-wrap items-center gap-2'>

          <input
            type="text"
            placeholder='Search patient or doctor...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='border px-3 rounded text-sm w-56 h-10'
          />

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className='border px-2 rounded text-sm h-10'
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className='border px-2 rounded text-sm h-10'
          />

          {(search || fromDate || toDate) && (
            <button
              onClick={clearFilters}
              className='px-4 text-sm bg-gray-200 hover:bg-gray-300 rounded h-10'
            >
              Clear
            </button>
          )}

        </div>
      </div>

      {/* 🔹 Tabs */}
      <div className='flex gap-6 border-b mb-5'>
        {['upcoming', 'completed', 'cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 capitalize transition ${
              activeTab === tab
                ? 'border-b-2 border-primary font-medium text-primary'
                : 'text-gray-500'
            }`}
          >
            {tab}{/*  ({countByType(tab)}) */}
          </button>
        ))}
      </div>

      {/* 🔹 Table */}
      <div className='border rounded text-sm max-h-[65vh] overflow-y-auto'>

        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr] py-3 px-6 border-b bg-gray-50 font-medium'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p className='text-center'>Action</p>
        </div>

        {filteredAppointments.map((item, index) => (
          <div
            key={item._id}
            className='grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
          >
            <p>{index + 1}</p>

            <div className='flex items-center gap-2'>
              <img
                src={item.userData?.image}
                className='w-8 h-8 rounded-full object-cover'
                alt=""
              />
              <p>{item.userData?.name}</p>
            </div>

            <p>
              {item.userData?.dob ? calculateAge(item.userData.dob) : '-'}
            </p>

            <p>
              {slotDateFormat(item.slotDate)}, {item.slotTime}
            </p>

            <div className='flex items-center gap-2'>
              <img
                src={item.docData?.image}
                className='w-8 h-8 object-cover object-top rounded-full'
                alt=""
              />
              <p>{item.docData?.name}</p>
            </div>

            <div className='flex justify-center'>
              {item.cancelled ? (
                <p className='text-red-400 text-xs font-medium'>Cancelled</p>
              ) : item.isCompleted ? (
                <p className='text-green-500 text-xs font-medium'>Completed</p>
              ) : (
                <img
                  onClick={() => cancelAppointment(item._id)}
                  className='w-8 cursor-pointer'
                  src={assets.cancel_icon}
                  alt=""
                />
              )}
            </div>
          </div>
        ))}

        {filteredAppointments.length === 0 && (
          <p className='text-center py-6 text-gray-400'>
            No appointments found
          </p>
        )}

      </div>

    </div>
  )
}

export default AllAppointments