import React from "react";
import "./Hero.css";
import arrow_icon from "../Assets/arrow.png";
import hero_image from "../Assets/hero_image.png";
import { Link } from "react-router-dom"; 

const Hero = () => {
  return (
    <div className="hero">
      <div className="hero-left">
        <div className="hand-hand-icon">
          <p>New Collections</p>
        </div>
        <div className="hero-latest-btn">
          <Link to="/NewCollection"> 
            Latest Collection
          </Link>
          <img src={arrow_icon} alt="arrow" />
        </div>
      </div>
      <div className="hero_right">
          <img src={hero_image} alt="hero_image" className="hero-img" />
      </div>
    </div>
  );
};

export default Hero;
