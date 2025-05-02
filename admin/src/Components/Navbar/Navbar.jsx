import React from 'react'
import './Navbar.css'
import navlogo from '../../assets/logo.png'
import navProfile from '../../assets/nav-profile.svg'

const Navbar = () =>{
  return(
    <div className='navbar'>
       <img src={navlogo} alt="" className="nav-logo" />
       <p>Admin Panel</p>
       <img src={navProfile} alt="" className="nav-profile"/>
    </div>
   )
  }
  export default Navbar