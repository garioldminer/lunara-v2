import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Zap } from 'lucide-react';
import { useCosmicData } from '../hooks/useCosmicData';
import { supabase } from '../lib/supabase';
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
  aries: { name: 'Aries', symbol: '♈', image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/test/Aries.png' },
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

const PLANET_CONFIG: Record<string, { symbol: string; color: string; orbitRadius: number }> = {
  'Sun': { symbol: '☀️', color: '#FFD700', orbitRadius: 0 },
  'Moon': { symbol: '🌙', color: '#C0C0C0', orbitRadius: 55 },
  'Mercury': { symbol: '☿', color: '#A0A0A0', orbitRadius: 80 },
  'Venus': { symbol: '♀', color: '#E6B800', orbitRadius: 105 },
  'Mars': { symbol: '♂', color: '#FF4500', orbitRadius: 130 },
  'Jupiter': { symbol: '', color: '#DAA520', orbitRadius: 160 },
  'Saturn': { symbol: '♄', color: '#F4A460', orbitRadius: 190 },
  'Uranus': { symbol: '♅', color: '#40E0D0', orbitRadius: 220 },
  'Neptune': { symbol: '♆', color: '#4169E1', orbitRadius: 250 }
};

const ZODIAC_SYMBOLS: Record<string, string> = {
  'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋',
  'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
  'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '', 'Pisces': '♓'
};

export interface AstroScreenProps {
  onNavigate?: (screen: string) => void;
}

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

// ===== PLANET ORBIT WHEEL COMPONENT =====
function PlanetOrbitWheel() {
  const [planets, setPlanets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanets = async () => {
      // ✅ FIX: null check supabase-ისთვის
      if (!supabase) {
        console.error('Supabase client is not initialized');
        setLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('planet_positions')
          .select('*')
          .eq('date', today);
        
        if (error) {
          console.error('Error fetching planets:', error);
        } else if (data) {
          setPlanets(data);
        }
      } catch (error) {
        console.error('Error fetching planets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanets();
  }, []);

  const getPlanetPosition = (planet: any) => {
    const config = PLANET_CONFIG[planet.planet_name];
    if (!config) return { x: 250, y: 250 };

    const signIndex = Object.keys(ZODIAC_SYMBOLS).indexOf(planet.sign);
    const signAngle = (signIndex * 30) + planet.degree;
    const angle = (signAngle * Math.PI) / 180;
    const x = 250 + config.orbitRadius * Math.cos(angle);
    const y = 250 + config.orbitRadius * Math.sin(angle);

    return { x, y };
  };

  if (loading) {
    return (
      <div className="planet-orbit-loading">
        <div className="planet-orbit-spinner" />
        <p>Loading planets...</p>
      </div>
    );
  }

  return (
    <div className="planet-orbit-container">
      <svg className="planet-orbit-svg" viewBox="0 0 500 500">
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="50%" stopColor="#FFA500" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF8C00" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ორბიტები */}
        {Object.entries(PLANET_CONFIG)
          .filter(([name]) => name !== 'Sun')
          .map(([name, config]) => (
            <circle
              key={`orbit-${name}`}
              cx="250"
              cy="250"
              r={config.orbitRadius}
              fill="none"
              stroke="rgba(217, 182, 111, 0.15)"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="orbit-circle"
            />
          ))}

        {/* მზე ცენტრში */}
        <circle cx="250" cy="250" r="30" fill="url(#sunGlow)" className="sun-center" />
        <text x="250" y="258" textAnchor="middle" className="sun-symbol">☀️</text>

        {/* პლანეტები */}
        {planets.map((planet, index) => {
          const config = PLANET_CONFIG[planet.planet_name];
          if (!config) return null;

          const pos = getPlanetPosition(planet);
          const isHovered = hoveredPlanet === planet.planet_name;

          return (
            <g key={planet.planet_name}>
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 12 : 8}
                fill={config.color}
                className="planet-dot"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                onMouseEnter={() => setHoveredPlanet(planet.planet_name)}
                onMouseLeave={() => setHoveredPlanet(null)}
              />

              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                className="planet-symbol-text"
                style={{ fontSize: isHovered ? '16px' : '12px' }}
              >
                {config.symbol}
              </text>

              <text
                x={pos.x}
                y={pos.y - 15}
                textAnchor="middle"
                className="zodiac-sign-text"
              >
                {ZODIAC_SYMBOLS[planet.sign] || ''}
              </text>

              {isHovered && (
                <g className="planet-hover-info">
                  <rect
                    x={pos.x - 60}
                    y={pos.y - 45}
                    width="120"
                    height="35"
                    rx="6"
                    fill="rgba(10, 6, 0, 0.95)"
                    stroke="rgba(217, 182, 111, 0.5)"
                    strokeWidth="1"
                  />
                  <text x={pos.x} y={pos.y - 28} textAnchor="middle" className="hover-planet-name">
                    {planet.planet_name}
                  </text>
                  <text x={pos.x} y={pos.y - 16} textAnchor="middle" className="hover-planet-sign">
                    {planet.sign} {planet.degree.toFixed(1)}°
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="planet-legend">
        {planets.slice(0, 6).map((planet) => {
          const config = PLANET_CONFIG[planet.planet_name];
          return (
            <div key={planet.planet_name} className="legend-item">
              <span className="legend-symbol" style={{ color: config?.color }}>
                {config?.symbol}
              </span>
              <span className="legend-name">{planet.planet_name}</span>
              <span className="legend-sign">
                {ZODIAC_SYMBOLS[planet.sign]} {planet.degree.toFixed(0)}°
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== MAIN ASTRO SCREEN =====
export default function AstroScreen({ onNavigate }: AstroScreenProps) {
  const { data: cosmicData, loading } = useCosmicData();
  
  const [userSign] = useState<string>('aries');
  const currentSign = ZODIAC_SIGNS[userSign];

  const moonPhase = cosmicData?.cosmic?.moon_phase || 'Waxing Gibbous';
  const moonSign = cosmicData?.cosmic?.moon_sign || 'Capricorn';
  const moonIllumination = cosmicData?.cosmic?.moon_illumination || 98;
  const sunSign = cosmicData?.cosmic?.sun_sign || 'Cancer';
  const energyLevel = cosmicData?.cosmic?.energy_level || 98;
  const dominantElement = cosmicData?.cosmic?.dominant_element || 'Earth';
  const keyAdvice = cosmicData?.cosmic?.key_advice || 'Trust the cosmic flow today.';

  const topText = `LUNAR PHASE & ${moonPhase.toUpperCase()}`;
  const bottomText = keyAdvice;

  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!loading && cosmicData) {
      setDataLoaded(true);
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

  const getElementIcon = (element: string) => {
    const icons: Record<string, string> = {
      'Fire': '🔥',
      'Earth': '🌍',
      'Air': '',
      'Water': '💧'
    };
    return icons[element] || '✨';
  };

  return (
    <div className="astro-screen">
      <div className="cosmic-background" style={{ backgroundImage: `url(${BG_IMAGE})` }} />

      {onNavigate && (
        <div className="astro-header">
          <button className="astro-back-btn" onClick={() => onNavigate('home')}>
            <ArrowLeft size={20} />
          </button>
        </div>
      )}

      <div className="astro-content">
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

        <div className="lunar-right-wrapper">
          <svg className="lunar-svg" viewBox="0 0 300 300">
            <defs>
              <path ref={topPathRef} id="topTextPath" d="M 65,150 A 85,85 0 0,1 235,150" fill="none" />
              <path ref={bottomPathRef} id="bottomTextPath" d="M 235,150 A 85,85 0 0,1 65,150" fill="none" />
              <clipPath id="moonClip">
                <circle cx="150" cy="150" r="75" />
              </clipPath>
            </defs>

            <image href={MOON_IMAGE} x="25" y="25" width="250" height="250" clipPath="url(#moonClip)" className="lunar-moon-svg" />

            <circle cx="150" cy="150" r="85" fill="none" stroke={getPhaseColor(moonPhase)} strokeWidth="20" className="lunar-ring" />

            <text ref={topTextRef} className={`lunar-text-top ${needsMarqueeTop ? 'marquee-text' : 'static-text'}`}>
              <AnimatePresence mode="wait">
                {needsMarqueeTop ? (
                  <motion.textPath key={`top-marquee-${moonPhase}`} href="#topTextPath" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                    {topText} • {topText} • {topText} •
                    <animate attributeName="startOffset" from="0%" to="-33.33%" dur="20s" repeatCount="indefinite" />
                  </motion.textPath>
                ) : (
                  <motion.textPath key={`top-static-${moonPhase}`} href="#topTextPath" startOffset="50%" textAnchor="middle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                    {topText}
                  </motion.textPath>
                )}
              </AnimatePresence>
            </text>

            <text ref={bottomTextRef} className={`lunar-text-bottom ${needsMarqueeBottom ? 'marquee-text' : 'static-text'}`}>
              <AnimatePresence mode="wait">
                {needsMarqueeBottom ? (
                  <motion.textPath key={`bottom-marquee-${keyAdvice}`} href="#bottomTextPath" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                    {bottomText} • {bottomText} • {bottomText} •
                    <animate attributeName="startOffset" from="0%" to="-33.33%" dur="20s" repeatCount="indefinite" />
                  </motion.textPath>
                ) : (
                  <motion.textPath key={`bottom-static-${keyAdvice}`} href="#bottomTextPath" startOffset="50%" textAnchor="middle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                    {bottomText}
                  </motion.textPath>
                )}
              </AnimatePresence>
            </text>
          </svg>
        </div>

        {/* PLANET ORBITS */}
        <motion.div 
          className="astro-section planets-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="section-title">
            <Sparkles size={16} />
            Planet Positions
          </h3>
          <PlanetOrbitWheel />
        </motion.div>

        {/* COSMIC ENERGY */}
        <motion.div 
          className="astro-section energy-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="section-title">
            <Zap size={16} />
            Today's Cosmic Energy
          </h3>
          <div className="energy-grid">
            <div className="energy-item">
              <span className="energy-icon">{getElementIcon(dominantElement)}</span>
              <div className="energy-info">
                <span className="energy-label">Dominant Element</span>
                <span className="energy-value">{dominantElement}</span>
              </div>
            </div>
            <div className="energy-item">
              <span className="energy-icon">⚡</span>
              <div className="energy-info">
                <span className="energy-label">Energy Level</span>
                <div className="energy-bar">
                  <div 
                    className="energy-fill"
                    style={{ width: `${energyLevel}%` }}
                  />
                </div>
                <span className="energy-value">{energyLevel}/100</span>
              </div>
            </div>
            <div className="energy-item">
              <span className="energy-icon">🌙</span>
              <div className="energy-info">
                <span className="energy-label">Moon</span>
                <span className="energy-value">{moonSign} ({moonIllumination}%)</span>
              </div>
            </div>
            <div className="energy-item">
              <span className="energy-icon">☀️</span>
              <div className="energy-info">
                <span className="energy-label">Sun</span>
                <span className="energy-value">{sunSign}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* GET HOROSCOPE BUTTON */}
        <motion.button
          className="get-horoscope-btn"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => onNavigate?.('horoscope')}
        >
          <span className="btn-icon">🔮</span>
          <span className="btn-text">Get My Personal Horoscope</span>
          <span className="btn-arrow">→</span>
        </motion.button>

        <div className="empty-space" />
      </div>

      {!dataLoaded && loading && (
        <div className="corner-loading">
          <div className="corner-spinner" />
        </div>
      )}
    </div>
  );
}