import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { tarotCards, TarotCard } from '../data/tarotCards';
import './CardFanScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

function CardBack() {
  return (
    <svg viewBox="0 0 100 160" className="card-svg">
      <rect width="100" height="160" fill="#1a0f05" rx="6"/>
      <rect x="3" y="3" width="94" height="154" stroke="#c87800" strokeWidth="1.5" fill="none" rx="5"/>
      <rect x="7" y="7" width="86" height="146" stroke="#ffe566" strokeWidth="0.5" fill="none" opacity="0.4" rx="4"/>
      
      <circle cx="50" cy="35" r="11" fill="#ffe566" opacity="0.9"/>
      <circle cx="50" cy="35" r="9" fill="#1a0f05" opacity="0.2"/>
      <circle cx="50" cy="65" r="11" fill="#1a0f05" stroke="#ffe566" strokeWidth="1.5" opacity="0.8"/>
      <path d="M 50 54 A 11 11 0 0 1 50 76" fill="#ffe566" opacity="0.8"/>
      <circle cx="50" cy="95" r="11" fill="#1a0f05" stroke="#ffe566" strokeWidth="1.5" opacity="0.7"/>
      <path d="M 47 84 A 9 9 0 0 1 47 106" fill="#ffe566" opacity="0.7"/>
      <circle cx="50" cy="125" r="11" fill="#ffe566" opacity="0.5"/>
      <circle cx="50" cy="125" r="9" fill="#1a0f05" opacity="0.5"/>
      
      <circle cx="25" cy="50" r="1.5" fill="#ffe566" opacity="0.7"/>
      <circle cx="75" cy="50" r="1.5" fill="#ffe566" opacity="0.7"/>
      <circle cx="25" cy="110" r="1.5" fill="#ffe566" opacity="0.7"/>
      <circle cx="75" cy="110" r="1.5" fill="#ffe566" opacity="0.7"/>
      
      <path d="M 10 10 L 18 10 L 10 18 Z" fill="#c87800" opacity="0.8"/>
      <path d="M 90 10 L 82 10 L 90 18 Z" fill="#c87800" opacity="0.8"/>
      <path d="M 10 150 L 18 150 L 10 142 Z" fill="#c87800" opacity="0.8"/>
      <path d="M 90 150 L 82 150 L 90 142 Z" fill="#c87800" opacity="0.8"/>
      
      <ellipse cx="50" cy="80" rx="8" ry="5" fill="none" stroke="#ffe566" strokeWidth="1" opacity="0.6"/>
      <circle cx="50" cy="80" r="2.5" fill="#ffe566" opacity="0.6"/>
    </svg>
  );
}

export default function CardFanScreen({ onNavigate }: Props) {
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  
  const [spinCards] = useState<TarotCard[]>(() => {
    const cards = [];
    for (let i = 0; i < 60; i++) {
      const randomCard = tarotCards[Math.floor(Math.random() * tarotCards.length)];
      cards.push(randomCard);
    }
    return cards;
  });

  const xPosition = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 80 };
  const smoothX = useSpring(xPosition, springConfig);

  useEffect(() => {
    console.log('🎴 CardFanScreen mounted!');
    const timer = setTimeout(() => {
      startSpin();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const startSpin = () => {
    console.log('🌀 Starting spin...');
    setIsSpinning(true);
    setSelectedCard(null);
    setIsRevealed(false);

    const cardWidth = 100;
    const stopAtCard = 40 + Math.floor(Math.random() * 10);
    const randomOffset = Math.random() * 80;
    const totalDistance = (stopAtCard * cardWidth) + randomOffset;
    
    xPosition.set(-totalDistance);
    
    setTimeout(() => {
      console.log('✨ Spin finished!');
      setIsSpinning(false);
      setSelectedCard(spinCards[stopAtCard]);
      console.log('🎴 Selected card:', spinCards[stopAtCard].name);
    }, 4000);
  };

  const handleReset = () => {
    console.log('🔄 Resetting...');
    setSelectedCard(null);
    setIsRevealed(false);
    xPosition.set(0);
    setTimeout(() => {
      startSpin();
    }, 500);
  };

  return (
    <div className="screen-container card-fan">
      <div className="particles-container">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
              width: `${2 + Math.random() * 2}px`,
              height: `${2 + Math.random() * 2}px`,
            }}
          />
        ))}
      </div>

      <div className="fan-header">
        {onNavigate && (
          <button className="back-btn" onClick={() => onNavigate('home')}>←</button>
        )}
        <div className="date">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
        <h1 className="fan-title">Tarot Reader</h1>
      </div>

      <div className="instruction">
        <p className="instruction-text">
          {isSpinning ? 'Cards are spinning...' : 
           selectedCard && !isRevealed ? 'Tap to reveal your card' : 
           isRevealed ? 'Your card has been revealed' : 'Get ready...'}
        </p>
        <div className="ornament">✦</div>
      </div>

      <div className="case-opening-container">
        <div className="pointer-line"></div>
        <div className="pointer-arrow">▼</div>
        
        <div className="spinner-viewport">
          <motion.div
            className="spinner-track"
            style={{
              x: smoothX,
            }}
          >
            {spinCards.map((card, index) => (
              <div
                key={`${card.id}-${index}`}
                className="card-in-track"
              >
                <CardBack />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {selectedCard && !isSpinning && !isRevealed && (
        <div className="selected-card-hint">
          <p>Tap to reveal</p>
        </div>
      )}

      {!isSpinning && !selectedCard && (
        <button className="spin-btn" onClick={startSpin}>
          OPEN CASE
        </button>
      )}

      {isRevealed && selectedCard && (
        <div className="reveal-overlay" onClick={handleReset}>
          <div className="reveal-content" onClick={(e) => e.stopPropagation()}>
            <button className="reveal-close" onClick={handleReset}>✕</button>
            
            <h2 className="reveal-title">{selectedCard.name}</h2>
            <p className="reveal-meta">
              {selectedCard.zodiac} · {selectedCard.element}
            </p>

            <div className="reveal-meaning">
              <h3 className="meaning-label">Upright Meaning</h3>
              <p className="meaning-text">{selectedCard.meaning.upright}</p>
            </div>

            <div className="reveal-keywords">
              {selectedCard.keywords.upright.map((keyword, idx) => (
                <span key={idx} className="keyword-tag">{keyword}</span>
              ))}
            </div>

            <button className="reveal-cta" onClick={handleReset}>
              OPEN ANOTHER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}