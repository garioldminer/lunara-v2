import { useState } from 'react';
import { motion } from 'framer-motion';
import './AstroScreen.css';

const BG_IMAGE = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/backgrounds/space-bg.webp';
const ZODIAC_WHEEL = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/test/lucid-origin_a_cinematic_photo_of_Ultra_ornate_golden_zodiac_wheel_12_astrological_symbols_ar-0%20(1)-Photoroom.png';

// ზოდიაქოს ნიშნები
const ZODIAC_SIGNS = {
  aries: { name: 'Aries', symbol: '♈' },
  taurus: { name: 'Taurus', symbol: '♉' },
  gemini: { name: 'Gemini', symbol: '♊' },
  cancer: { name: 'Cancer', symbol: '♋' },
  leo: { name: 'Leo', symbol: '♌' },
  virgo: { name: 'Virgo', symbol: '♍' },
  libra: { name: 'Libra', symbol: '♎' },
  scorpio: { name: 'Scorpio', symbol: '♏' },
  sagittarius: { name: 'Sagittarius', symbol: '♐' },
  capricorn: { name: 'Capricorn', symbol: '' },
  aquarius: { name: 'Aquarius', symbol: '♒' },
  pisces: { name: 'Pisces', symbol: '♓' }
};

export default function AstroScreen() {
  const [energy] = useState(78);
  const [userSign] = useState<keyof typeof ZODIAC_SIGNS>('leo');

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
        
        {/* 🎯 ZODIAC WHEEL - SVG VERSION */}
        <section className="zodiac-section">
          <motion.div 
            className="zodiac-svg-wrapper"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <svg 
              viewBox="0 0 400 400" 
              className="zodiac-svg"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Glow filter */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Strong glow */}
                <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="12" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Center glow */}
                <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(217, 182, 111, 0.3)" />
                  <stop offset="70%" stopColor="rgba(217, 182, 111, 0.1)" />
                  <stop offset="100%" stopColor="rgba(217, 182, 111, 0)" />
                </radialGradient>

                {/* Sign glow */}
                <filter id="signGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ბორბლის სურათი */}
              <image 
                href={ZODIAC_WHEEL}
                x="0" 
                y="0" 
                width="400" 
                height="400"
                className="zodiac-wheel-image"
              />

              {/* ცენტრის glow ეფექტი */}
              <circle 
                cx="200" 
                cy="200" 
                r="60" 
                fill="url(#centerGlow)"
                className="center-glow-circle"
              />

              {/* ცენტრის წრე (დეკორატიული) */}
              <circle 
                cx="200" 
                cy="200" 
                r="50" 
                fill="none"
                stroke="rgba(217, 182, 111, 0.6)"
                strokeWidth="2"
                filter="url(#glow)"
                className="center-ring"
              />

              {/* მომხმარებლის ნიშანი - ზუსტად ცენტრში */}
              <foreignObject x="150" y="150" width="100" height="100">
                <div xmlns="http://www.w3.org/1999/xhtml" className="user-sign-container">
                  <div className="user-sign-content">
                    <span className="user-sign-symbol">{currentSign.symbol}</span>
                  </div>
                </div>
              </foreignObject>

              {/* გარე glow რგოლი */}
              <circle 
                cx="200" 
                cy="200" 
                r="195" 
                fill="none"
                stroke="rgba(217, 182, 111, 0.4)"
                strokeWidth="1"
                filter="url(#strongGlow)"
                className="outer-glow-ring"
              />
            </svg>
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