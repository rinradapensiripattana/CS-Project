import React, { useContext, useState } from 'react'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'

const AddDoctor = () => {

  const [docImg, setDocImg] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [degree, setDegree] = useState('')
  const [experience, setExperience] = useState(1)
  const [about, setAbout] = useState('')

  const { aToken } = useContext(AdminContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {

      if (!docImg) {
        return toast.error('Please upload doctor image')
      }

      const formData = new FormData()
      formData.append('image', docImg)
      formData.append('name', name)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('degree', degree)
      formData.append('experience', experience) // INT
      formData.append('about', about)

      const { data } = await axios.post(
        'http://localhost:4000/api/admin/add-doctor',
        formData,
        { headers: { aToken } }
      )

      if (data.success) {
        toast.success(data.message)

        setDocImg(null)
        setName('')
        setEmail('')
        setPassword('')
        setDegree('')
        setExperience(1)
        setAbout('')
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex justify-center mt-8'>
      <div className='bg-white shadow-xl rounded-2xl p-8 w-full max-w-3xl'>

        <h2 className='text-2xl font-semibold mb-6 text-gray-700'>Add Doctor</h2>

        {/* Image Upload */}
        <div className='flex items-center gap-4 mb-6'>
          <label htmlFor="doc-img">
            <img
              className='w-20 h-20 object-cover rounded-full border cursor-pointer'
              src={
                docImg
                  ? URL.createObjectURL(docImg)
                  : "/default_image.png"
              }
              alt=""
            />
          </label>
          <input
            type="file"
            id="doc-img"
            hidden
            onChange={(e) => setDocImg(e.target.files[0])}
          />
          <p className='text-sm text-gray-500'>Upload doctor picture</p>
        </div>

        {/* Name */}
        <div className='mb-4'>
          <input
            className='w-full border rounded-lg px-4 py-2'
            type="text"
            placeholder='Doctor Name'
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        {/* Email + Degree */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          <input
            className='border rounded-lg px-4 py-2'
            type="email"
            placeholder='Doctor Email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className='border rounded-lg px-4 py-2'
            type="text"
            placeholder='Education'
            value={degree}
            onChange={e => setDegree(e.target.value)}
            required
          />
        </div>

        {/* Password + Experience */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          <input
            className='border rounded-lg px-4 py-2'
            type="password"
            placeholder='Password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <select
            value={experience}
            onChange={e => setExperience(Number(e.target.value))}
            className='border rounded-lg px-4 py-2'
          >
            {[...Array(30)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} {i + 1 === 1 ? "Year" : "Years"}
              </option>
            ))}
          </select>
        </div>

        {/* About */}
        <div className='mb-6'>
          <textarea
            className='w-full border rounded-lg px-4 py-2'
            rows={4}
            placeholder='Write about doctor...'
            value={about}
            onChange={e => setAbout(e.target.value)}
            required
          />
        </div>

        <button
          type='submit'
          className='w-full bg-blue-500 text-white py-3 rounded-full hover:bg-blue-600 transition'
        >
          Add Doctor
        </button>

      </div>
    </form>
  )
}

export default AddDoctor