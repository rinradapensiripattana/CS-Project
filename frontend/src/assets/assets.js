import logo from './logo.svg'
import profile_pic from './profile_pic.jpg'
import dropdown_icon from './dropdown_icon.svg'
import arrow_icon from './arrow_icon.svg'
import header_image from './header_image.png'
import general_checkup from './general_checkup.png'
import fever from './fever.png'
import medicine from './medicine.png'
import health_check from './health_check.png'
import service5 from './service5.png'
import doctor1 from './Doctor1.png'
import doctor2 from './Doctor2.png'
import doctor3 from './Doctor3.png'
import info_icon from './info_icon.svg'
import about_image from './about_image.png'
import contact_image from './contact_image.png'
import menu_icon from './menu_icon.svg'
import cross_icon from './cross_icon.png'

export const assets = {
  logo,
  profile_pic,
  dropdown_icon,
  arrow_icon,
  header_image,
  general_checkup,
  fever,
  medicine,
  health_check,
  service5,
  doctor1,
  doctor2,
  doctor3,
  info_icon,
  about_image,
  contact_image,
  menu_icon,
  cross_icon
}

export const ourservices = [
  {
    title : 'ตรวจรักษาโรคทั่วไป',
    image: general_checkup
  },
  {
    title : 'ไข้ ไอ เจ็บคอ ปวดศีรษะ',
    image: fever
  },
  {
    title : 'จ่ายยาและติดตามอาการ',
    image: medicine
  },
  {
    title : 'ตรวจสุขภาพเบื้องต้น',
    image: health_check
  },
  {
    title : 'เด็ก / ผู้ใหญ่ / ผู้สูงอายุ',
    image: service5
  },
]

export const doctors = [
  {
    _id : 'doc1',
    name : 'พญ. ชนากานต์ เลิศศิริวัฒน์',
    image: doctor1,
    degree : 'แพทยศาสตรบัณฑิต, จุฬาลงกรณ์มหาวิทยาลัย',
    experience : '5 Years',
    about : 'ให้บริการตรวจรักษาโรคทั่วไป เน้นการพูดคุยซักถามอาการอย่างละเอียด เป็นกันเอง เพื่อให้คนไข้เข้าใจโรคและการดูแลตัวเองอย่างถูกต้อง สะดวก รวดเร็ว ไม่ต้องรอนาน'
  },
  {
    _id : 'doc2',
    name : 'พญ. วริศรา อัศวเหมันต์',
    image: doctor2,
    degree : 'แพทยศาสตรบัณฑิต, จุฬาลงกรณ์มหาวิทยาลัย',
    experience : '25 Years',
    about : '-' 
  },
  {
    _id : 'doc3',
    name : 'นพ. ณัฐพงศ์ สุขเจริญ',
    image: doctor3,
    degree : 'แพทยศาสตรบัณฑิต, จุฬาลงกรณ์มหาวิทยาลัย',
    experience : '27 Years',
    about : '-' 
  },
]