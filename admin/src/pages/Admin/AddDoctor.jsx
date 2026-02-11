import React, { useContext, useState } from 'react'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AddDoctor = () => {

    const [docImg, setDocImg] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [degree, setDegree] = useState('') //Education
    const [experience, setExperience] = useState('1 Year')
    const [about, setAbout] = useState('')

    const { backendUrl } = useContext(AppContext)
    const { aToken } = useContext(AdminContext)
 
    const onSubmitHandler = async (event) => {
        event.preventDefault()


        try {

            if (!docImg) {
                return toast.error('Image Not Selected')
            }

            const formData = new FormData();

            formData.append('image', docImg)
            formData.append('name', name)
            formData.append('email', email)
            formData.append('password', password)
            formData.append('degree', degree)
            formData.append('experience', experience)
            formData.append('about', about)

            // console log formdata            
            formData.forEach((value, key) => {
                console.log(`${key}: ${value}`);
            })

            //const { data } = await axios.post(backendUrl + '/api/admin/add-doctor', formData, { headers: { aToken } })
            const { data } = await axios.post('http://localhost:4000/api/admin/add-doctor', formData, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                setDocImg(false)
                setName('')
                setPassword('')
                setEmail('')
                setDegree('')
                setAbout('')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    
    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>

            <p className='mb-3 text-lg font-medium'>Add Doctor</p>

            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>
                <div className='flex items-center gap-4 mb-4 text-gray-500'>
                    <label htmlFor="doc-img">
                        <img className='w-16 bg-gray-100 rounded-full cursor-pointer' src={docImg ? URL.createObjectURL(docImg) : assets.upload_area} alt="" />
                    </label>
                    <input onChange={(e) => setDocImg(e.target.files[0])} type="file" id="doc-img" hidden />
                    <p>Upload doctor <br /> picture</p>
                </div>

                <div className='flex-1 flex flex-col gap-1'>
                    <p>Doctor name</p>
                    <input onChange={e => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type="text" placeholder='Name' required />
                </div>

                {/* left + right section */}
                <div className='mt-4 flex flex-col lg:flex-row items-start gap-10 text-gray-600'>

                    {/* left section */}
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>
                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Doctor Email</p>
                            <input onChange={e => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2' type="email" placeholder='Email' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Education</p>
                            <input onChange={e => setDegree(e.target.value)} value={degree} className='border rounded px-3 py-2' type="text" placeholder='Education' required />
                        </div>
                    </div>

                    {/* right section */}
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>
                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Doctor Password</p>
                            <input onChange={e => setPassword(e.target.value)} value={password} className='border rounded px-3 py-2' type="password" placeholder='Password' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Experience</p>
                            <select onChange={e => setExperience(e.target.value)} value={experience} className='border rounded px-3 py-2.5' name="" id="">
                                <option value="1 Year">1 Year</option>
                                <option value="2 Year">2 Year</option>
                                <option value="3 Year">3 Year</option>
                                <option value="4 Year">4 Year</option>
                                <option value="5 Year">5 Year</option>
                                <option value="6 Year">6 Year</option>
                                <option value="7 Year">7 Year</option>
                                <option value="8 Year">8 Year</option>
                                <option value="9 Year">9 Year</option>
                                <option value="10 Year">10 Year</option>
                                <option value="11 Year">11 Year</option>
                                <option value="12 Year">12 Year</option>
                                <option value="13 Year">13 Year</option>
                                <option value="14 Year">14 Year</option>
                                <option value="15 Year">15 Year</option>
                                <option value="16 Year">16 Year</option>
                                <option value="17 Year">17 Year</option>
                                <option value="18 Year">18 Year</option>
                                <option value="19 Year">19 Year</option>
                                <option value="20 Year">20 Year</option>
                                <option value="21 Year">21 Year</option>
                                <option value="22 Year">22 Year</option>
                                <option value="23 Year">23 Year</option>
                                <option value="24 Year">24 Year</option>
                                <option value="25 Year">25 Year</option>
                                <option value="26 Year">26 Year</option>
                                <option value="27 Year">27 Year</option>
                                <option value="28 Year">28 Year</option>
                                <option value="29 Year">29 Year</option>
                                <option value="30 Year">30 Year</option>
                            </select>
                        </div>
                    </div>

                </div>


                <div>
                    <p className='mt-4 mb-2'>About Doctor</p>
                    <textarea onChange={e => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' type="text" placeholder='write about doctor...' rows={5} required />
                </div>

                <button type='submit' className='bg-primary px-10 py-3 mt-4 text-white rounded-full'>Add Doctor</button>

            </div>

        </form>
    )
}

export default AddDoctor
