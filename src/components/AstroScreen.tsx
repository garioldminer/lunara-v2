import { useState } from 'react';
import { motion } from 'framer-motion';
import './AstroScreen.css';

const BG_IMAGE = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/backgrounds/space-bg.webp';
const ZODIAC_WHEEL = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/test/lucid-origin_a_cinematic_photo_of_Ultra_ornate_golden_zodiac_wheel_12_astrological_symbols_ar-0%20(1)-Photoroom.png';

// ზოდიაქოს ნიშნები - აქ ჩასვი შენი URL-ები!
const ZODIAC_SIGNS = {
  aries: { 
    name: 'Aries', 
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/zodiac/signs/aries.png'
  },
  taurus: { 
    name: 'Taurus', 
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/zodiac/signs/taurus.png'
  },
  gemini: { 
    name: 'Gemini', 
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/zodiac/signs/gemini.png'
  },
  cancer: { 
    name: 'Cancer', 
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/zodiac/signs/cancer.png'
  },
  leo: { 
    name: 'Leo', 
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/zodiac/signs/leo.png'
  },
  virgo: { 
    name: 'Virgo', 
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/zodiac/signs/virgo.png'
  },
  libra: { 
    name: 'Libra', 
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/zodiac/signs/libra.png'
  },
  scorpio: { 
    name: 'Scorpio', 
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/zodiac/signs/scorpio.png'
  },
  sagittarius: { 
    name: 'Sagittarius', 
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/zodiac/signs/sagittarius.png'
  },
  capricorn: { 
    name: 'Capricorn', 
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/zodiac/signs/capricorn.png'
  },
  aquarius: { 
    name: 'Aquarius', 
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/zodiac/signs/aquarius.png'
  },
  pisces: { 
    name: 'Pisces', 
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/zodiac/signs/pisces.png'
  }
};

export default function AstroScreen() {
  const [energy] = useState(78);
  const [userSign] = useState<keyof typeof ZODIAC_SIGNS>('leo'); // ← მომხმარებლის ნიშანი

  const currentSign = ZODIAC_SIGNS[userSign];

  return (
    <div className="astro-screen">
      {/* 🌌 Background */}
      <div 
        className="cosmic-background"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />

      {/* 📱 Content */}
      <div className="astro-content">
        
        {/* 🎯 ZODIAC WHEEL */}
        <section className="zodiac-section">
          <motion.div 
            className="zodiac-wrapper"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* ბრუნვადი ბორბალი */}
            <motion.div 
              className="zodiac-rotating"
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            >
              <img src={ZODIAC_WHEEL} alt="Zodiac Wheel" className="zodiac-image" />
            </motion.div>
            
            {/* ცენტრში მომხმარებლის ნიშანი */}
            <motion.div 
              className="user-sign-center"
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            >
              <img 
                src={currentSign.image} 
                alt={currentSign.name} 
                className="user-sign-image"
              />
            </motion.div>
            
            {/* Glow ეფექტი */}
            <div className="zodiac-glow" />
          </motion.div>

          {/* სათაური */}
          <motion.div 
            className="zodiac-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h1>TODAY'S COSMIC ENERGY</h1>
            <p>The universe is aligning in your favor today.</p>
          </motion.div>

          {/* Energy Badge */}
          <motion.div 
            className="energy-badge"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: "spring" }}
          >
            <svg width="70" height="70" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F4D47C" />
                  <stop offset="100%" stopColor="#D9B66F" />
                </linearGradient>
              </defs>
              <circle 
                cx="50" cy="50" r="42" 
                fill="none" 
                stroke="rgba(217, 182, 111, 0.2)" 
                strokeWidth="5"
              />
              <circle 
                cx="50" cy="50" r="42"
                fill="none"
                stroke="url(#energyGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - energy / 100)}`}
                transform="rotate(-90 50 50)"
                style={{ filter: 'drop-shadow(0 0 8px rgba(217, 182, 111, 0.6))' }}
              />
            </svg>
            <span className="energy-value">{energy}%</span>
          </motion.div>
        </section>

        {/* ცარიელი სივრცე */}
        <div className="empty-space" />
      </div>
    </div>
  );
}