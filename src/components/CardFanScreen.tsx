import { useEffect, useState } from 'react';
import { tarotCards, TarotCard } from '../data/tarotCards';
import './CardFanScreen.css';

interface Props {
  onBack?: () => void;
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

export default function CardFanScreen({ onBack }: Props) {
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationOffset, setRotationOffset] = useState(0);
  
  // 12 ბარათი წრეზე (მეტი ბარათი = უკეთესი ეფექტი)
  const [wheelCards] = useState<TarotCard[]>(() => {
    const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 12);
  });

  useEffect(() => {
    console.log('🎴 CardFanScreen mounted!');
    const timer = setTimeout(() => {
      startSpin();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const startSpin = () => {
    console.log(' Starting spin...');
    setIsSpinning(true);
    setSelectedCard(null);
    setIsRevealed(false);
    setRotationOffset(0);

    // 5-8 სრული ბრუნვა + რენდომული გაჩერება
    const randomRotations = 5 + Math.random() * 3;
    const randomStop = Math.random() * 360;
    const totalRotation = (randomRotations * 360) + randomStop;
    
    const duration = 4000; // 4 წამი
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentRotation = totalRotation * eased;
      setRotationOffset(currentRotation);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log('✨ Spin finished!');
        setIsSpinning(false);
        
        // რენდომული ბარათის არჩევა
        const randomIndex = Math.floor(Math.random() * wheelCards.length);
        setSelectedCard(wheelCards[randomIndex]);
        console.log('🎴 Selected card:', wheelCards[randomIndex].name);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const handleCardTap = () => {
    if (!selectedCard || isRevealed) return;
    console.log('👆 Card tapped - revealing!');
    setIsRevealed(true);
  };

  const handleReset = () => {
    console.log('🔄 Resetting...');
    setSelectedCard(null);
    setIsRevealed(false);
    setTimeout(() => {
      startSpin();
    }, 500);
  };

  // წრის პარამეტრები
  const wheelRadius = 280; // რადიუსი
  const wheelCenterY = 350; // ცენტრი Y (ეკრანის ქვემოთ)
  const wheelCenterX = 200; // ცენტრი X (შუაში)

  return (
    <div className="screen-container card-fan">
      {/* Particles */}
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

      {/* Header */}
      <div className="fan-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>←</button>
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

      {/* Instruction */}
      <div className="instruction">
        <p className="instruction-text">
          {isSpinning ? 'Cards are spinning...' : 
           selectedCard && !isRevealed ? 'Tap to pick your card' : 
           isRevealed ? 'Your card has been revealed' : 'Get ready...'}
        </p>
        <div className="ornament">✦</div>
      </div>

      {/* Wheel Container - ზედა ნახევარი ჩანს */}
      <div className="wheel-container">
        <div 
          className="wheel"
          style={{ 
            transform: `rotate(${rotationOffset}deg)`,
          }}
        >
          {wheelCards.map((card, index) => {
            const angle = (index / wheelCards.length) * 360;
            const angleRad = (angle * Math.PI) / 180;
            
            // ბარათის პოზიცია წრეზე
            const x = wheelCenterX + Math.sin(angleRad) * wheelRadius - 40; // 40 = ბარათის სიგანის ნახევარი
            const y = wheelCenterY - Math.cos(angleRad) * wheelRadius - 65; // 65 = ბარათის სიმაღლის ნახევარი
            
            // ბარათი უნდა იყოს წრის ტანგენსის მიმართულებით
            const cardRotation = angle + 90;

            return (
              <div
                key={card.id}
                className="card-on-wheel"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: `rotate(${cardRotation}deg)`,
                }}
              >
                <CardBack />
              </div>
            );
          })}
        </div>
      </div>

      {/* Drag hint */}
      {!selectedCard && !isSpinning && (
        <div className="drag-hint">
          <svg width="120" height="30" viewBox="0 0 120 30">
            <path d="M 10 15 Q 60 5 110 15" stroke="#c87800" strokeWidth="1.5" fill="none" opacity="0.6"/>
            <polygon points="105,12 110,15 105,18" fill="#c87800" opacity="0.6"/>
          </svg>
          <span className="drag-text">Drag to move</span>
        </div>
      )}

      {/* Selected Card (rises to top center) */}
      {selectedCard && !isSpinning && (
        <div 
          className={`selected-card ${isRevealed ? 'revealed' : ''}`}
          onClick={handleCardTap}
        >
          {!isRevealed ? (
            <CardBack />
          ) : (
            <div className="card-front">
              <div className="card-symbol">{selectedCard.astrologicalSymbol || '✦'}</div>
              <div className="card-number">{selectedCard.number}</div>
            </div>
          )}
        </div>
      )}

      {/* Spin Button */}
      {!isSpinning && !selectedCard && (
        <button className="spin-btn" onClick={startSpin}>
          SPIN
        </button>
      )}

      {/* Reveal Modal */}
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
              SPIN AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}