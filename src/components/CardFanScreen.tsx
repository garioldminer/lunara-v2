import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { tarotCards, TarotCard, SUITS, CARD_BACK_URL } from '../data/tarotCards';
import './CardFanScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

function CardBack() {
  return (
    <img 
      src={CARD_BACK_URL} 
      alt="Card Back"
      className="card-back-image"
      draggable={false}
    />
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

  // Helper function to get card metadata
  const getCardMeta = (card: TarotCard) => {
    if (card.arcana === 'major') {
      return 'Major Arcana';
    } else if (card.suit && SUITS[card.suit]) {
      return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    }
    return 'Minor Arcana';
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
            
            <div className="reveal-card-image">
              {selectedCard.image_url ? (
                <img 
                  src={selectedCard.image_url} 
                  alt={selectedCard.name}
                  className="reveal-image"
                />
              ) : (
                <div className="reveal-placeholder">
                  <span className="reveal-number">{selectedCard.number}</span>
                  <span className="reveal-name">{selectedCard.name}</span>
                </div>
              )}
            </div>
            
            <h2 className="reveal-title">{selectedCard.name}</h2>
            <p className="reveal-meta">
              {getCardMeta(selectedCard)}
            </p>

            <div className="reveal-meaning">
              <h3 className="meaning-label">Meaning</h3>
              <p className="meaning-text">{selectedCard.meaning}</p>
            </div>

            <div className="reveal-keywords">
              {selectedCard.keywords.map((keyword: string, idx: number) => (
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