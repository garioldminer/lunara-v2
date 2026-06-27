import { useState } from 'react';
import { motion } from 'framer-motion';
import './AstroScreen.css';

const BG_IMAGE = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/backgrounds/space-bg.webp';
const ZODIAC_WHEEL = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/test/lucid-origin_a_cinematic_photo_of_Ultra_ornate_golden_zodiac_wheel_12_astrological_symbols_ar-0%20(1)-Photoroom.png';

// Type definition - ყველა ნიშანს შეიძლება ჰქონდეს image
type ZodiacSign = {
  name: string;
  symbol: string;
  image?: string;
};

// ზოდიაქოს ნიშნები - Aries-ს აქვს სურათი!
const ZODIAC_SIGNS: Record<string, ZodiacSign> = {
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
  const [userSign] = useState<string>('aries');

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
        
        {/* 🎯 ZODIAC WHEEL - მხოლოდ ბორბალი და ნიშანი */}
        <section className="zodiac-section">
          <motion.div 
            className="zodiac-wrapper"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* LAYER 1: ნიშანი (ქვედა ფენა) */}
            <motion.div 
              className="user-sign-layer"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
            >
              <div className="user-sign-circle">
                {/* თუ სურათი არსებობს - ვაჩვენოთ სურათი, თუ არა - სიმბოლო */}
                {currentSign?.image ? (
                  <img 
                    src={currentSign.image} 
                    alt={currentSign.name}
                    className="user-sign-image"
                  />
                ) : (
                  <span className="user-sign-symbol">{currentSign?.symbol}</span>
                )}
              </div>
            </motion.div>

            {/* LAYER 2: ბორბალი (ზედა ფენა) */}
            <motion.div 
              className="zodiac-wheel-layer"
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            >
              <img src={ZODIAC_WHEEL} alt="Zodiac Wheel" className="zodiac-image" />
            </motion.div>

            {/* Glow ეფექტი */}
            <div className="zodiac-glow" />
          </motion.div>
        </section>

        {/* ცარიელი სივრცე */}
        <div className="empty-space" />
      </div>
    </div>
  );
}