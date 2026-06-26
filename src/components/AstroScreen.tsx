import { useState, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import './AstroScreen.css';

// ============================================
// 3D PLANET COMPONENT
// ============================================
const Planet3D = ({ color, emissive, size, position, speed = 0.005 }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += speed;
    }
  });

  return (
    <Sphere ref={meshRef} args={[size, 32, 32]} position={position}>
      <meshStandardMaterial
        color={color}
        roughness={0.7}
        metalness={0.3}
        emissive={emissive || color}
        emissiveIntensity={0.3}
      />
    </Sphere>
  );
};

// ============================================
// 3D SOLAR SYSTEM
// ============================================
const SolarSystem3D = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Sun */}
      <Planet3D color="#FDB813" emissive="#FF8C00" size={0.8} position={[0, 0, 0]} speed={0.01} />
      
      {/* Mercury */}
      <mesh position={[1.5, 0, 0]}>
        <Planet3D color="#A0A0A0" size={0.2} position={[0, 0, 0]} speed={0.02} />
      </mesh>
      
      {/* Venus */}
      <mesh position={[2.2, 0, 0]}>
        <Planet3D color="#E8CDA0" size={0.3} position={[0, 0, 0]} speed={0.015} />
      </mesh>
      
      {/* Earth/Moon */}
      <mesh position={[3, 0, 0]}>
        <Planet3D color="#4B70DD" size={0.35} position={[0, 0, 0]} speed={0.01} />
      </mesh>
      
      {/* Mars */}
      <mesh position={[3.8, 0, 0]}>
        <Planet3D color="#FF4500" emissive="#8B0000" size={0.25} position={[0, 0, 0]} speed={0.008} />
      </mesh>
      
      {/* Jupiter */}
      <mesh position={[5, 0, 0]}>
        <Planet3D color="#D4A574" size={0.6} position={[0, 0, 0]} speed={0.005} />
      </mesh>
      
      {/* Saturn */}
      <mesh position={[6.5, 0, 0]}>
        <Planet3D color="#C4A882" size={0.5} position={[0, 0, 0]} speed={0.003} />
      </mesh>
    </group>
  );
};

// ============================================
// ZODIAC WHEEL SVG
// ============================================
const ZodiacWheel = () => {
  const symbols = ['', '♉', '♊', '', '♌', '♍', '', '♏', '♐', '', '♒', '♓'];
  
  return (
    <div className="zodiac-wheel-container">
      <svg width="220" height="220" viewBox="0 0 220 220" className="zodiac-wheel-svg">
        <defs>
          <radialGradient id="wheel-gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D9B66F" />
            <stop offset="100%" stopColor="#8B6914" />
          </radialGradient>
          <filter id="wheel-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="outer-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer glowing ring */}
        <circle cx="110" cy="110" r="108" fill="none" stroke="#D9B66F" strokeWidth="2" opacity="0.6" filter="url(#outer-glow)" />
        
        {/* Main ring */}
        <circle cx="110" cy="110" r="105" fill="none" stroke="url(#wheel-gold)" strokeWidth="3" filter="url(#wheel-glow)" />
        <circle cx="110" cy="110" r="95" fill="none" stroke="rgba(217, 182, 111, 0.3)" strokeWidth="1" />
        <circle cx="110" cy="110" r="70" fill="none" stroke="rgba(217, 182, 111, 0.2)" strokeWidth="1" />
        
        {/* Zodiac symbols */}
        {symbols.map((symbol, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x = 110 + 85 * Math.cos(angle);
          const y = 110 + 85 * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="18"
              fill="#D9B66F"
              filter="url(#wheel-glow)"
            >
              {symbol}
            </text>
          );
        })}
        
        {/* Center circle */}
        <circle cx="110" cy="110" r="38" fill="rgba(5, 5, 7, 0.9)" stroke="#D9B66F" strokeWidth="2" filter="url(#wheel-glow)" />
        <text x="110" y="120" textAnchor="middle" fontSize="44" fill="#D9B66F" filter="url(#wheel-glow)">♌</text>
      </svg>
    </div>
  );
};

// ============================================
// REALISTIC MOON SVG
// ============================================
const RealisticMoon = () => (
  <div className="moon-realistic-container">
    <svg width="140" height="140" viewBox="0 0 140 140">
      <defs>
        <radialGradient id="moon-gradient" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#f5f5f0" />
          <stop offset="40%" stopColor="#e0e0d5" />
          <stop offset="70%" stopColor="#c8c8b8" />
          <stop offset="100%" stopColor="#8a8a7a" />
        </radialGradient>
        <filter id="moon-glow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="crater-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      
      {/* Moon base with glow */}
      <circle cx="70" cy="70" r="60" fill="url(#moon-gradient)" filter="url(#moon-glow)" />
      
      {/* Craters */}
      <circle cx="50" cy="55" r="10" fill="url(#crater-shadow)" />
      <circle cx="85" cy="65" r="14" fill="url(#crater-shadow)" />
      <circle cx="65" cy="85" r="8" fill="url(#crater-shadow)" />
      <circle cx="95" cy="50" r="6" fill="url(#crater-shadow)" />
      <circle cx="45" cy="80" r="7" fill="url(#crater-shadow)" />
      
      {/* Shadow (waxing gibbous - right side shadow) */}
      <path d="M 70 10 A 60 60 0 0 1 70 130 A 40 60 0 0 0 70 10" fill="rgba(0,0,0,0.5)" />
      
      {/* Highlight */}
      <ellipse cx="55" cy="50" rx="20" ry="15" fill="rgba(255,255,255,0.15)" />
    </svg>
  </div>
);

// ============================================
// PLANET SVG COMPONENT
// ============================================
const PlanetSVG = ({ color1, color2, glowColor, size, label, sign }: any) => (
  <div className="planet-svg-container">
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`planet-${label}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="60%" stopColor={color2} />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <filter id={`glow-${label}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        cx="50" cy="50" r="45"
        fill={`url(#planet-${label})`}
        filter={`url(#glow-${label})`}
        style={{ filter: `drop-shadow(0 0 ${size/3}px ${glowColor})` }}
      />
      {/* Highlight */}
      <ellipse cx="35" cy="35" rx="18" ry="14" fill="rgba(255,255,255,0.25)" />
    </svg>
    <div className="planet-label">
      <span>{label}</span>
      <span>{sign}</span>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function AstroScreen({ onNavigate }: any) {
  const [energyPercentage] = useState(78);

  const insights = [
    { icon: '✨', label: '', value: 'Your intuition is strong today. Trust the signs around you.', color: 'gold' },
    { icon: '', label: 'Lucky Color', value: 'Royal Purple', color: 'purple' },
    { icon: '', label: 'Lucky Number', value: '7', color: 'gold' },
    { icon: '💎', label: 'Lucky Crystal', value: 'Amethyst', color: 'purple' },
    { icon: '⏰', label: 'Lucky Time', value: '10:00 AM - 12:00 PM', color: 'gold' },
    { icon: '🧘', label: 'Best Activity', value: 'Meditation', color: 'gold' }
  ];

  const compatibleSigns = [
    { symbol: '♈', name: 'Aries' },
    { symbol: '♐', name: 'Sagittarius' },
    { symbol: '♎', name: 'Libra' }
  ];

  return (
    <div className="astro-screen">
      {/* Cosmic Background */}
      <div className="cosmic-background">
        <div className="stars" />
        <div className="nebula" />
        <div className="flowing-energy energy-1" />
        <div className="flowing-energy energy-2" />
      </div>

      {/* Main Content */}
      <div className="astro-content">
        
        {/* Hero Section */}
        <section className="hero-section">
          <ZodiacWheel />
          
          <div className="cosmic-energy-header">
            <h1 className="energy-title">TODAY'S COSMIC ENERGY</h1>
            <p className="energy-subtitle">The universe is aligning in your favor today.</p>
          </div>
          
          <div className="energy-badge">
            <div className="energy-circle">
              <svg viewBox="0 0 100 100">
                <circle className="energy-bg" cx="50" cy="50" r="42" />
                <circle className="energy-progress" cx="50" cy="50" r="42"
                  style={{ strokeDasharray: `${2 * Math.PI * 42}`, strokeDashoffset: `${2 * Math.PI * 42 * (1 - energyPercentage / 100)}` }} />
              </svg>
              <span className="energy-value">{energyPercentage}%</span>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="main-grid">
          
          {/* Left Column */}
          <div className="left-section">
            <motion.div className="organic-card insights-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="section-title">COSMIC INSIGHTS: TODAY</h2>
              
              <div className="insights-list">
                {insights.map((insight, i) => (
                  <div key={i} className="insight-row">
                    <div className={`insight-icon ${insight.color}-icon`}>
                      {insight.icon}
                    </div>
                    <div className="insight-text">
                      {insight.label && <span className="insight-label">{insight.label}</span>}
                      <span className="insight-value">{insight.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Compatible Signs */}
            <motion.div className="organic-card matches-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <h2 className="section-title">ENERGY MATCHES & COMPATIBLE SIGNS</h2>
              <div className="compatible-grid">
                {compatibleSigns.map((sign, i) => (
                  <div key={i} className="sign-item">
                    <div className="sign-circle">
                      <span>{sign.symbol}</span>
                    </div>
                    <span className="sign-name">{sign.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="right-section">
            
            {/* Lunar Phase */}
            <motion.div className="organic-card lunar-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <div className="lunar-circle">
                <div className="lunar-text-top">LUNAR PHASE & WAXING GIBBOUS</div>
                <RealisticMoon />
                <div className="lunar-stats-row">
                  <div className="lunar-stat">
                    <span className="stat-percent">78%</span>
                    <span className="stat-label">Illuminated</span>
                  </div>
                  <div className="lunar-divider" />
                  <div className="lunar-stat">
                    <span className="stat-percent">78%</span>
                    <span className="stat-label">energy</span>
                  </div>
                </div>
                <p className="lunar-desc">High energy, take action towards your goals.</p>
                <div className="lunar-ritual">
                  <span className="ritual-label">Best Ritual:</span>
                  <span className="ritual-value">Release & Manifest</span>
                </div>
              </div>
            </motion.div>

            {/* Small Planets */}
            <motion.div className="small-planets" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
              <PlanetSVG color1="#FDB813" color2="#FF8C00" glowColor="rgba(253, 184, 19, 0.6)" size={45} label="Sun" sign="Leo" />
              <PlanetSVG color1="#E8E8E8" color2="#A0A0A0" glowColor="rgba(232, 232, 232, 0.4)" size={40} label="Moon" sign="Gemini" />
              <PlanetSVG color1="#FF4500" color2="#8B0000" glowColor="rgba(255, 69, 0, 0.6)" size={35} label="Mars" sign="Virgo" />
              <PlanetSVG color1="#D4A574" color2="#8B4513" glowColor="rgba(212, 165, 116, 0.4)" size={42} label="Jupiter" sign="Taufort" />
            </motion.div>

            {/* 3D Planetary Alignment */}
            <motion.div className="organic-card planetary-alignment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
              <h2 className="section-title">PLANETARY ALIGNMENT</h2>
              <div className="solar-system-3d">
                <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
                  <ambientLight intensity={0.3} />
                  <pointLight position={[10, 10, 10]} intensity={1} />
                  <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
                  <Suspense fallback={null}>
                    <SolarSystem3D />
                  </Suspense>
                  <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                </Canvas>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}