import React, { useContext, useState } from 'react'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AddDoctor = () => {

    const [docImg, setDocImg] = useState(null)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [degree, setDegree] = useState('')
    const [experience, setExperience] = useState('')
    const [about, setAbout] = useState('')

    const { backendUrl } = useContext(AppContext)
    const { aToken } = useContext(AdminContext)

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        try {

            if (!docImg) {
                return toast.error('Image Not Selected')
            }

            if (!experience || experience < 0) {
                return toast.error('Experience must be a valid number')
            }

            const formData = new FormData()

            formData.append('image', docImg)
            formData.append('name', name)
            formData.append('email', email)
            formData.append('password', password)
            formData.append('degree', degree)
            formData.append('experience', experience)
            formData.append('about', about)

            const { data } = await axios.post(
                backendUrl + '/api/admin/add-doctor',
                formData,
                { headers: { aToken } }
            )

            if (data.success) {
                toast.success(data.message)

                // reset form
                setDocImg(null)
                setName('')
                setEmail('')
                setPassword('')
                setDegree('')
                setExperience('')
                setAbout('')

            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>

            <p className='mb-3 text-lg font-medium'>Add Doctor</p>

            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl'>

                {/* Image Upload */}
                <div className='flex items-center gap-4 mb-6 text-gray-500'>
                    <label htmlFor="doc-img">
                        <img
                            className='w-16 h-16 object-cover bg-gray-100 rounded-full cursor-pointer'
                            src={docImg ? URL.createObjectURL(docImg) : assets.upload_area}
                            alt=""
                        />
                    </label>
                    <input
                        onChange={(e) => setDocImg(e.target.files[0])}
                        type="file"
                        id="doc-img"
                        hidden
                    />
                    <p>Upload doctor <br /> picture</p>
                </div>

                {/* Doctor Name */}
                <div className='flex flex-col gap-1 mb-4'>
                    <p>Doctor Name</p>
                    <input
                        onChange={e => setName(e.target.value)}
                        value={name}
                        className='border rounded px-3 py-2'
                        type="text"
                        required
                    />
                </div>

                {/* Two Columns */}
                <div className='flex flex-col lg:flex-row gap-10 text-gray-600'>

                    {/* Left */}
                    <div className='flex-1 flex flex-col gap-4'>
                        <div>
                            <p>Doctor Email</p>
                            <input
                                onChange={e => setEmail(e.target.value)}
                                value={email}
                                className='border rounded px-3 py-2 w-full'
                                type="email"
                                required
                            />
                        </div>

                        <div>
                            <p>Education</p>
                            <input
                                onChange={e => setDegree(e.target.value)}
                                value={degree}
                                className='border rounded px-3 py-2 w-full'
                                type="text"
                                required
                            />
                        </div>
                    </div>

                    {/* Right */}
                    <div className='flex-1 flex flex-col gap-4'>
                        <div>
                            <p>Password</p>
                            <input
                                onChange={e => setPassword(e.target.value)}
                                value={password}
                                className='border rounded px-3 py-2 w-full'
                                type="password"
                                required
                            />
                        </div>

                        <div>
                            <p>Experience (Years)</p>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                onChange={e => setExperience(e.target.value)}
                                value={experience}
                                className='border rounded px-3 py-2 w-full'
                                placeholder='Enter years'
                                required
                            />
                        </div>
                    </div>

                </div>

                {/* About */}
                <div className='mt-4'>
                    <p className='mb-2'>About Doctor</p>
                    <textarea
                        onChange={e => setAbout(e.target.value)}
                        value={about}
                        className='w-full px-4 pt-2 border rounded'
                        rows={4}
                        required
                    />
                </div>

                <button
                    type='submit'
                    className='bg-primary px-10 py-3 mt-6 text-white rounded-full'
                >
                    Add Doctor
                </button>

            </div>
        </form>
    )
}

export default AddDoctor