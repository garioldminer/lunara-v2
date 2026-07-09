import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import './LoadingScreen.css';

interface Props {
  message?: string;
  progress?: number; // 0-100
}

const LOADING_QUOTES = [
  "The stars are aligning for you",
  "Consulting the cosmic energies",
  "Shuffling the celestial deck",
  "Reading the ancient wisdom",
  "Connecting to the universe",
  "Awakening your spiritual path",
  "The moon reveals your destiny",
  "Cosmic winds guide your journey",
  "Tarot cards await your question",
  "Mystical forces are at work"
];

const CARD_SYMBOLS = ['✦', '☽', '✧', '☀', '✶', '✵'];

export default function LoadingScreen({ message, progress }: Props) {
  const [randomQuote, setRandomQuote] = useState(LOADING_QUOTES[0]);
  const [dots, setDots] = useState("");

  // შემთხვევითი ციტატა (მხოლოდ ერთხელ)
  useEffect(() => {
    setRandomQuote(LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)]);
  }, []);

  // დოტების ანიმაცია
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Particles-ის ფიქსირებული პოზიციები (არ იცვლება re-render-ზე)
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 3,
      delay: Math.random() * 2,
      size: 3 + Math.random() * 5,
      opacity: 0.4 + Math.random() * 0.6
    }));
  }, []);

  return (
    <div className="loading-screen">
      {/* Background Image */}
      <div 
        className="loading-bg"
        style={{
          backgroundImage: `url('https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/backgrounds/loading-bg.png')`
        }}
      />
      
      {/* Dark Overlay */}
      <div className="loading-overlay" />

      {/* Floating Particles */}
      <div className="loading-particles">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="particle"
            initial={{
              opacity: 0,
              scale: 0,
              y: 0
            }}
            animate={{
              y: -150,
              opacity: [0, particle.opacity, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeOut"
            }}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: `radial-gradient(circle, rgba(255, 229, 102, ${particle.opacity}) 0%, transparent 70%)`
            }}
          />
        ))}
      </div>

      {/* Content Container */}
      <div className="loading-content">
        {/* Moon Glow Effect (ცენტრში, კარტების უკან) */}
        <div className="moon-container">
          <motion.div
            className="moon-glow"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Spinning Cards Container */}
          <div className="cards-container">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="floating-card"
                initial={{ 
                  opacity: 0, 
                  rotate: 0, 
                  scale: 0.5,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  opacity: [0.4, 1, 0.4],
                  rotate: 360,
                  scale: [0.6, 1, 0.6],
                  x: Math.cos((i * 60 * Math.PI) / 180) * 90,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 90
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "linear"
                }}
                style={{
                  background: `linear-gradient(135deg, 
                    hsl(${45 + i * 10}, 70%, 60%), 
                    hsl(${35 + i * 10}, 60%, 40%))`,
                  boxShadow: `0 0 ${20 + i * 5}px rgba(255, 215, 0, ${0.4 + i * 0.1})`
                }}
              >
                <span className="card-symbol">
                  {CARD_SYMBOLS[i]}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* LUNARA Title */}
        <motion.h1
          className="loading-title"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          LUNARA
        </motion.h1>

        {/* Loading Message */}
        <motion.p
          className="loading-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {message || randomQuote}{dots}
        </motion.p>

        {/* Progress Bar */}
        <div className="loading-progress-container">
          <div className="loading-progress-bar">
            <motion.div
              className="loading-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: progress !== undefined ? `${progress}%` : "100%" }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {progress !== undefined && (
            <span className="loading-progress-text">{progress}%</span>
          )}
        </div>

        {/* Loading Dots */}
        <div className="loading-dots">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="loading-dot"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}