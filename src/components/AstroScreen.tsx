import { useState } from 'react';
import { motion } from 'framer-motion';
import './AstroScreen.css';

const BG_IMAGE = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/backgrounds/space-bg.webp';
const ZODIAC_WHEEL = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/test/lucid-origin_a_cinematic_photo_of_Ultra_ornate_golden_zodiac_wheel_12_astrological_symbols_ar-0%20(1)-Photoroom.png';

// ზოდიაქოს ნიშნები - Aries-ს აქვს სურათი!
const ZODIAC_SIGNS = {
  aries: { 
    name: 'Aries', 
    symbol: '♈',
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/test/Aries.png'
  },
  taurus: { name: 'Taurus', symbol: '♉' },
  gemini: { name: 'Gemini', symbol: '♊' },
  cancer: { name: 'Cancer', symbol: '♋' },
  leo: { name: 'Leo', symbol: '♌' },
  virgo: { name: 'Virgo', symbol: '♍' },
  libra: { name: 'Libra', symbol: '♎' },
  scorpio: { name: 'Scorpio', symbol: '♏' },
  sagittarius: { name: 'Sagittarius', symbol: '♐' },
  capricorn: { name: 'Capricorn', symbol: '♑' },
  aquarius: { name: 'Aquarius', symbol: '♒' },
  pisces: { name: 'Pisces', symbol: '♓' }
};

export default function AstroScreen() {
  const [energy] = useState(78);
  const [userSign] = useState<keyof typeof ZODIAC_SIGNS>('aries');

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
            {/* LAYER 1: ბორბალი (ქვედა ფენა) */}
            <motion.div 
              className="zodiac-wheel-layer"
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            >
              <img src={ZODIAC_WHEEL} alt="Zodiac Wheel" className="zodiac-image" />
            </motion.div>

            {/* LAYER 2: ნიშნის წრე (ზედა ფენა) - ზუსტად ცენტრში */}
            <motion.div 
              className="user-sign-layer"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
            >
              <div className="user-sign-circle">
                {/* თუ სურათი არსებობს - ვაჩვენოთ სურათი, თუ არა - სიმბოლო */}
                {currentSign.image ? (
                  <img 
                    src={currentSign.image} 
                    alt={currentSign.name}
                    className="user-sign-image"
                  />
                ) : (
                  <span className="user-sign-symbol">{currentSign.symbol}</span>
                )}
              </div>
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