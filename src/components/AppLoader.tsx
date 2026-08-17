import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ============================================
   🌀 LUNARA — "THE CELESTIAL MANDALA" LOADER
   ერთიანი ბრენდირებული ლოადინგ კომპონენტი
   (CSS ჩაშენებულია — ცალკე ფაილი არ გჭირდება)
   ============================================ */

const loaderCSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');

.app-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: radial-gradient(ellipse at 50% 42%, #17103a 0%, #0a0600 78%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'Cormorant Garamond', serif;
}

/* ---------- ფონი: ნისლეულები ---------- */
.al-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }

.al-nebula { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.45; }

.al-nebula-1 {
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(147, 51, 234, 0.5), transparent 70%);
  top: -120px; right: -90px;
  animation: alNebula1 9s ease-in-out infinite alternate;
}
.al-nebula-2 {
  width: 360px; height: 360px;
  background: radial-gradient(circle, rgba(217, 182, 111, 0.28), transparent 70%);
  bottom: -100px; left: -70px;
  animation: alNebula2 11s ease-in-out infinite alternate;
}
.al-nebula-3 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.22), transparent 70%);
  top: 45%; left: 55%;
  animation: alNebula3 13s ease-in-out infinite alternate;
}

@keyframes alNebula1 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-25px,20px) scale(1.12); } }
@keyframes alNebula2 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(25px,-18px) scale(1.15); } }
@keyframes alNebula3 { 0% { transform: translate(-50%,-50%) scale(1); opacity: .3; } 100% { transform: translate(-45%,-55%) scale(1.2); opacity: .5; } }

/* ---------- ვარსკვლავები ---------- */
.al-stars { position: absolute; inset: 0; pointer-events: none; }

.al-star {
  position: absolute;
  color: #D9B66F;
  filter: drop-shadow(0 0 4px rgba(217, 182, 111, 0.8));
  animation: alStarTwinkle ease-in-out infinite;
  line-height: 1;
}

@keyframes alStarTwinkle {
  0%, 100% { opacity: 0.15; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.25); }
}

/* ---------- ფონზე ტაროს ბარათები ---------- */
.al-tarot {
  position: absolute;
  width: 92px; height: 148px;
  border-radius: 10px;
  border: 2px solid rgba(217, 182, 111, 0.45);
  background:
    repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(217, 182, 111, 0.06) 8px, rgba(217, 182, 111, 0.06) 16px),
    linear-gradient(160deg, #1c1240 0%, #120a2a 100%);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), inset 0 0 18px rgba(217, 182, 111, 0.12);
  display: flex; align-items: center; justify-content: center;
  filter: blur(1.6px);
  opacity: 0.55;
  pointer-events: none;
}

.al-tarot-inner {
  font-size: 34px;
  color: rgba(217, 182, 111, 0.8);
  text-shadow: 0 0 14px rgba(217, 182, 111, 0.7);
}

.al-tarot-left {
  left: 7%; top: 14%;
  transform: rotate(-14deg);
  animation: alTarotFloatL 10s ease-in-out infinite alternate;
}
.al-tarot-right {
  right: 7%; top: 12%;
  transform: rotate(13deg);
  animation: alTarotFloatR 12s ease-in-out infinite alternate;
}

@keyframes alTarotFloatL {
  0% { transform: rotate(-14deg) translate(0, 0); }
  100% { transform: rotate(-10deg) translate(8px, 14px); }
}
@keyframes alTarotFloatR {
  0% { transform: rotate(13deg) translate(0, 0); }
  100% { transform: rotate(9deg) translate(-8px, 12px); }
}

/* ---------- მანდალა ---------- */
.al-mandala {
  position: relative;
  width: 320px; height: 320px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 26px;
}

/* პროგრეს-რკალი */
.al-ring-svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }

.al-ring-track {
  fill: none;
  stroke: rgba(217, 182, 111, 0.14);
  stroke-width: 2.5;
}
.al-ring-arc {
  fill: none;
  stroke: #D9B66F;
  stroke-width: 3;
  stroke-linecap: round;
  filter: drop-shadow(0 0 6px rgba(217, 182, 111, 0.8));
  transition: stroke-dashoffset 0.25s ease-out;
}

/* ნათელი წერტილი რკალის თავზე */
.al-ring-tip {
  position: absolute; inset: 0;
  display: flex; justify-content: center;
  pointer-events: none;
  transition: transform 0.25s ease-out;
}
.al-ring-tip span {
  width: 10px; height: 10px;
  margin-top: -1px;
  border-radius: 50%;
  background: #F4D47C;
  box-shadow: 0 0 14px 4px rgba(244, 212, 124, 0.85);
}

/* ბორბალი — ნელა ბრუნავს */
.al-wheel {
  position: absolute;
  inset: 14px;
  animation: alSpin 80s linear infinite;
}

/* პლანეტების ორბიტა — საპირისპიროდ */
.al-planets { position: absolute; inset: 0; animation: alSpinRev 45s linear infinite; }

@keyframes alSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes alSpinRev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }

/* ბორბლის რგოლები */
.al-wheel-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(217, 182, 111, 0.5);
  box-shadow: 0 0 12px rgba(217, 182, 111, 0.25), inset 0 0 12px rgba(217, 182, 111, 0.15);
}
.al-wheel-outer { inset: 0; }
.al-wheel-mid { inset: 34px; border-color: rgba(217, 182, 111, 0.4); }
.al-wheel-inner { inset: 66px; border-color: rgba(217, 182, 111, 0.45); }

/* სპიკები — სახელები / სიმბოლოები / პლანეტები წრიულად */
.al-spoke {
  position: absolute; inset: 0;
  display: flex; justify-content: center;
  pointer-events: none;
}
.al-spoke > span { display: block; line-height: 1; }

.al-spoke-name > span {
  transform: translateY(-146px);
  font-family: 'Cinzel', serif;
  font-size: 9px; font-weight: 600;
  letter-spacing: 1.5px;
  color: rgba(247, 243, 235, 0.75);
}

.al-spoke-symbol > span {
  transform: translateY(-108px);
  font-size: 17px;
  color: #D9B66F;
  text-shadow: 0 0 8px rgba(217, 182, 111, 0.7);
  animation: alSymbolGlow 3s ease-in-out infinite;
}

.al-spoke-planet > span {
  transform: translateY(-78px);
  font-size: 15px;
  filter: drop-shadow(0 0 6px rgba(217, 182, 111, 0.5));
}

@keyframes alSymbolGlow {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* ცენტრი — მთვარე + რიცხვი */
.al-center {
  position: absolute;
  width: 118px; height: 118px;
  border-radius: 50%;
  border: 2px solid rgba(217, 182, 111, 0.65);
  background: radial-gradient(circle at 40% 35%, #241650 0%, #120a2a 70%);
  box-shadow: 0 0 26px rgba(217, 182, 111, 0.45), inset 0 0 22px rgba(217, 182, 111, 0.18);
  display: flex; align-items: center; justify-content: center;
  gap: 6px;
  animation: alCenterPulse 2.6s ease-in-out infinite;
}

@keyframes alCenterPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(217, 182, 111, 0.35), inset 0 0 18px rgba(217, 182, 111, 0.14); }
  50% { box-shadow: 0 0 34px rgba(217, 182, 111, 0.6), inset 0 0 26px rgba(217, 182, 111, 0.24); }
}

.al-center-moon {
  font-size: 44px;
  color: #F4D47C;
  text-shadow: 0 0 18px rgba(244, 212, 124, 0.9);
  line-height: 1;
}

.al-center-number {
  font-family: 'Cinzel', serif;
  font-size: 26px; font-weight: 700;
  color: #D9B66F;
  text-shadow: 0 0 12px rgba(217, 182, 111, 0.8);
  line-height: 1;
}

/* ---------- ქვედა ნაწილი ---------- */
.al-bottom {
  position: absolute;
  left: 0; right: 0;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 22px);
  display: flex; flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 2;
}

.al-message {
  margin: 0;
  min-height: 22px;
  font-size: 17px;
  font-style: italic;
  color: #F7F3EB;
  letter-spacing: 0.5px;
  text-align: center;
  padding: 0 20px;
}

.al-dots { display: flex; gap: 6px; }
.al-dots span {
  width: 6px; height: 6px; border-radius: 50%;
  background: #D9B66F;
  box-shadow: 0 0 8px rgba(217, 182, 111, 0.7);
  animation: alDotPulse 1.2s ease-in-out infinite;
}
@keyframes alDotPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.al-brand {
  font-family: 'Cinzel', serif;
  font-size: 11px; font-weight: 700;
  letter-spacing: 3px;
  color: rgba(217, 182, 111, 0.75);
  text-shadow: 0 0 10px rgba(217, 182, 111, 0.5);
}

/* ---------- Responsive ---------- */
@media (max-width: 480px) {
  .al-mandala { width: 270px; height: 270px; margin-bottom: 20px; }
  .al-spoke-name > span { transform: translateY(-122px); font-size: 8px; }
  .al-spoke-symbol > span { transform: translateY(-90px); font-size: 15px; }
  .al-spoke-planet > span { transform: translateY(-64px); font-size: 13px; }
  .al-wheel-mid { inset: 28px; }
  .al-wheel-inner { inset: 55px; }
  .al-center { width: 100px; height: 100px; }
  .al-center-moon { font-size: 36px; }
  .al-center-number { font-size: 22px; }
  .al-tarot { width: 74px; height: 120px; }
  .al-tarot-inner { font-size: 26px; }
  .al-tarot-left { left: 4%; top: 12%; }
  .al-tarot-right { right: 4%; top: 10%; }
  .al-message { font-size: 15px; }
  .al-brand { font-size: 10px; }
}
`;

/* ============================================
   კომპონენტი
   ============================================ */

interface AppLoaderProps {
  isLoading: boolean;
  context?: 'horoscope' | 'tarot' | 'astro' | 'numerology' | 'profile' | 'default';
}

const ZODIAC_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const ZODIAC_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const PLANETS = ['🌞', '🌙', '☿', '♀', '♂', '♃', '♄', '🪐'];
const LUCKY_NUMBERS = [3, 7, 11, 22, 33];

const MESSAGES: Record<string, string[]> = {
  horoscope: ['Aligning your stars...', 'Reading the cosmic currents...', 'The universe is speaking...'],
  tarot: ['Shuffling the cards...', 'Drawing your destiny...', 'The arcana awaken...'],
  astro: ['Charting the planets...', 'Mapping your sky...', 'The orbs are moving...'],
  numerology: ['Counting your numbers...', 'Decoding your vibrations...', 'The digits align...'],
  profile: ['Gathering your essence...', 'Reading your aura...'],
  default: ['Aligning your stars...', 'Shuffling the cards...', 'Charting the planets...', 'Counting your numbers...'],
};

const RING_R = 156;
const RING_CIRC = 2 * Math.PI * RING_R;

export function AppLoader({ isLoading, context = 'default' }: AppLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [numIndex, setNumIndex] = useState(1); // 7-დან იწყებს
  const [progress, setProgress] = useState(0);

  const messages = MESSAGES[context] || MESSAGES.default;

  // ✅ ციკლური ანიმაციები — ტექსტი, რიცხვი, პროგრესი
  useEffect(() => {
    if (!isLoading) return;
    setProgress(0);
    setMsgIndex(0);
    const msgInt = setInterval(() => setMsgIndex((p) => (p + 1) % messages.length), 1600);
    const numInt = setInterval(() => setNumIndex((p) => (p + 1) % LUCKY_NUMBERS.length), 1400);
    const progInt = setInterval(() => {
      setProgress((p) => (p >= 96 ? p : p + Math.random() * 5 + 2));
    }, 180);
    return () => { clearInterval(msgInt); clearInterval(numInt); clearInterval(progInt); };
  }, [isLoading, messages.length]);

  // ✅ ვარსკვლავები — სტაბილური პოზიციები (არ გადახტება re-render-ზე)
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        dur: 2 + Math.random() * 3,
        size: 5 + Math.random() * 9,
      })),
    []
  );

  const clamped = Math.min(progress, 100);
  const ringAngle = clamped * 3.6;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="app-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        >
          {/* ✅ ჩაშენებული სტილები */}
          <style>{loaderCSS}</style>

          {/* 🌌 ფონი — ნისლეულები */}
          <div className="al-bg">
            <div className="al-nebula al-nebula-1" />
            <div className="al-nebula al-nebula-2" />
            <div className="al-nebula al-nebula-3" />
          </div>

          {/* ✨ ვარსკვლავები */}
          <div className="al-stars">
            {stars.map((s) => (
              <span
                key={s.id}
                className="al-star"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  animationDelay: `${s.delay}s`,
                  animationDuration: `${s.dur}s`,
                  fontSize: `${s.size}px`,
                }}
              >
                ✦
              </span>
            ))}
          </div>

          {/* 🃏 ფონზე ტაროს ბარათები — ბუნდოვანი, მოცურავე */}
          <div className="al-tarot al-tarot-left">
            <div className="al-tarot-inner">✦</div>
          </div>
          <div className="al-tarot al-tarot-right">
            <div className="al-tarot-inner">☽</div>
          </div>

          {/* 🌀 მანდალა */}
          <div className="al-mandala">
            {/* 💫 პროგრეს-რკალი */}
            <svg className="al-ring-svg" viewBox="0 0 320 320">
              <circle className="al-ring-track" cx="160" cy="160" r={RING_R} />
              <circle
                className="al-ring-arc"
                cx="160"
                cy="160"
                r={RING_R}
                strokeDasharray={RING_CIRC}
                strokeDashoffset={RING_CIRC * (1 - clamped / 100)}
              />
            </svg>
            {/* ნათელი წერტილი რკალის თავზე */}
            <div className="al-ring-tip" style={{ transform: `rotate(${ringAngle}deg)` }}>
              <span />
            </div>

            {/* 🎡 ბორბალი — სახელები + სიმბოლოები (ნელა ბრუნავს) */}
            <div className="al-wheel">
              <div className="al-wheel-ring al-wheel-outer" />
              <div className="al-wheel-ring al-wheel-mid" />
              <div className="al-wheel-ring al-wheel-inner" />

              {ZODIAC_NAMES.map((name, i) => (
                <div key={name} className="al-spoke al-spoke-name" style={{ transform: `rotate(${i * 30 + 15}deg)` }}>
                  <span>{name}</span>
                </div>
              ))}

              {ZODIAC_SYMBOLS.map((sym, i) => (
                <div key={sym} className="al-spoke al-spoke-symbol" style={{ transform: `rotate(${i * 30}deg)` }}>
                  <span>{sym}</span>
                </div>
              ))}

              {/* 🪐 პლანეტები — საპირისპიროდ ბრუნავს */}
              <div className="al-planets">
                {PLANETS.map((p, i) => (
                  <div key={i} className="al-spoke al-spoke-planet" style={{ transform: `rotate(${i * 45}deg)` }}>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ☽ ცენტრი — მთვარე + ბედის რიცხვი */}
            <div className="al-center">
              <span className="al-center-moon">☽</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={LUCKY_NUMBERS[numIndex]}
                  className="al-center-number"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  {LUCKY_NUMBERS[numIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* 💬 ქვედა ნაწილი — ტექსტი + ბრენდი */}
          <div className="al-bottom">
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                className="al-message"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                {messages[msgIndex]}
              </motion.p>
            </AnimatePresence>
            <div className="al-dots">
              <span style={{ animationDelay: '0s' }} />
              <span style={{ animationDelay: '0.2s' }} />
              <span style={{ animationDelay: '0.4s' }} />
            </div>
            <div className="al-brand">✦ LUNARA ✦</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}