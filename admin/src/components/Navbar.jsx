import React, { useContext, useState, useEffect } from 'react' // เพิ่ม useState, useEffect เพื่อแก้ error
import { assets } from '../assets/assets'
import { AdminContext } from '../context/AdminContext'
import { useNavigate } from 'react-router-dom'
import { DoctorContext } from '../context/DoctorContext'

const Navbar = () => {

    const {aToken, setAToken} = useContext(AdminContext)
    const { dToken, setDToken } = useContext(DoctorContext)

    const navigate = useNavigate()

    const [currentTime, setCurrentTime] = useState(new Date())
    
    // อัปเดตเวลาทุกวินาที
    useEffect(() => {
        const timer = setInterval(() => {
          setCurrentTime(new Date())
        }, 1000)
    
        return () => clearInterval(timer)
    }, [])

    // เปลี่ยนเป็น 'en-GB' เพื่อให้เป็นภาษาอังกฤษ
    const formatDateTime = (date) => {
        return date.toLocaleString('en-GB', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
    }

    const logout = ()=> {
        navigate('/')
        aToken && setAToken('')
        aToken && localStorage.removeItem('aToken')
        dToken && setDToken('')
        dToken && localStorage.removeItem('dToken')
    }

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white'>
        <div className='flex items-center gap-2 text-xs'>
            <img className="max-w-[140px] w-full cursor-pointer" src={assets.logo} alt="" />
            <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-grey-600'>{aToken ? 'Admin' : 'Doctor'}</p>
        </div>

        {/* ส่วนที่แก้ไข: จัดกลุ่มเวลาให้อยู่หน้าปุ่ม Logout */}
        <div className='flex items-center gap-4'>
            <p className='text-[12px] text-gray-500 hidden sm:block'>
                {formatDateTime(currentTime)}
            </p>
            <button onClick={logout} className='bg-primary text-white text-sm px-8 py-2 rounded-full'>
                Logout
            </button>
        </div>
    </div>
  )
}

export default Navbar