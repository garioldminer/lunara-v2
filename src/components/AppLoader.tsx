import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ============================================
   🌙 LUNARA — MINIMAL LUNAR LOADER
   Elegant, lightweight, premium feel
   ============================================ */

const loaderCSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;1,400&display=swap');

.minimal-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: radial-gradient(ellipse at center, #0f0720 0%, #050208 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  overflow: hidden;
}

/* ============================================
   ✨ SUBTLE STAR FIELD (15-20 twinkling dots)
   ============================================ */
.ml-stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ml-star {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: #F4D47C;
  box-shadow: 0 0 4px rgba(244, 212, 124, 0.6);
  animation: mlTwinkle ease-in-out infinite;
}

@keyframes mlTwinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* ============================================
   🌙 CENTRAL CRESCENT (the hero)
   ============================================ */
.ml-crescent {
  position: relative;
  width: 120px;
  height: 120px;
  animation: mlFloat 4s ease-in-out infinite;
}

.ml-moon {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%,
    #fff9d6 0%,
    #F4D47C 30%,
    #D9B66F 60%,
    #8B6914 100%);
  box-shadow:
    0 0 0 2px rgba(244, 212, 124, 0.4),
    0 0 30px rgba(244, 212, 124, 0.5),
    0 0 60px rgba(217, 182, 111, 0.3),
    inset -8px -8px 20px rgba(0, 0, 0, 0.5),
    inset 6px 6px 12px rgba(255, 255, 255, 0.15);
}

/* Moon craters (subtle) */
.ml-moon::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 25% 35%, rgba(0,0,0,0.2) 0%, transparent 8%),
    radial-gradient(circle at 60% 25%, rgba(0,0,0,0.15) 0%, transparent 6%),
    radial-gradient(circle at 45% 65%, rgba(0,0,0,0.2) 0%, transparent 7%);
  mix-blend-mode: multiply;
}

/* Crescent shadow (the key element) */
.ml-shadow {
  position: absolute;
  top: 12%;
  right: 8%;
  width: 55%;
  height: 55%;
  border-radius: 50%;
  background: radial-gradient(circle at 60% 60%,
    rgba(5, 2, 8, 0.85) 0%,
    rgba(5, 2, 8, 0.4) 60%,
    transparent 100%);
  filter: blur(4px);
  animation: mlRotate 12s linear infinite;
  transform-origin: 70% 70%;
}

@keyframes mlFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes mlRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ============================================
   ● ● ● LOADING DOTS
   ============================================ */
.ml-dots {
  display: flex;
  gap: 12px;
}

.ml-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, #F4D47C 50%, #D9B66F 100%);
  box-shadow:
    0 0 8px rgba(244, 212, 124, 1),
    0 0 16px rgba(217, 182, 111, 0.6);
  animation: mlPulse 1.4s ease-in-out infinite;
}

@keyframes mlPulse {
  0%, 100% { opacity: 0.4; transform: scale(0.7); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* ============================================
   💫 BRAND TEXT
   ============================================ */
.ml-brand {
  font-family: 'Cinzel', serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 8px;
  background: linear-gradient(180deg, #fff 0%, #F4D47C 50%, #8B6914 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(217,182,111,0.4));
  animation: mlTextGlow 3s ease-in-out infinite;
}

@keyframes mlTextGlow {
  0%, 100% { 
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(217,182,111,0.4));
  }
  50% { 
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(244,212,124,0.7));
  }
}

/* ============================================
   💬 OPTIONAL MESSAGE
   ============================================ */
.ml-message {
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px;
  font-style: italic;
  color: #F7F3EB;
  letter-spacing: 1.5px;
  text-align: center;
  margin: 0;
  text-shadow:
    0 0 8px rgba(244, 212, 124, 0.4),
    0 1px 2px rgba(0,0,0,0.8);
  animation: mlFade 1.6s ease-in-out infinite;
}

@keyframes mlFade {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 480px) {
  .ml-crescent { width: 100px; height: 100px; }
  .ml-brand { font-size: 12px; letter-spacing: 6px; }
  .ml-message { font-size: 13px; letter-spacing: 1px; }
}

@media (prefers-reduced-motion: reduce) {
  .ml-crescent, .ml-star, .ml-dot, .ml-shadow, .ml-brand, .ml-message {
    animation: none !important;
  }
}
`;

/* ============================================
   კომპონენტი
   ============================================ */

interface AppLoaderProps {
  isLoading: boolean;
  context?: 'horoscope' | 'tarot' | 'astro' | 'numerology' | 'profile' | 'default';
  message?: string;
}

const MESSAGES: Record<string, string> = {
  horoscope: 'Aligning your stars...',
  tarot: 'Shuffling the cards...',
  astro: 'Charting the planets...',
  numerology: 'Counting your numbers...',
  profile: 'Gathering your essence...',
  default: 'Loading...',
};

export function AppLoader({ isLoading, context = 'default', message }: AppLoaderProps) {
  const displayMessage = message || MESSAGES[context] || MESSAGES.default;

  // Subtle twinkling stars
  const stars = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      dur: 2 + Math.random() * 3,
      size: 1 + Math.random() * 1.5,
    })),
    []
  );

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="minimal-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <style>{loaderCSS}</style>

          {/* ✨ Subtle twinkling stars */}
          <div className="ml-stars">
            {stars.map((s) => (
              <span
                key={s.id}
                className="ml-star"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  animationDelay: `${s.delay}s`,
                  animationDuration: `${s.dur}s`,
                }}
              />
            ))}
          </div>

          {/* 🌙 Central crescent moon */}
          <div className="ml-crescent">
            <div className="ml-moon" />
            <div className="ml-shadow" />
          </div>

          {/* ● ● ● Pulsing dots */}
          <div className="ml-dots">
            <span className="ml-dot" style={{ animationDelay: '0s' }} />
            <span className="ml-dot" style={{ animationDelay: '0.2s' }} />
            <span className="ml-dot" style={{ animationDelay: '0.4s' }} />
          </div>

          {/* 💫 Brand name */}
          <div className="ml-brand">LUNARA</div>

          {/* 💬 Optional message */}
          {displayMessage !== 'Loading...' && (
            <p className="ml-message">{displayMessage}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}