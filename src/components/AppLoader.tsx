import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ============================================
   ✦ LUNARA — CONSTELLATION LOADER
   Quiet-luxury motion design. No emoji, no
   stock icon glyphs — pure SVG / gradient geometry.
   ============================================ */

const loaderCSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Fraunces:opsz,wght@9..144,340&display=swap');

.loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: radial-gradient(ellipse 130% 90% at 50% 32%, #16131C 0%, #0A0910 48%, #030304 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* filmic grain */
.ld-grain {
  position: absolute; inset: 0; z-index: 6; opacity: 0.05; pointer-events: none; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.ld-vignette {
  position: absolute; inset: 0; z-index: 5; pointer-events: none;
  background: radial-gradient(ellipse 85% 75% at 50% 42%, transparent 40%, rgba(2,2,3,0.8) 100%);
}

/* drifting motes */
.ld-field { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.ld-mote { position: absolute; border-radius: 50%; background: #D8CBAE; animation: ldDrift ease-in-out infinite; }
@keyframes ldDrift { 0%, 100% { opacity: 0.12; transform: translateY(0); } 50% { opacity: 0.45; transform: translateY(-10px); } }

/* stage */
.ld-stage { position: relative; width: 280px; height: 280px; z-index: 3; margin-bottom: 36px; }

.ld-arc-motif { position: absolute; inset: 0; }
.ld-arc-motif svg { width: 100%; height: 100%; }

.ld-orbit {
  position: absolute; inset: 34px; border-radius: 50%; border: 1px solid rgba(216,203,174,0.14);
  animation: ldSpin 46s linear infinite;
}
.ld-orbit::before {
  content: ''; position: absolute; top: -2px; left: 50%; width: 4px; height: 4px; margin-left: -2px;
  background: #E8D9AE; border-radius: 50%; box-shadow: 0 0 8px 2px rgba(232,217,174,0.75);
}
@keyframes ldSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.ld-orbit-2 {
  position: absolute; inset: 8px; border-radius: 50%; border: 1px solid rgba(216,203,174,0.07);
  animation: ldSpinRev 70s linear infinite;
}
@keyframes ldSpinRev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }

.ld-constellation { position: absolute; inset: 0; }
.ld-constellation svg { width: 100%; height: 100%; overflow: visible; }
.ld-cline {
  fill: none; stroke: rgba(216,203,174,0.55); stroke-width: 0.8; stroke-linecap: round;
  stroke-dasharray: 400; stroke-dashoffset: 400; animation: ldDraw 5.5s ease-in-out infinite;
}
.ld-ccore { fill: #0A0910; stroke: rgba(232,217,174,0.6); stroke-width: 0.6; opacity: 0; animation: ldAppear 5.5s ease-in-out infinite; }
@keyframes ldDraw { 0% { stroke-dashoffset: 400; } 45%, 100% { stroke-dashoffset: 0; } }
@keyframes ldAppear { 0% { opacity: 0; } 18% { opacity: 1; } 100% { opacity: 1; } }

.ld-core {
  position: absolute; left: 50%; top: 50%; width: 64px; height: 64px; margin: -32px 0 0 -32px; border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, rgba(232,217,174,0.85), rgba(216,203,174,0.15) 55%, transparent 78%);
  filter: blur(0.3px);
}
.ld-core::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%; border: 1px solid rgba(232,217,174,0.45);
  box-shadow: 0 0 24px 6px rgba(232,217,174,0.28); animation: ldBreathe 3.4s ease-in-out infinite;
}
@keyframes ldBreathe { 0%, 100% { opacity: 0.55; transform: scale(0.94); } 50% { opacity: 1; transform: scale(1.04); } }

.ld-progress-wrap { width: 150px; z-index: 4; margin-bottom: 26px; }
.ld-progress-track { position: relative; width: 100%; height: 1px; background: rgba(216,203,174,0.16); overflow: hidden; }
.ld-progress-fill { position: absolute; left: 0; top: 0; height: 100%; background: #E8D9AE; transition: width 0.3s ease; }
.ld-progress-sheen {
  position: absolute; top: 0; left: -40%; width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
  animation: ldSheen 2.4s ease-in-out infinite;
}
@keyframes ldSheen { 0% { left: -40%; } 100% { left: 100%; } }

.ld-word { display: flex; z-index: 4; margin-bottom: 14px; }
.ld-word span {
  font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: 15px; letter-spacing: 9px;
  color: #EDE3CB; opacity: 0; transform: translateY(4px); animation: ldLetterIn 0.6s ease forwards;
  text-transform: uppercase;
}
@keyframes ldLetterIn { to { opacity: 1; transform: translateY(0); } }

.ld-message {
  font-family: 'Fraunces', serif; font-weight: 340; font-style: italic; font-size: 14px; letter-spacing: 0.4px;
  color: rgba(237,227,203,0.7); z-index: 4; text-align: center; min-height: 20px; padding: 0 30px;
}

@media (max-width: 380px) {
  .ld-stage { width: 240px; height: 240px; }
}

@media (prefers-reduced-motion: reduce) {
  .ld-orbit, .ld-orbit-2, .ld-cline, .ld-ccore, .ld-core::after, .ld-mote, .ld-progress-sheen {
    animation: none !important;
  }
}
`;

/* ============================================
   Component
   ============================================ */

interface AppLoaderProps {
  isLoading: boolean;
  context?: 'horoscope' | 'tarot' | 'astro' | 'numerology' | 'profile' | 'default';
  message?: string;
}

const MESSAGES: Record<string, string[]> = {
  horoscope: ['Aligning your stars', 'Reading the currents', 'The sky is unfolding'],
  tarot: ['Shuffling the arcana', 'Drawing your card', 'The pattern is forming'],
  astro: ['Charting the sky', 'Mapping the transits', 'The orbs are moving'],
  numerology: ['Counting your numbers', 'Decoding the pattern'],
  profile: ['Gathering your essence', 'Reading your chart'],
  default: ['Aligning your stars', 'Reading the currents', 'The sky is unfolding'],
};

const NODES = [
  { cx: 90, cy: 70, r: 3, delay: 0 },
  { cx: 130, cy: 100, r: 2.4, delay: 0.5 },
  { cx: 150, cy: 150, r: 2.8, delay: 1 },
  { cx: 190, cy: 165, r: 2.2, delay: 1.5 },
  { cx: 210, cy: 130, r: 2.6, delay: 1.9 },
  { cx: 100, cy: 150, r: 2, delay: 1.2 },
];

export function AppLoader({ isLoading, context = 'default', message }: AppLoaderProps) {
  const messages = useMemo(() => (message ? [message] : MESSAGES[context] || MESSAGES.default), [message, context]);
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(8);
  const progressRef = useRef(8);

  // message cycling
  useEffect(() => {
    if (!isLoading || messages.length <= 1) return;
    setMsgIndex(0);
    const id = setInterval(() => setMsgIndex((p) => (p + 1) % messages.length), 3600);
    return () => clearInterval(id);
  }, [isLoading, messages]);

  // progress creep
  useEffect(() => {
    if (!isLoading) return;
    progressRef.current = 8;
    setProgress(8);
    const id = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + Math.random() * 4 + 1, 97);
      setProgress(progressRef.current);
    }, 260);
    return () => clearInterval(id);
  }, [isLoading]);

  // stable drifting motes
  const motes = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: +(0.6 + Math.random() * 1.1).toFixed(1),
        delay: +(Math.random() * 5).toFixed(2),
        dur: +(4 + Math.random() * 4).toFixed(2),
      })),
    []
  );

  const letters = 'LUNARA'.split('');

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <style>{loaderCSS}</style>

          <div className="ld-grain" />

          <div className="ld-field">
            {motes.map((m) => (
              <span
                key={m.id}
                className="ld-mote"
                style={{
                  left: `${m.left}%`,
                  top: `${m.top}%`,
                  width: `${m.size}px`,
                  height: `${m.size}px`,
                  animationDelay: `${m.delay}s`,
                  animationDuration: `${m.dur}s`,
                }}
              />
            ))}
          </div>

          <div className="ld-stage">
            <div className="ld-arc-motif">
              <svg viewBox="0 0 280 280">
                <path
                  d="M 46 96 A 120 120 0 1 1 46 184"
                  fill="none"
                  stroke="rgba(216,203,174,0.16)"
                  strokeWidth="0.7"
                />
              </svg>
            </div>

            <div className="ld-orbit-2" />
            <div className="ld-orbit" />

            <div className="ld-constellation">
              <svg viewBox="0 0 280 280">
                <path className="ld-cline" d="M 90 70 L 130 100 L 150 150 L 190 165 L 210 130" />
                <path className="ld-cline" d="M 130 100 L 100 150" style={{ animationDelay: '0.3s' }} />
                {NODES.map((n, i) => (
                  <circle
                    key={i}
                    className="ld-ccore"
                    cx={n.cx}
                    cy={n.cy}
                    r={n.r}
                    style={{ animationDelay: `${n.delay}s` }}
                  />
                ))}
              </svg>
            </div>

            <div className="ld-core" />
          </div>

          <div className="ld-word">
            {letters.map((ch, i) => (
              <span key={i} style={{ animationDelay: `${0.05 + i * 0.07}s` }}>
                {ch}
              </span>
            ))}
          </div>

          <div className="ld-progress-wrap">
            <div className="ld-progress-track">
              <div className="ld-progress-fill" style={{ width: `${progress}%` }} />
              <div className="ld-progress-sheen" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              className="ld-message"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              {messages[msgIndex]}
            </motion.p>
          </AnimatePresence>

          <div className="ld-vignette" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}