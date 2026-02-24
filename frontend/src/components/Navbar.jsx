import React, { useContext, useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Navbar = () => {

  const navigate = useNavigate()
  const { token, setToken, userData } = useContext(AppContext)

  const [showMenu, setShowMenu] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // อัปเดตเวลาทุกวินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // เปลี่ยนเป็น 'en-GB' หรือ 'en-US' เพื่อให้เป็นภาษาอังกฤษ
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

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    navigate('/')
  }

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400'>
      
      {/* Logo */}
      <img
        onClick={() => navigate('/')}
        className="max-w-[180px] w-full cursor-pointer"
        src={assets.logo}
        alt="logo"
      />

      {/* Desktop Menu */}
      <ul className='hidden md:flex items-center gap-5 font-medium'>
        <NavLink to='/'><li className='py-1'>HOME</li></NavLink>
        <NavLink to='/doctors'><li className='py-1'>ALL DOCTOR</li></NavLink>
        <NavLink to='/about'><li className='py-1'>ABOUT</li></NavLink>
        <NavLink to='/contact'><li className='py-1'>CONTACT</li></NavLink>
      </ul>

      {/* Right Section */}
      <div className='flex items-center gap-4'>

        {token && userData ? (
          <div className='flex items-center gap-2 cursor-pointer group relative'>
            <div className='flex flex-col items-end'>
              <p className='font-medium text-gray-700'>{userData.name}</p>
              {/* ย้ายเวลามาไว้ตรงนี้ (ใต้ชื่อ) */}
              <p className='text-[12px] text-gray-500'>
                {formatDateTime(currentTime)}
              </p>
            </div>
            
            <img className='w-8 h-8 rounded-full object-cover' src={userData.image} alt="profile" />
            <img className='w-2.5' src={assets.dropdown_icon} alt="dropdown" />

            {/* Dropdown */}
            <div className='absolute top-0 right-0 pt-14 z-20 hidden group-hover:block'>
              <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4 text-base text-gray-600'>
                <p onClick={() => navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                <p onClick={() => navigate('/my-appointments')} className='hover:text-black cursor-pointer'>My Appointment</p>
                <p onClick={() => navigate('/history')} className='hover:text-black cursor-pointer'>History</p>
                <p onClick={logout} className='hover:text-black cursor-pointer'>Logout</p>
              </div>
            </div>
          </div>
        ) : (
          <div className='flex items-center gap-4'>
            {/* กรณีไม่ได้ Login ยังแสดงเวลาแบบภาษาอังกฤษไว้ข้างๆ ปุ่มได้ */}
            <div className='hidden md:block text-[11px] text-gray-500'>
                {formatDateTime(currentTime)}
            </div>
            <button
                onClick={() => navigate('/login')}
                className='bg-primary text-white px-4 py-3 rounded-full font-light hidden md:block'
            >
                Create account
            </button>
          </div>
        )}

        {/* Mobile Menu Icon */}
        <img
          onClick={() => setShowMenu(true)}
          className='w-6 md:hidden cursor-pointer'
          src={assets.menu_icon}
          alt="menu"
        />

        {/* Mobile Menu (คงเดิม) */}
        <div className={`${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img className='w-36' src={assets.logo} alt="logo" />
            <img
              className='w-7 cursor-pointer'
              onClick={() => setShowMenu(false)}
              src={assets.cross_icon}
              alt="close"
            />
          </div>

          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2'>HOME</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors'><p className='px-4 py-2'>ALL DOCTORS</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about'><p className='px-4 py-2'>ABOUT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact'><p className='px-4 py-2'>CONTACT</p></NavLink>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar