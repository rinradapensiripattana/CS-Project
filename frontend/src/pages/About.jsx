import React from 'react'
import { assets } from '../assets/assets'


const About = () => {
  return (
    <div>

      <div className='text-center text-2xl pt-10 text-[#707070]'>
        <p>ABOUT <span className='text-gray-700 font-semibold'>US</span></p>
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[470px]' src={assets.about_image} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
          <p>HelloDr. was founded with the belief that visiting a doctor should not be stressful, but a warm, safe, and caring experience. We believe that good medical care is not only about medicine and technology—it begins with listening and truly understanding each patient.</p>
          <p>Our doctors and medical staff are dedicated to providing attentive and personalized care from the moment you walk into our clinic. We take time to listen, explain medical information clearly, and treat every patient with kindness, respect, and empathy—whether it is a minor concern or a complex health condition.</p>

          <p>HelloDr. เกิดขึ้นจากความตั้งใจที่อยากให้การพบแพทย์ไม่ใช่เรื่องน่ากังวล แต่เป็นประสบการณ์ที่อบอุ่น ปลอดภัย และเต็มไปด้วยความใส่ใจ เราเชื่อว่าการรักษาที่ดี ไม่ได้มีแค่ยาและเทคโนโลยี แต่ต้องเริ่มจาก “การรับฟัง” และ “ความเข้าใจในตัวผู้ป่วย”</p>
          <p>ทีมแพทย์และบุคลากรของ HelloDr. พร้อมดูแลคุณอย่างใกล้ชิด ตั้งแต่ก้าวแรกที่เข้ามาในคลินิก เราให้ความสำคัญกับการอธิบายข้อมูลอย่างชัดเจน ดูแลด้วยความอ่อนโยน และเคารพความรู้สึกของผู้รับบริการทุกคน ไม่ว่าจะเป็นอาการเล็กน้อยหรือปัญหาสุขภาพที่ซับซ้อน</p>
        </div>
      </div>

     

    </div>
  )
}

export default About
