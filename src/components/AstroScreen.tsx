import { useState } from 'react';
import { motion } from 'framer-motion';
import './AstroScreen.css';

const BG_IMAGE = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/backgrounds/space-bg.webp';
const ZODIAC_WHEEL = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/test/lucid-origin_a_cinematic_photo_of_Ultra_ornate_golden_zodiac_wheel_12_astrological_symbols_ar-0%20(1)-Photoroom.png';
const MOON_IMAGE = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/planets/moon.webp';

type ZodiacSign = {
  name: string;
  symbol: string;
  image?: string;
};

const ZODIAC_SIGNS: Record<string, ZodiacSign> = {
  aries: { 
    name: 'Aries', 
    symbol: '',
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
  capricorn: { name: 'Capricorn', symbol: '' },
  aquarius: { name: 'Aquarius', symbol: '♒' },
  pisces: { name: 'Pisces', symbol: '♓' }
};

export default function AstroScreen() {
  const [userSign] = useState<string>('aries');
  const currentSign = ZODIAC_SIGNS[userSign];

  return (
    <div className="astro-screen">
      <div 
        className="cosmic-background"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />

      <div className="astro-content">
        
        {/* 🎯 ZODIAC WHEEL */}
        <div className="zodiac-centered-wrapper">
          <div className="zodiac-wrapper">
            <div className="user-sign-layer">
              <div className="user-sign-circle">
                {currentSign?.image ? (
                  <img src={currentSign.image} alt={currentSign.name} className="user-sign-image" />
                ) : (
                  <span className="user-sign-symbol">{currentSign?.symbol}</span>
                )}
              </div>
            </div>

            <motion.div 
              className="zodiac-wheel-layer"
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            >
              <img src={ZODIAC_WHEEL} alt="Zodiac Wheel" className="zodiac-image" />
            </motion.div>

            <div className="zodiac-glow" />
          </div>
        </div>

        {/* 🌙 LUNAR PHASE */}
        <div className="lunar-centered-wrapper">
          <svg className="lunar-svg" viewBox="0 0 300 300">
            <defs>
              {/* ზედა რკალი - რგოლის შუაში */}
              <path
                id="topTextPath"
                d="M 65,150 A 85,85 0 0,1 235,150"
                fill="none"
              />
              {/* ქვედა რკალი */}
              <path
                id="bottomTextPath"
                d="M 235,150 A 85,85 0 0,1 65,150"
                fill="none"
              />
              {/* მთვარის clip - ზუსტად რგოლის შიდა კიდე */}
              <clipPath id="moonClip">
                <circle cx="150" cy="150" r="75" />
              </clipPath>
            </defs>

            {/* ცისფერი რგოლი: r=85, stroke=20 → შიდა კიდე r=75 */}
            <circle
              cx="150"
              cy="150"
              r="85"
              fill="none"
              stroke="rgba(20, 15, 50, 0.85)"
              strokeWidth="20"
              className="lunar-ring"
            />

            {/* ზედა წარწერა */}
            <text className="lunar-text-top">
              <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
                LUNAR PHASE & WAXING GIBBOUS
              </textPath>
            </text>

            {/* ქვედა წარწერა */}
            <text className="lunar-text-bottom">
              <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
                High energy • Take action
              </textPath>
            </text>

            {/* მთვარის ფოტო - ავსებს სრულად შუა სივრცეს (r=75) */}
            <image
              href={MOON_IMAGE}
              x="75"
              y="75"
              width="150"
              height="150"
              clipPath="url(#moonClip)"
              className="lunar-moon-svg"
            />
          </svg>
        </div>

        <div className="empty-space" />
      </div>
    </div>
  );
}