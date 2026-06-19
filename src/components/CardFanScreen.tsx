import { useEffect, useState, useRef } from 'react';
import { tarotCards, TarotCard, getRandomCard } from '../data/tarotCards';
import CardBack from './CardBack';
import './CardFanScreen.css';

interface Props {
  onBack?: () => void;
}

export default function CardFanScreen({ onBack }: Props) {
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [fanOffset, setFanOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const fanRef = useRef<HTMLDivElement>(null);

  // 7 შემთხვევითი ბარათი
  const [fanCards] = useState<TarotCard[]>(() => {
    const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 7);
  });

  useEffect(() => {
    console.log('🎴 CardFanScreen mounted');
  }, []);

  const handleCardTap = (card: TarotCard) => {
    if (selectedCard) return; // უკვე არჩეულია
    setSelectedCard(card);
    
    // 1 წამის შემდეგ გამოვლინდეს
    setTimeout(() => {
      setIsRevealed(true);
    }, 800);
  };

  const handleReset = () => {
    setSelectedCard(null);
    setIsRevealed(false);
  };

  // Drag functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    if (selectedCard) return;
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || selectedCard) return;
    const deltaX = e.touches[0].clientX - dragStartX;
    setFanOffset((prev) => prev + deltaX * 0.3);
    setDragStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Return to center smoothly
    setTimeout(() => {
      setFanOffset(0);
    }, 300);
  };

  // Mouse drag (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedCard) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || selectedCard) return;
    const deltaX = e.clientX - dragStartX;
    setFanOffset((prev) => prev + deltaX * 0.3);
    setDragStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => {
      setFanOffset(0);
    }, 300);
  };

  return (
    <div className="screen-container card-fan">
      {/* Background particles */}
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
          {selectedCard ? 'Your card has been chosen' : 'Tap to pick your card'}
        </p>
        <div className="ornament">✦</div>
      </div>

      {/* Cards Fan */}
      <div 
        className="cards-fan"
        ref={fanRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ transform: `translateX(${fanOffset}px)` }}
      >
        {fanCards.map((card, index) => {
          const totalCards = fanCards.length;
          const centerIndex = Math.floor(totalCards / 2);
          const offsetFromCenter = index - centerIndex;
          const rotation = offsetFromCenter * 12;
          const xPosition = offsetFromCenter * 70;
          const isCenter = index === centerIndex;
          const isSelected = selectedCard?.id === card.id;

          return (
            <div
              key={card.id}
              className={`card-in-fan ${isSelected ? 'selected' : ''} ${isCenter ? 'center-card' : ''}`}
              onClick={() => handleCardTap(card)}
              style={{
                '--rotation': `${rotation}deg`,
                '--x-position': `${xPosition}px`,
                '--z-index': isSelected ? 100 : isCenter ? 10 : 5 - Math.abs(offsetFromCenter),
              } as React.CSSProperties}
            >
              <CardBack />
            </div>
          );
        })}
      </div>

      {/* Drag hint */}
      {!selectedCard && (
        <div className="drag-hint">
          <svg width="120" height="30" viewBox="0 0 120 30">
            <path 
              d="M 10 15 Q 60 5 110 15" 
              stroke="#c87800" 
              strokeWidth="1.5" 
              fill="none"
              opacity="0.6"
            />
            <polygon 
              points="105,12 110,15 105,18" 
              fill="#c87800" 
              opacity="0.6"
            />
          </svg>
          <span className="drag-text">Drag to move</span>
        </div>
      )}

      {/* Card Reveal Modal */}
      {selectedCard && isRevealed && (
        <div className="reveal-overlay" onClick={handleReset}>
          <div className="reveal-content" onClick={(e) => e.stopPropagation()}>
            <button className="reveal-close" onClick={handleReset}>✕</button>
            
            <div className="reveal-card">
              <div className="reveal-symbol">{selectedCard.astrologicalSymbol || ''}</div>
              <div className="reveal-number">{selectedCard.number}</div>
            </div>

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
              DRAW AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}