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
  'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋',
  'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
  'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓'
};

export interface AstroScreenProps {
  onNavigate?: (screen: string) => void;
}

// ===== PLANET ORBIT DIAGRAM - 2px PADDING =====
function PlanetOrbitDiagram({ planets }: { planets: any[] }) {
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(true);
  const [svgDimensions, setSvgDimensions] = useState({ clientWidth: 440 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  const VIEWBOX_SIZE = 800;
  const PLANET_RADIUS = 36; // 3x
  const TARGET_PADDING = 2; // ✅ 10px → 2px

  const scaleFactor = svgDimensions.clientWidth / VIEWBOX_SIZE;
  const PADDING_IN_VIEWBOX = Math.ceil(TARGET_PADDING / scaleFactor);

  // ✅ პროპორციული ორბიტები
  const getBaseOrbitRadius = (planetName: string): number => {
    const ratios: Record<string, number> = {
      'Mercury': 0.15,
      'Venus': 0.25,
      'Moon': 0.36,
      'Mars': 0.49,
      'Jupiter': 0.59,
      'Saturn': 0.68,
      'Uranus': 0.74,
      'Neptune': 1.0
    };
    return ratios[planetName] || 0.5;
  };

  // ✅ ვიპოვოთ ყველა პლანეტის პოზიციები
  const calculatePlanetPositions = () => {
    const positions: Record<string, { x: number; y: number }> = {};
    positions['Sun'] = { x: 0, y: 0 };
    
    planets.forEach(planet => {
      if (planet.planet_name === 'Sun') return;
      const ratio = getBaseOrbitRadius(planet.planet_name);
      const signIndex = Object.keys(ZODIAC_SYMBOLS).indexOf(planet.sign);
      const signAngle = (signIndex * 30) + planet.degree;
      const angle = (signAngle * Math.PI) / 180;
      positions[planet.planet_name] = {
        x: ratio * Math.cos(angle),
        y: ratio * Math.sin(angle)
      };
    });
    return positions;
  };

  // ✅ ვიპოვოთ bounding box და center offset
  const calculateSystemCenter = () => {
    const positions = calculatePlanetPositions();
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    
    Object.values(positions).forEach(pos => {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    });
    
    const boxCenterX = (minX + maxX) / 2;
    const boxCenterY = (minY + maxY) / 2;
    const offsetX = -boxCenterX;
    const offsetY = -boxCenterY;
    
    let maxDistance = 0;
    Object.values(positions).forEach(pos => {
      const newX = pos.x + offsetX;
      const newY = pos.y + offsetY;
      const distance = Math.sqrt(newX * newX + newY * newY);
      if (distance > maxDistance) maxDistance = distance;
    });
    
    console.log('📦 BOUNDING BOX:');
    console.log(`  Center: (${boxCenterX.toFixed(3)}, ${boxCenterY.toFixed(3)})`);
    console.log(`  Offset: (${offsetX.toFixed(3)}, ${offsetY.toFixed(3)})`);
    console.log(`  Max distance: ${maxDistance.toFixed(3)}`);
    
    return { offsetX, offsetY, maxDistance };
  };

  const { offsetX, offsetY, maxDistance } = calculateSystemCenter();

  // ✅ გამოვთვალოთ max orbit radius (2px padding)
  const MAX_ORBIT_RADIUS = (VIEWBOX_SIZE / 2) - PLANET_RADIUS - PADDING_IN_VIEWBOX;
  const SCALE_FACTOR_ORBITS = MAX_ORBIT_RADIUS / maxDistance;

  console.log('🔧 SYSTEM CENTERING (2px PADDING):');
  console.log(`  Scale factor: ${scaleFactor.toFixed(3)}`);
  console.log(`  Planet radius: ${PLANET_RADIUS}px (3x)`);
  console.log(`  Padding in viewBox: ${PADDING_IN_VIEWBOX}px`);
  console.log(`  Max orbit radius: ${MAX_ORBIT_RADIUS}px`);

  // ✅ დინამიური ორბიტები
  const PLANET_CONFIG: Record<string, { color: string; orbitRadius: number; x: number; y: number }> = {};
  
  planets.forEach(planet => {
    const ratio = getBaseOrbitRadius(planet.planet_name);
    const signIndex = Object.keys(ZODIAC_SYMBOLS).indexOf(planet.sign);
    const signAngle = (signIndex * 30) + planet.degree;
    const angle = (signAngle * Math.PI) / 180;
    
    const rawX = ratio * Math.cos(angle);
    const rawY = ratio * Math.sin(angle);
    
    const centeredX = (rawX + offsetX) * SCALE_FACTOR_ORBITS;
    const centeredY = (rawY + offsetY) * SCALE_FACTOR_ORBITS;
    
    const orbitRadius = Math.sqrt(centeredX * centeredX + centeredY * centeredY);
    
    PLANET_CONFIG[planet.planet_name] = {
      color: PLANET_IMAGES[planet.planet_name] ? '#FFD700' : '#A0A0A0',
      orbitRadius,
      x: centeredX,
      y: centeredY
    };
  });

  const sunX = offsetX * SCALE_FACTOR_ORBITS;
  const sunY = offsetY * SCALE_FACTOR_ORBITS;
  PLANET_CONFIG['Sun'] = {
    color: '#FFD700',
    orbitRadius: Math.sqrt(sunX * sunX + sunY * sunY),
    x: sunX,
    y: sunY
  };

  useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setSvgDimensions({ clientWidth: rect.width });
    }
  }, []);

  useEffect(() => {
    console.log('🪐 CENTERED PLANET POSITIONS (2px):');
    Object.entries(PLANET_CONFIG).forEach(([name, config]) => {
      const distanceToEdge = VIEWBOX_SIZE / 2 - config.orbitRadius - PLANET_RADIUS;
      const realDistance = distanceToEdge * scaleFactor;
      console.log(`  ${name}: orbit=${config.orbitRadius.toFixed(1)}px, edge=${distanceToEdge.toFixed(1)}px, real=${realDistance.toFixed(1)}px`);
    });
  }, [planets, svgDimensions.clientWidth]);

  const getPlanetPosition = (planetName: string) => {
    const config = PLANET_CONFIG[planetName];
    if (!config) return { x: VIEWBOX_SIZE / 2, y: VIEWBOX_SIZE / 2 };
    return {
      x: VIEWBOX_SIZE / 2 + config.x,
      y: VIEWBOX_SIZE / 2 + config.y
    };
  };

  const getExtremePlanets = () => {
    if (planets.length === 0) return null;

    let topPlanet = { name: '', x: 0, y: 9999 };
    let bottomPlanet = { name: '', x: 0, y: -1 };
    let leftPlanet = { name: '', x: 9999, y: 0 };
    let rightPlanet = { name: '', x: -1, y: 0 };

    planets.forEach(planet => {
      const pos = getPlanetPosition(planet.planet_name);
      if (pos.y < topPlanet.y) topPlanet = { name: planet.planet_name, ...pos };
      if (pos.y > bottomPlanet.y) bottomPlanet = { name: planet.planet_name, ...pos };
      if (pos.x < leftPlanet.x) leftPlanet = { name: planet.planet_name, ...pos };
      if (pos.x > rightPlanet.x) rightPlanet = { name: planet.planet_name, ...pos };
    });

    console.log('🎯 EXTREME PLANETS (2px PADDING):');
    console.log(`  Top (${topPlanet.name}): ${Math.round((topPlanet.y - PLANET_RADIUS) * scaleFactor)}px actual`);
    console.log(`  Bottom (${bottomPlanet.name}): ${Math.round((VIEWBOX_SIZE - bottomPlanet.y - PLANET_RADIUS) * scaleFactor)}px actual`);
    console.log(`  Left (${leftPlanet.name}): ${Math.round((leftPlanet.x - PLANET_RADIUS) * scaleFactor)}px actual`);
    console.log(`  Right (${rightPlanet.name}): ${Math.round((VIEWBOX_SIZE - rightPlanet.x - PLANET_RADIUS) * scaleFactor)}px actual`);

    return { topPlanet, bottomPlanet, leftPlanet, rightPlanet };
  };

  const extremes = getExtremePlanets();

  return (
    <div className="orbit-diagram-container">
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
        ref={svgRef}
        className="orbit-svg" 
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="40%" stopColor="#FFA500" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF8C00" stopOpacity="0" />
          </radialGradient>
          <filter id="planetShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="2" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sunGlowFilter">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
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
              cx={VIEWBOX_SIZE / 2 + config.x}
              cy={VIEWBOX_SIZE / 2 + config.y}
              r={config.orbitRadius}
              fill="none"
              stroke="rgba(217, 182, 111, 0.15)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

        {/* Sun center - 150px (3x) */}
        <circle 
          cx={VIEWBOX_SIZE / 2 + PLANET_CONFIG['Sun'].x} 
          cy={VIEWBOX_SIZE / 2 + PLANET_CONFIG['Sun'].y} 
          r="75" 
          fill="url(#sunGlow)" 
          className="sun-glow" 
          filter="url(#sunGlowFilter)" 
        />
        {PLANET_IMAGES['Sun'] && (
          <image
            href={PLANET_IMAGES['Sun']}
            x={VIEWBOX_SIZE / 2 + PLANET_CONFIG['Sun'].x - 75}
            y={VIEWBOX_SIZE / 2 + PLANET_CONFIG['Sun'].y - 75}
            width="150"
            height="150"
            className="planet-img sun-img"
            preserveAspectRatio="xMidYMid slice"
            clipPath="circle(75px at center)"
          />
        )}

        {/* Planets - 90px (3x) */}
        {planets.map((planet, index) => {
          const config = PLANET_CONFIG[planet.planet_name];
          if (!config) return null;

          const posX = VIEWBOX_SIZE / 2 + config.x;
          const posY = VIEWBOX_SIZE / 2 + config.y;
          const isHovered = hoveredPlanet === planet.planet_name;
          const planetImage = PLANET_IMAGES[planet.planet_name];
          const size = isHovered ? 114 : 90;

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
                    cx={posX}
                    cy={posY}
                    r={size / 2 + 9}
                    fill="none"
                    stroke={config.color}
                    strokeWidth="1.5"
                    opacity={isHovered ? 0.8 : 0.4}
                    className="planet-glow-ring"
                  />
                  <image
                    href={planetImage}
                    x={posX - size / 2}
                    y={posY - size / 2}
                    width={size}
                    height={size}
                    className="planet-img"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`circle(${size / 2}px at center)`}
                  />
                  <text
                    x={posX}
                    y={posY + size / 2 + 42}
                    textAnchor="middle"
                    className="planet-name-text"
                    style={{ fontSize: isHovered ? '36px' : '33px' }}
                  >
                    {planet.planet_name}
                  </text>
                  <text
                    x={posX}
                    y={posY + size / 2 + 78}
                    textAnchor="middle"
                    className="zodiac-name-text"
                    style={{ fontSize: '30px' }}
                  >
                    {planet.sign}
                  </text>
                </motion.g>
              ) : (
                <motion.circle
                  cx={posX}
                  cy={posY}
                  r={isHovered ? 57 : 45}
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

        {/* DEBUG MODE */}
        {debugMode && extremes && (
          <g className="debug-overlay">
            <rect 
              x="0" y="0" 
              width={VIEWBOX_SIZE} height={VIEWBOX_SIZE} 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth="3"
              strokeDasharray="8 8"
            />

            <rect x="10" y="10" width="320" height="140" fill="rgba(0,0,0,0.9)" stroke="#10b981" strokeWidth="2" rx="8" />
            <text x="20" y="35" fill="#10b981" fontSize="14" fontWeight="bold">2px Padding System:</text>
            <text x="20" y="55" fill="#fff" fontSize="11">Planet radius: {PLANET_RADIUS}px</text>
            <text x="20" y="70" fill="#fff" fontSize="11">Scale: {SCALE_FACTOR_ORBITS.toFixed(3)}</text>
            <text x="20" y="85" fill="#fff" fontSize="11">Padding: {PADDING_IN_VIEWBOX}px</text>
            <text x="20" y="100" fill="#10b981" fontSize="11" fontWeight="bold">Expected: 2px</text>
            <text x="20" y="115" fill="#10b981" fontSize="11" fontWeight="bold">Actual: {(PADDING_IN_VIEWBOX * scaleFactor).toFixed(1)}px</text>

            {/* TOP */}
            <line x1={extremes.topPlanet.x} y1={extremes.topPlanet.y - PLANET_RADIUS} x2={extremes.topPlanet.x} y2="0" stroke="#ef4444" strokeWidth="3" />
            <circle cx={extremes.topPlanet.x} cy={extremes.topPlanet.y - PLANET_RADIUS} r="6" fill="#ef4444" />
            <text x={extremes.topPlanet.x + 15} y={(extremes.topPlanet.y - PLANET_RADIUS) / 2} fill="#ef4444" fontSize="18" fontWeight="bold">
              {Math.round((extremes.topPlanet.y - PLANET_RADIUS) * scaleFactor)}px
            </text>
            <text x={extremes.topPlanet.x + 15} y={(extremes.topPlanet.y - PLANET_RADIUS) / 2 + 20} fill="#ef4444" fontSize="13">
              ({extremes.topPlanet.name})
            </text>

            {/* BOTTOM */}
            <line x1={extremes.bottomPlanet.x} y1={extremes.bottomPlanet.y + PLANET_RADIUS} x2={extremes.bottomPlanet.x} y2={VIEWBOX_SIZE} stroke="#ef4444" strokeWidth="3" />
            <circle cx={extremes.bottomPlanet.x} cy={extremes.bottomPlanet.y + PLANET_RADIUS} r="6" fill="#ef4444" />
            <text x={extremes.bottomPlanet.x + 15} y={(extremes.bottomPlanet.y + PLANET_RADIUS + VIEWBOX_SIZE) / 2} fill="#ef4444" fontSize="18" fontWeight="bold">
              {Math.round((VIEWBOX_SIZE - extremes.bottomPlanet.y - PLANET_RADIUS) * scaleFactor)}px
            </text>
            <text x={extremes.bottomPlanet.x + 15} y={(extremes.bottomPlanet.y + PLANET_RADIUS + VIEWBOX_SIZE) / 2 + 20} fill="#ef4444" fontSize="13">
              ({extremes.bottomPlanet.name})
            </text>

            {/* LEFT */}
            <line x1={extremes.leftPlanet.x - PLANET_RADIUS} y1={extremes.leftPlanet.y} x2="0" y2={extremes.leftPlanet.y} stroke="#ef4444" strokeWidth="3" />
            <circle cx={extremes.leftPlanet.x - PLANET_RADIUS} cy={extremes.leftPlanet.y} r="6" fill="#ef4444" />
            <text x={(extremes.leftPlanet.x - PLANET_RADIUS) / 2} y={extremes.leftPlanet.y - 15} fill="#ef4444" fontSize="18" fontWeight="bold" textAnchor="middle">
              {Math.round((extremes.leftPlanet.x - PLANET_RADIUS) * scaleFactor)}px
            </text>
            <text x={(extremes.leftPlanet.x - PLANET_RADIUS) / 2} y={extremes.leftPlanet.y - 35} fill="#ef4444" fontSize="13" textAnchor="middle">
              ({extremes.leftPlanet.name})
            </text>

            {/* RIGHT */}
            <line x1={extremes.rightPlanet.x + PLANET_RADIUS} y1={extremes.rightPlanet.y} x2={VIEWBOX_SIZE} y2={extremes.rightPlanet.y} stroke="#ef4444" strokeWidth="3" />
            <circle cx={extremes.rightPlanet.x + PLANET_RADIUS} cy={extremes.rightPlanet.y} r="6" fill="#ef4444" />
            <text x={(extremes.rightPlanet.x + PLANET_RADIUS + VIEWBOX_SIZE) / 2} y={extremes.rightPlanet.y - 15} fill="#ef4444" fontSize="18" fontWeight="bold" textAnchor="middle">
              {Math.round((VIEWBOX_SIZE - extremes.rightPlanet.x - PLANET_RADIUS) * scaleFactor)}px
            </text>
            <text x={(extremes.rightPlanet.x + PLANET_RADIUS + VIEWBOX_SIZE) / 2} y={extremes.rightPlanet.y - 35} fill="#ef4444" fontSize="13" textAnchor="middle">
              ({extremes.rightPlanet.name})
            </text>

            <line x1={VIEWBOX_SIZE / 2} y1="0" x2={VIEWBOX_SIZE / 2} y2={VIEWBOX_SIZE} stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.5" />
            <line x1="0" y1={VIEWBOX_SIZE / 2} x2={VIEWBOX_SIZE} y2={VIEWBOX_SIZE / 2} stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.5" />
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
    return (
      <div key={planet.planet_name} className="planet-simple-row">
        {PLANET_IMAGES[planet.planet_name] ? (
          <img src={PLANET_IMAGES[planet.planet_name]} alt={planet.planet_name} className="planet-simple-img" />
        ) : (
          <span className="planet-simple-dot" />
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
    { label: 'Sun', icon: '☀️', sign: birthChart.sun_sign || 'Unknown', color: '#FFD700', bg: 'linear-gradient(135deg, rgba(255, 215, 0, 0.18), rgba(255, 165, 0, 0.08))', borderColor: 'rgba(255, 215, 0, 0.4)' },
    { label: 'Moon', icon: '🌙', sign: birthChart.moon_sign || 'Unknown', color: '#C0C0C0', bg: 'linear-gradient(135deg, rgba(192, 192, 192, 0.18), rgba(100, 100, 150, 0.08))', borderColor: 'rgba(192, 192, 192, 0.4)' },
    { label: 'Rising', icon: '⬆️', sign: birthChart.rising_sign || 'Unknown', color: '#D9B66F', bg: 'linear-gradient(135deg, rgba(217, 182, 111, 0.18), rgba(139, 90, 43, 0.08))', borderColor: 'rgba(217, 182, 111, 0.4)' },
  ];

  return (
    <div className="big-three-container">
      {signs.map((item) => (
        <div key={item.label} className="big-three-card" style={{ background: item.bg, borderColor: item.borderColor }}>
          <div className="big-three-header">
            <div className="big-three-icon" style={{ color: item.color }}>{item.icon}</div>
            <div className="big-three-label">{item.label}</div>
          </div>
          <div className="big-three-value">
            <span className="big-three-symbol" style={{ color: item.color }}>{ZODIAC_SYMBOLS[item.sign] || '✨'}</span>
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
    const icons: Record<string, string> = { 'Fire': '🔥', 'Earth': '🌍', 'Air': '💨', 'Water': '💧' };
    return icons[element] || '✨';
  };

  const cards = [
    { icon: getElementIcon(dominantElement), label: 'Dominant Element', value: dominantElement, bg: 'linear-gradient(135deg, rgba(255, 100, 50, 0.15), rgba(255, 165, 0, 0.08))', iconBg: 'rgba(255, 100, 50, 0.2)' },
    { icon: '⚡', label: 'Energy Level', value: `${energyLevel}/100`, hasProgress: true, progress: energyLevel, bg: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.08))', iconBg: 'rgba(255, 215, 0, 0.2)' },
    { icon: '🌙', label: 'Moon', value: `${moonSign}`, bg: 'linear-gradient(135deg, rgba(100, 80, 180, 0.2), rgba(60, 40, 120, 0.1))', iconBg: 'rgba(100, 80, 180, 0.3)' },
    { icon: '☀️', label: 'Sun', value: sunSign, bg: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.08))', iconBg: 'rgba(255, 215, 0, 0.2)' },
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
                <div className="energy-progress-fill" style={{ width: `${card.progress}%` }} />
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

      <div className="astro-header">
        <button className="astro-back-btn" onClick={() => onNavigate?.('home')}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="astro-title">ASTRO</h1>
        <div className="astro-header-spacer" />
      </div>

      <div className="astro-content">
        <motion.section className="astro-section big-three-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h2 className="section-heading">
            <Star size={14} className="section-icon" />
            Your Big Three
          </h2>
          <BigThreeCards birthChart={birthChart} />
        </motion.section>

        <motion.section className="astro-section planets-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
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

        <motion.section className="astro-section energy-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <h2 className="section-heading">
            <Zap size={14} className="section-icon" />
            Today's Cosmic Energy
          </h2>
          <CosmicEnergyCards cosmicData={cosmicData} birthChart={birthChart} />
        </motion.section>

        <motion.button className="cta-horoscope-btn" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} onClick={() => onNavigate?.('horoscope')}>
          <span className="cta-icon"></span>
          <span className="cta-text">Get My Personal Horoscope</span>
          <span className="cta-arrow">→</span>
        </motion.button>

        <div className="bottom-spacer" />
      </div>
    </div>
  );
}