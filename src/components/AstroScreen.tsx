import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useCosmicData } from '../hooks/useCosmicData';
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
  aries: { name: 'Aries', symbol: '', image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/test/Aries.png' },
  taurus: { name: 'Taurus', symbol: '♉' },
  gemini: { name: 'Gemini', symbol: '♊' },
  cancer: { name: 'Cancer', symbol: '♋' },
  leo: { name: 'Leo', symbol: '' },
  virgo: { name: 'Virgo', symbol: '♍' },
  libra: { name: 'Libra', symbol: '♎' },
  scorpio: { name: 'Scorpio', symbol: '♏' },
  sagittarius: { name: 'Sagittarius', symbol: '♐' },
  capricorn: { name: 'Capricorn', symbol: '♑' },
  aquarius: { name: 'Aquarius', symbol: '' },
  pisces: { name: 'Pisces', symbol: '♓' }
};

// Props interface
interface Props {
  onNavigate?: (screen: string) => void;
}

// მთვარის ფაზის ფერები
function getPhaseColor(phase: string): string {
  const colors: Record<string, string> = {
    'New Moon': 'rgba(20, 20, 40, 0.9)',
    'Waxing Crescent': 'rgba(40, 40, 80, 0.9)',
    'First Quarter': 'rgba(60, 60, 120, 0.9)',
    'Waxing Gibbous': 'rgba(80, 80, 160, 0.9)',
    'Full Moon': 'rgba(200, 200, 255, 0.9)',
    'Waning Gibbous': 'rgba(160, 160, 200, 0.9)',
    'Last Quarter': 'rgba(120, 120, 160, 0.9)',
    'Waning Crescent': 'rgba(80, 80, 120, 0.9)'
  };
  return colors[phase] || colors['Waxing Gibbous'];
}

// ✅ onNavigate prop-ი აქ არის destructured
export default function AstroScreen({ onNavigate }: Props) {
  const { data: cosmicData, loading } = useCosmicData();
  
  const [userSign] = useState<string>('aries');
  const currentSign = ZODIAC_SIGNS[userSign];

  // მონაცემები fallback-ებით
  const moonPhase = cosmicData?.cosmic?.moon_phase || 'Waxing Gibbous';
  const moonIllumination = cosmicData?.cosmic?.moon_illumination || 98;
  const moonSign = cosmicData?.cosmic?.moon_sign || 'Capricorn';
  const sunSign = cosmicData?.cosmic?.sun_sign || 'Cancer';
  const energyLevel = cosmicData?.cosmic?.energy_level || 98;
  const keyAdvice = cosmicData?.cosmic?.key_advice || 'Trust the cosmic flow today.';
  const planets = cosmicData?.planets || [];
  const aspects = cosmicData?.aspects || [];

  // დინამიური ტექსტი
  const topText = `LUNAR PHASE & ${moonPhase.toUpperCase()}`;
  const bottomText = keyAdvice;

  // მონაცემები ჩაიტვირთა?
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!loading && cosmicData) {
      setDataLoaded(true);
      console.log('🌙 Cosmic Data Loaded:', {
        moonPhase,
        moonIllumination,
        moonSign,
        sunSign,
        energyLevel,
        planetsCount: planets.length,
        aspectsCount: aspects.length
      });
    }
  }, [loading, cosmicData]);

  const [needsMarqueeTop, setNeedsMarqueeTop] = useState(false);
  const [needsMarqueeBottom, setNeedsMarqueeBottom] = useState(false);

  const topTextRef = useRef<SVGTextElement>(null);
  const bottomTextRef = useRef<SVGTextElement>(null);
  const topPathRef = useRef<SVGPathElement>(null);
  const bottomPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const measureText = () => {
      if (topTextRef.current && topPathRef.current) {
        const textLength = topTextRef.current.getComputedTextLength();
        const pathLength = topPathRef.current.getTotalLength();
        setNeedsMarqueeTop(textLength > pathLength * 0.85);
      }
      if (bottomTextRef.current && bottomPathRef.current) {
        const textLength = bottomTextRef.current.getComputedTextLength();
        const pathLength = bottomPathRef.current.getTotalLength();
        setNeedsMarqueeBottom(textLength > pathLength * 0.85);
      }
    };

    const timer = setTimeout(measureText, 100);
    return () => clearTimeout(timer);
  }, [topText, bottomText]);

  return (
    <div className="astro-screen">
      {/* ფონი */}
      <div className="cosmic-background" style={{ backgroundImage: `url(${BG_IMAGE})` }} />

      {/* ✅ Back button header - onNavigate გამოიყენება აქ */}
      {onNavigate && (
        <div className="astro-header">
          <button className="astro-back-btn" onClick={() => onNavigate('home')}>
            <ArrowLeft size={20} />
          </button>
        </div>
      )}

      <div className="astro-content">
        
        {/* 🌟 ZODIAC WHEEL */}
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
        <div className="lunar-right-wrapper">
          <svg className="lunar-svg" viewBox="0 0 300 300">
            <defs>
              <path 
                ref={topPathRef}
                id="topTextPath" 
                d="M 65,150 A 85,85 0 0,1 235,150" 
                fill="none" 
              />
              <path 
                ref={bottomPathRef}
                id="bottomTextPath" 
                d="M 235,150 A 85,85 0 0,1 65,150" 
                fill="none" 
              />
              <clipPath id="moonClip">
                <circle cx="150" cy="150" r="75" />
              </clipPath>
            </defs>

            {/* 1. მთვარე */}
            <image
              href={MOON_IMAGE}
              x="25"
              y="25"
              width="250"
              height="250"
              clipPath="url(#moonClip)"
              className="lunar-moon-svg"
            />

            {/* 2. რგოლი */}
            <circle 
              cx="150" cy="150" r="85" 
              fill="none" 
              stroke={getPhaseColor(moonPhase)} 
              strokeWidth="20" 
              className="lunar-ring" 
            />

            {/* 3. ზედა ტექსტი */}
            <text 
              ref={topTextRef}
              className={`lunar-text-top ${needsMarqueeTop ? 'marquee-text' : 'static-text'}`}
            >
              <AnimatePresence mode="wait">
                {needsMarqueeTop ? (
                  <motion.textPath 
                    key={`top-marquee-${moonPhase}`}
                    href="#topTextPath"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {topText} • {topText} • {topText} •
                    <animate 
                      attributeName="startOffset" 
                      from="0%" 
                      to="-33.33%" 
                      dur="20s" 
                      repeatCount="indefinite" 
                    />
                  </motion.textPath>
                ) : (
                  <motion.textPath 
                    key={`top-static-${moonPhase}`}
                    href="#topTextPath" 
                    startOffset="50%" 
                    textAnchor="middle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {topText}
                  </motion.textPath>
                )}
              </AnimatePresence>
            </text>

            {/* 4. ქვედა ტექსტი */}
            <text 
              ref={bottomTextRef}
              className={`lunar-text-bottom ${needsMarqueeBottom ? 'marquee-text' : 'static-text'}`}
            >
              <AnimatePresence mode="wait">
                {needsMarqueeBottom ? (
                  <motion.textPath 
                    key={`bottom-marquee-${keyAdvice}`}
                    href="#bottomTextPath"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {bottomText} • {bottomText} • {bottomText} •
                    <animate 
                      attributeName="startOffset" 
                      from="0%" 
                      to="-33.33%" 
                      dur="20s" 
                      repeatCount="indefinite" 
                    />
                  </motion.textPath>
                ) : (
                  <motion.textPath 
                    key={`bottom-static-${keyAdvice}`}
                    href="#bottomTextPath" 
                    startOffset="50%" 
                    textAnchor="middle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {bottomText}
                  </motion.textPath>
                )}
              </AnimatePresence>
            </text>
          </svg>
        </div>

        <div className="empty-space" />
      </div>

      {/* Corner loading indicator */}
      {!dataLoaded && loading && (
        <div className="corner-loading">
          <div className="corner-spinner" />
        </div>
      )}
    </div>
  );
}