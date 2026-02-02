import React, { useState } from 'react'
import { assets } from '../assets/assets'

const MyProfile = () => {

  const [isEdit, setIsEdit] = useState(false)
  const [image, setImage] = useState(null)

  const [userData, setUserData] = useState({
    name: 'Nat K',
    email: 'nat@example.com',
    phone: '0812345678',
    gender: 'Female',
    dob: '2002-01-01',
    image: assets.profile_pic, // รูป default
    address: {
      line1: '123 ถนนสุขุมวิท',
      line2: 'กรุงเทพมหานคร'
    }
  })

  return (
    <div className='max-w-lg flex flex-col gap-2 text-sm pt-5'>

      {/* PROFILE IMAGE */}
      {isEdit ? (
        <label htmlFor='image'>
          <div className='inline-block relative cursor-pointer'>
            <img
              className='w-36 rounded opacity-75'
              src={image ? URL.createObjectURL(image) : userData.image}
              alt=""
            />
            <img
              className='w-10 absolute bottom-12 right-12'
              src={assets.upload_icon}
              alt=""
            />
          </div>
          <input
            type="file"
            id="image"
            hidden
            onChange={(e) => setImage(e.target.files[0])}
          />
        </label>
      ) : (
        <img className='w-36 rounded' src={userData.image} alt="" />
      )}

      {/* NAME */}
      {isEdit ? (
        <input
          className='bg-gray-50 text-3xl font-medium max-w-60'
          type="text"
          value={userData.name}
          onChange={(e) =>
            setUserData(prev => ({ ...prev, name: e.target.value }))
          }
        />
      ) : (
        <p className='font-medium text-3xl text-[#262626] mt-4'>
          {userData.name}
        </p>
      )}

      <hr className='bg-[#ADADAD] h-[1px] border-none' />

      {/* CONTACT */}
      <p className='text-gray-600 underline mt-3'>CONTACT INFORMATION</p>

      <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3'>
        <p>Email:</p>
        <p className='text-blue-500'>{userData.email}</p>

        <p>Phone:</p>
        {isEdit ? (
          <input
            className='bg-gray-50 max-w-52'
            value={userData.phone}
            onChange={(e) =>
              setUserData(prev => ({ ...prev, phone: e.target.value }))
            }
          />
        ) : (
          <p className='text-blue-500'>{userData.phone}</p>
        )}

        <p>Address:</p>
        {isEdit ? (
          <div>
            <input
              className='bg-gray-50'
              value={userData.address.line1}
              onChange={(e) =>
                setUserData(prev => ({
                  ...prev,
                  address: { ...prev.address, line1: e.target.value }
                }))
              }
            />
            <br />
            <input
              className='bg-gray-50'
              value={userData.address.line2}
              onChange={(e) =>
                setUserData(prev => ({
                  ...prev,
                  address: { ...prev.address, line2: e.target.value }
                }))
              }
            />
          </div>
        ) : (
          <p>
            {userData.address.line1}
            <br />
            {userData.address.line2}
          </p>
        )}
      </div>

      {/* BASIC INFO */}
      <p className='text-[#797979] underline mt-3'>BASIC INFORMATION</p>

      <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3'>
        <p>Gender:</p>
        {isEdit ? (
          <select
            value={userData.gender}
            onChange={(e) =>
              setUserData(prev => ({ ...prev, gender: e.target.value }))
            }
          >
            <option>Not Selected</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        ) : (
          <p>{userData.gender}</p>
        )}

        <p>Birthday:</p>
        {isEdit ? (
          <input
            type="date"
            value={userData.dob}
            onChange={(e) =>
              setUserData(prev => ({ ...prev, dob: e.target.value }))
            }
          />
        ) : (
          <p>{userData.dob}</p>
        )}
      </div>

      {/* BUTTON */}
      <div className='mt-10'>
        {isEdit ? (
          <button
            onClick={() => setIsEdit(false)}
            className='border px-8 py-2 rounded-full'
          >
            Save information
          </button>
        ) : (
          <button
            onClick={() => setIsEdit(true)}
            className='border px-8 py-2 rounded-full'
          >
            Edit
          </button>
        )}
      </div>
    </div>
  )
}

export default MyProfile
