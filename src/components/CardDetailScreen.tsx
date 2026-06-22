import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { tarotCards, SUITS } from '../data/tarotCards';
import './CardDetailScreen.css';

interface Props {
  cardId: number;
  onNavigate?: (screen: string) => void;
}

export default function CardDetailScreen({ cardId, onNavigate }: Props) {
  const card = tarotCards.find(c => c.id === cardId);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!card) {
    return (
      <div className="card-detail-screen">
        <div className="error-message">
          <p>Card not found</p>
          <button onClick={() => onNavigate?.('cards')}>Back to Cards</button>
        </div>
      </div>
    );
  }

  const getCardMeta = () => {
    if (card.arcana === 'major') return 'Major Arcana';
    if (card.suit && SUITS[card.suit]) {
      return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    }
    return 'Minor Arcana';
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('cards');
    }
  };

  return (
    <div className={`card-detail-screen ${isLoaded ? 'loaded' : ''}`}>
      {/* Header with Back Button */}
      <div className="detail-header">
        <button className="detail-back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="detail-header-ornament">✦</div>
      </div>

      {/* Card Image */}
      <div className="detail-card-image-container">
        {card.image_url ? (
          <img 
            src={card.image_url} 
            alt={card.name}
            className="detail-card-image"
          />
        ) : (
          <div className="detail-card-placeholder">
            <span className="detail-placeholder-number">{card.number}</span>
            <span className="detail-placeholder-name">{card.name}</span>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="detail-card-info">
        <div className="detail-card-number">{card.number}</div>
        <h1 className="detail-card-title">{card.name}</h1>
        <p className="detail-card-meta">{getCardMeta()}</p>

        <div className="detail-ornament">✦ ─── ✦</div>

        {/* Meaning Section */}
        <div className="detail-section">
          <h2 className="detail-section-title">Meaning</h2>
          <p className="detail-section-text">{card.meaning}</p>
        </div>

        {/* Reversed Meaning Section */}
        <div className="detail-section">
          <h2 className="detail-section-title">Reversed Meaning</h2>
          <p className="detail-section-text">{card.reversed_meaning}</p>
        </div>

        {/* Keywords Section */}
        <div className="detail-section">
          <h2 className="detail-section-title">Keywords</h2>
          <div className="detail-keywords">
            {card.keywords.map((keyword: string, idx: number) => (
              <span key={idx} className="detail-keyword-tag">{keyword}</span>
            ))}
          </div>
        </div>

        {/* Reversed Keywords Section */}
        <div className="detail-section">
          <h2 className="detail-section-title">Reversed Keywords</h2>
          <div className="detail-keywords">
            {card.reversed_keywords.map((keyword: string, idx: number) => (
              <span key={idx} className="detail-keyword-tag reversed">{keyword}</span>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="detail-section">
          <h2 className="detail-section-title">Card Details</h2>
          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-info-label">Arcana</span>
              <span className="detail-info-value">{card.arcana === 'major' ? 'Major' : 'Minor'}</span>
            </div>
            {card.suit && (
              <div className="detail-info-item">
                <span className="detail-info-label">Suit</span>
                <span className="detail-info-value">{SUITS[card.suit]?.name || card.suit}</span>
              </div>
            )}
            {card.suit && (
              <div className="detail-info-item">
                <span className="detail-info-label">Element</span>
                <span className="detail-info-value">{SUITS[card.suit]?.element || '-'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}