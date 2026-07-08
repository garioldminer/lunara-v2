import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Star, Info, Bug } from 'lucide-react';
import { useCosmicData } from '../hooks/useCosmicData';
import { useBirthChart } from '../hooks/useBirthChart';
import { supabase } from '../lib/supabase';
import './AstroScreen.css';

const BG_IMAGE = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/backgrounds/space-bg.webp';

const PLANET_IMAGES: Record<string, string> = {
  'Sun': 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/planets/sun.webp',
  'Moon': 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/planets/moon.webp',
  'Mercury': 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/planets/mercury.webp',
  'Venus': 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/planets/venus.webp',
  'Mars': 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/planets/mars.webp',
  'Jupiter': 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/planets/jupiter.webp',
  'Saturn': 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/planets/saturn-ring.webp',
  'Uranus': '',
  'Neptune': 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/planets/neptune.webp',
};

const ZODIAC_SYMBOLS: Record<string, string> = {
  'Aries': '♈', 'Taurus': '♉', 'Gemini': '', 'Cancer': '♋',
  'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
  'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓'
};

const PLANET_CONFIG: Record<string, { color: string; orbitRadius: number }> = {
  'Sun': { color: '#FFD700', orbitRadius: 0 },
  'Mercury': { color: '#A0A0A0', orbitRadius: 34 },
  'Venus': { color: '#E6B800', orbitRadius: 56 },
  'Moon': { color: '#C0C0C0', orbitRadius: 82 },
  'Mars': { color: '#FF4500', orbitRadius: 112 },
  'Jupiter': { color: '#DAA520', orbitRadius: 134 },
  'Saturn': { color: '#F4A460', orbitRadius: 156 },
  'Uranus': { color: '#40E0D0', orbitRadius: 171 },
  'Neptune': { color: '#4169E1', orbitRadius: 228 }
};

export interface AstroScreenProps {
  onNavigate?: (screen: string) => void;
}

// ===== PLANET ORBIT DIAGRAM WITH DEBUG =====
function PlanetOrbitDiagram({ planets }: { planets: any[] }) {
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(true); // ✅ დებაგერი ჩართულია
  
  const CENTER_X = 250;
  const CENTER_Y = 250;
  const PLANET_RADIUS = 12; // 24px diameter / 2

  const getPlanetPosition = (planet: any) => {
    const config = PLANET_CONFIG[planet.planet_name];
    if (!config) return { x: CENTER_X, y: CENTER_Y };

    const signIndex = Object.keys(ZODIAC_SYMBOLS).indexOf(planet.sign);
    const signAngle = (signIndex * 30) + planet.degree;
    const angle = (signAngle * Math.PI) / 180;
    const x = CENTER_X + config.orbitRadius * Math.cos(angle);
    const y = CENTER_Y + config.orbitRadius * Math.sin(angle);

    return { x, y };
  };

  // ✅ დებაგერი: ვპოულობ უკიდურეს პლანეტებს
  const getExtremePlanets = () => {
    if (planets.length === 0) return null;

    let topPlanet = { name: '', x: 0, y: 999 };
    let bottomPlanet = { name: '', x: 0, y: -1 };
    let leftPlanet = { name: '', x: 999, y: 0 };
    let rightPlanet = { name: '', x: -1, y: 0 };

    planets.forEach(planet => {
      const pos = getPlanetPosition(planet);
      
      if (pos.y < topPlanet.y) topPlanet = { name: planet.planet_name, ...pos };
      if (pos.y > bottomPlanet.y) bottomPlanet = { name: planet.planet_name, ...pos };
      if (pos.x < leftPlanet.x) leftPlanet = { name: planet.planet_name, ...pos };
      if (pos.x > rightPlanet.x) rightPlanet = { name: planet.planet_name, ...pos };
    });

    return { topPlanet, bottomPlanet, leftPlanet, rightPlanet };
  };

  const extremes = getExtremePlanets();

  return (
    <div className="orbit-diagram-container">
      {/* ✅ Debug toggle button */}
      <button 
        onClick={() => setDebugMode(!debugMode)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 100,
          background: debugMode ? '#ef4444' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Bug size={16} />
      </button>

      <svg 
        className="orbit-svg" 
        viewBox="0 0 500 500"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="40%" stopColor="#FFA500" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF8C00" stopOpacity="0" />
          </radialGradient>
          <filter id="planetShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
            <feOffset dx="1" dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sunGlowFilter">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Orbital rings */}
        {Object.entries(PLANET_CONFIG)
          .filter(([name]) => name !== 'Sun')
          .map(([name, config]) => (
            <circle
              key={`orbit-${name}`}
              cx={CENTER_X}
              cy={CENTER_Y}
              r={config.orbitRadius}
              fill="none"
              stroke="rgba(217, 182, 111, 0.15)"
              strokeWidth="0.8"
              strokeDasharray="3 3"
            />
          ))}

        {/* Sun center */}
        <circle cx={CENTER_X} cy={CENTER_Y} r="22" fill="url(#sunGlow)" className="sun-glow" filter="url(#sunGlowFilter)" />
        {PLANET_IMAGES['Sun'] && (
          <image
            href={PLANET_IMAGES['Sun']}
            x={CENTER_X - 18}
            y={CENTER_Y - 18}
            width="36"
            height="36"
            className="planet-img sun-img"
            preserveAspectRatio="xMidYMid slice"
            clipPath="circle(18px at center)"
          />
        )}

        {/* Planets */}
        {planets.map((planet, index) => {
          const config = PLANET_CONFIG[planet.planet_name];
          if (!config) return null;

          const pos = getPlanetPosition(planet);
          const isHovered = hoveredPlanet === planet.planet_name;
          const planetImage = PLANET_IMAGES[planet.planet_name];
          const size = isHovered ? 30 : 24;

          return (
            <g key={planet.planet_name}>
              {planetImage ? (
                <motion.g
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                  onMouseEnter={() => setHoveredPlanet(planet.planet_name)}
                  onMouseLeave={() => setHoveredPlanet(null)}
                  style={{ cursor: 'pointer' }}
                  filter="url(#planetShadow)"
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size / 2 + 2}
                    fill="none"
                    stroke={config.color}
                    strokeWidth="1"
                    opacity={isHovered ? 0.8 : 0.4}
                    className="planet-glow-ring"
                  />
                  <image
                    href={planetImage}
                    x={pos.x - size / 2}
                    y={pos.y - size / 2}
                    width={size}
                    height={size}
                    className="planet-img"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`circle(${size / 2}px at center)`}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + size / 2 + 10}
                    textAnchor="middle"
                    className="planet-name-text"
                    style={{ fontSize: isHovered ? '9px' : '8px' }}
                  >
                    {planet.planet_name}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + size / 2 + 18}
                    textAnchor="middle"
                    className="zodiac-name-text"
                    style={{ fontSize: '7px' }}
                  >
                    {planet.sign}
                  </text>
                </motion.g>
              ) : (
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovered ? 15 : 12}
                  fill={config.color}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.08 }}
                  onMouseEnter={() => setHoveredPlanet(planet.planet_name)}
                  onMouseLeave={() => setHoveredPlanet(null)}
                  style={{ cursor: 'pointer' }}
                  filter="url(#planetShadow)"
                />
              )}
            </g>
          );
        })}

        {/* ✅ DEBUG MODE - ვიზუალური გაზომვა */}
        {debugMode && extremes && (
          <g className="debug-overlay">
            {/* viewBox border */}
            <rect 
              x="0" y="0" 
              width="500" height="500" 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth="2"
              strokeDasharray="5 5"
            />

            {/* TOP - Moon to top edge */}
            <line 
              x1={extremes.topPlanet.x} 
              y1={extremes.topPlanet.y - PLANET_RADIUS}
              x2={extremes.topPlanet.x} 
              y2="0"
              stroke="#ef4444" 
              strokeWidth="2"
              markerEnd="url(#arrowRed)"
            />
            <circle cx={extremes.topPlanet.x} cy={extremes.topPlanet.y - PLANET_RADIUS} r="4" fill="#ef4444" />
            <text 
              x={extremes.topPlanet.x + 10} 
              y={(extremes.topPlanet.y - PLANET_RADIUS) / 2}
              fill="#ef4444"
              fontSize="14"
              fontWeight="bold"
            >
              {Math.round(extremes.topPlanet.y - PLANET_RADIUS)}px
            </text>
            <text 
              x={extremes.topPlanet.x + 10} 
              y={(extremes.topPlanet.y - PLANET_RADIUS) / 2 + 16}
              fill="#ef4444"
              fontSize="10"
            >
              ({extremes.topPlanet.name})
            </text>

            {/* BOTTOM - Uranus to bottom edge */}
            <line 
              x1={extremes.bottomPlanet.x} 
              y1={extremes.bottomPlanet.y + PLANET_RADIUS}
              x2={extremes.bottomPlanet.x} 
              y2="500"
              stroke="#ef4444" 
              strokeWidth="2"
            />
            <circle cx={extremes.bottomPlanet.x} cy={extremes.bottomPlanet.y + PLANET_RADIUS} r="4" fill="#ef4444" />
            <text 
              x={extremes.bottomPlanet.x + 10} 
              y={(extremes.bottomPlanet.y + PLANET_RADIUS + 500) / 2}
              fill="#ef4444"
              fontSize="14"
              fontWeight="bold"
            >
              {Math.round(500 - (extremes.bottomPlanet.y + PLANET_RADIUS))}px
            </text>
            <text 
              x={extremes.bottomPlanet.x + 10} 
              y={(extremes.bottomPlanet.y + PLANET_RADIUS + 500) / 2 + 16}
              fill="#ef4444"
              fontSize="10"
            >
              ({extremes.bottomPlanet.name})
            </text>

            {/* LEFT - Jupiter to left edge */}
            <line 
              x1={extremes.leftPlanet.x - PLANET_RADIUS}
              y1={extremes.leftPlanet.y}
              x2="0"
              y2={extremes.leftPlanet.y}
              stroke="#ef4444" 
              strokeWidth="2"
            />
            <circle cx={extremes.leftPlanet.x - PLANET_RADIUS} cy={extremes.leftPlanet.y} r="4" fill="#ef4444" />
            <text 
              x={(extremes.leftPlanet.x - PLANET_RADIUS) / 2}
              y={extremes.leftPlanet.y - 10}
              fill="#ef4444"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
            >
              {Math.round(extremes.leftPlanet.x - PLANET_RADIUS)}px
            </text>
            <text 
              x={(extremes.leftPlanet.x - PLANET_RADIUS) / 2}
              y={extremes.leftPlanet.y - 24}
              fill="#ef4444"
              fontSize="10"
              textAnchor="middle"
            >
              ({extremes.leftPlanet.name})
            </text>

            {/* RIGHT - Neptune to right edge */}
            <line 
              x1={extremes.rightPlanet.x + PLANET_RADIUS}
              y1={extremes.rightPlanet.y}
              x2="500"
              y2={extremes.rightPlanet.y}
              stroke="#ef4444" 
              strokeWidth="2"
            />
            <circle cx={extremes.rightPlanet.x + PLANET_RADIUS} cy={extremes.rightPlanet.y} r="4" fill="#ef4444" />
            <text 
              x={(extremes.rightPlanet.x + PLANET_RADIUS + 500) / 2}
              y={extremes.rightPlanet.y - 10}
              fill="#ef4444"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
            >
              {Math.round(500 - (extremes.rightPlanet.x + PLANET_RADIUS))}px
            </text>
            <text 
              x={(extremes.rightPlanet.x + PLANET_RADIUS + 500) / 2}
              y={extremes.rightPlanet.y - 24}
              fill="#ef4444"
              fontSize="10"
              textAnchor="middle"
            >
              ({extremes.rightPlanet.name})
            </text>

            {/* Center crosshair */}
            <line x1="250" y1="0" x2="250" y2="500" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <line x1="0" y1="250" x2="500" y2="250" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          </g>
        )}
      </svg>
    </div>
  );
}

// ===== PLANET DATA LIST =====
function PlanetDataList({ planets }: { planets: any[] }) {
  const leftPlanets = planets.slice(0, 4);
  const rightPlanets = planets.slice(4, 8);

  const renderPlanetRow = (planet: any) => {
    const config = PLANET_CONFIG[planet.planet_name];
    const planetImage = PLANET_IMAGES[planet.planet_name];
    
    return (
      <div key={planet.planet_name} className="planet-simple-row">
        {planetImage ? (
          <img src={planetImage} alt={planet.planet_name} className="planet-simple-img" />
        ) : (
          <span className="planet-simple-dot" style={{ backgroundColor: config?.color }} />
        )}
        <div className="planet-simple-info">
          <span className="planet-simple-name">{planet.planet_name}</span>
          <span className="planet-simple-sign">{planet.sign}</span>
        </div>
        <span className="planet-simple-degree">{planet.degree.toFixed(0)}°</span>
      </div>
    );
  };

  return (
    <div className="planet-simple-list">
      <div className="planet-simple-column">
        {leftPlanets.map(renderPlanetRow)}
      </div>
      <div className="planet-simple-column">
        {rightPlanets.map(renderPlanetRow)}
      </div>
    </div>
  );
}

// ===== BIG THREE CARDS =====
function BigThreeCards({ birthChart }: { birthChart: any }) {
  if (!birthChart) return null;

  const signs = [
    { 
      label: 'Sun', 
      icon: '☀️', 
      sign: birthChart.sun_sign || 'Unknown', 
      color: '#FFD700', 
      bg: 'linear-gradient(135deg, rgba(255, 215, 0, 0.18), rgba(255, 165, 0, 0.08))',
      borderColor: 'rgba(255, 215, 0, 0.4)'
    },
    { 
      label: 'Moon', 
      icon: '🌙', 
      sign: birthChart.moon_sign || 'Unknown', 
      color: '#C0C0C0', 
      bg: 'linear-gradient(135deg, rgba(192, 192, 192, 0.18), rgba(100, 100, 150, 0.08))',
      borderColor: 'rgba(192, 192, 192, 0.4)'
    },
    { 
      label: 'Rising', 
      icon: '⬆️', 
      sign: birthChart.rising_sign || 'Unknown', 
      color: '#D9B66F', 
      bg: 'linear-gradient(135deg, rgba(217, 182, 111, 0.18), rgba(139, 90, 43, 0.08))',
      borderColor: 'rgba(217, 182, 111, 0.4)'
    },
  ];

  return (
    <div className="big-three-container">
      {signs.map((item) => (
        <div 
          key={item.label} 
          className="big-three-card" 
          style={{ 
            background: item.bg,
            borderColor: item.borderColor
          }}
        >
          <div className="big-three-header">
            <div className="big-three-icon" style={{ color: item.color }}>
              {item.icon}
            </div>
            <div className="big-three-label">{item.label}</div>
          </div>
          <div className="big-three-value">
            <span className="big-three-symbol" style={{ color: item.color }}>
              {ZODIAC_SYMBOLS[item.sign] || '✨'}
            </span>
            <span className="big-three-name">{item.sign}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== COSMIC ENERGY CARDS =====
function CosmicEnergyCards({ cosmicData, birthChart }: { cosmicData: any; birthChart: any }) {
  const dominantElement = cosmicData?.cosmic?.dominant_element || 'Earth';
  const energyLevel = cosmicData?.cosmic?.energy_level || 85;
  const moonSign = birthChart?.moon_sign || cosmicData?.cosmic?.moon_sign || 'Scorpio';
  const sunSign = birthChart?.sun_sign || cosmicData?.cosmic?.sun_sign || 'Leo';

  const getElementIcon = (element: string) => {
    const icons: Record<string, string> = {
      'Fire': '🔥', 'Earth': '🌍', 'Air': '', 'Water': '💧'
    };
    return icons[element] || '✨';
  };

  const cards = [
    { 
      icon: getElementIcon(dominantElement), 
      label: 'Dominant Element', 
      value: dominantElement,
      bg: 'linear-gradient(135deg, rgba(255, 100, 50, 0.15), rgba(255, 165, 0, 0.08))',
      iconBg: 'rgba(255, 100, 50, 0.2)'
    },
    { 
      icon: '⚡', 
      label: 'Energy Level', 
      value: `${energyLevel}/100`,
      hasProgress: true,
      progress: energyLevel,
      bg: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.08))',
      iconBg: 'rgba(255, 215, 0, 0.2)'
    },
    { 
      icon: '🌙', 
      label: 'Moon', 
      value: `${moonSign}`,
      bg: 'linear-gradient(135deg, rgba(100, 80, 180, 0.2), rgba(60, 40, 120, 0.1))',
      iconBg: 'rgba(100, 80, 180, 0.3)'
    },
    { 
      icon: '☀️', 
      label: 'Sun', 
      value: sunSign,
      bg: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.08))',
      iconBg: 'rgba(255, 215, 0, 0.2)'
    },
  ];

  return (
    <div className="cosmic-energy-grid">
      {cards.map((card, index) => (
        <div key={index} className="energy-card" style={{ background: card.bg }}>
          <div className="energy-icon-wrapper" style={{ background: card.iconBg }}>
            <span className="energy-icon">{card.icon}</span>
          </div>
          <div className="energy-info">
            <div className="energy-label">{card.label}</div>
            <div className="energy-value">{card.value}</div>
            {card.hasProgress && (
              <div className="energy-progress-bar">
                <div 
                  className="energy-progress-fill" 
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== MAIN ASTRO SCREEN =====
export default function AstroScreen({ onNavigate }: AstroScreenProps) {
  const { birthChart } = useBirthChart();
  const { data: cosmicData } = useCosmicData();
  const [planets, setPlanets] = useState<any[]>([]);
  const [planetsLoading, setPlanetsLoading] = useState(true);

  useEffect(() => {
    const fetchPlanets = async () => {
      if (!supabase) {
        setPlanetsLoading(false);
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
        setPlanetsLoading(false);
      }
    };

    fetchPlanets();
  }, []);

  return (
    <div className="astro-screen">
      <div className="cosmic-background" style={{ backgroundImage: `url(${BG_IMAGE})` }} />

      {/* Header */}
      <div className="astro-header">
        <button className="astro-back-btn" onClick={() => onNavigate?.('home')}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="astro-title">ASTRO</h1>
        <div className="astro-header-spacer" />
      </div>

      {/* Main Content */}
      <div className="astro-content">
        
        {/* 1. Big Three */}
        <motion.section 
          className="astro-section big-three-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="section-heading">
            <Star size={14} className="section-icon" />
            Your Big Three
          </h2>
          <BigThreeCards birthChart={birthChart} />
        </motion.section>

        {/* 2. Planet Positions */}
        <motion.section 
          className="astro-section planets-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="planets-header">
            <h2 className="section-heading">
              <span className="sparkle-icon">✦</span>
              Planet Positions
            </h2>
            <button className="info-btn">
              <Info size={14} />
            </button>
          </div>

          {planetsLoading ? (
            <div className="loading-placeholder">Loading planets...</div>
          ) : (
            <>
              <PlanetOrbitDiagram planets={planets} />
              <PlanetDataList planets={planets} />
            </>
          )}
        </motion.section>

        {/* 3. Cosmic Energy */}
        <motion.section 
          className="astro-section energy-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="section-heading">
            <Zap size={14} className="section-icon" />
            Today's Cosmic Energy
          </h2>
          <CosmicEnergyCards cosmicData={cosmicData} birthChart={birthChart} />
        </motion.section>

        {/* 4. CTA Button */}
        <motion.button
          className="cta-horoscope-btn"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          onClick={() => onNavigate?.('horoscope')}
        >
          <span className="cta-icon"></span>
          <span className="cta-text">Get My Personal Horoscope</span>
          <span className="cta-arrow">→</span>
        </motion.button>

        {/* Bottom padding */}
        <div className="bottom-spacer" />

      </div>
    </div>
  );
}