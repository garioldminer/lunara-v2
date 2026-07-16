import { useState } from 'react';
import { tarotCards, SUITS } from '../data/tarotCards';
import { ArrowLeft } from 'lucide-react';
import { trackQuestProgress } from '../lib/questService'; // 🆕 დამატებულია ქვესთების იმპორტი
import { useUser } from '../context/UserContext'; // 🆕 დამატებულია User კონტექსტი
import './CardsScreen.css';

type FilterType = 'all' | 'major' | 'minor';

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function CardsScreen({ onNavigate }: Props) {
  const { user } = useUser(); // 🆕
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCard, setSelectedCard] = useState(tarotCards[0]);

  // Filter cards
  const filteredCards = tarotCards.filter((card) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'major') return card.arcana === 'major';
    return card.arcana === 'minor';
  });

  const handleCardSelect = (card: typeof tarotCards[0]) => {
    setSelectedCard(card);
  };

  const handleViewCard = async () => { // 🆕 დამატებულია async
    if (onNavigate && selectedCard) {
      onNavigate(`card-detail-${selectedCard.id}`);
      
      // 🆕 ქვესთების ლოგიკა: განაახლე პროგრესი 'view_gallery' ქვესთისთვის
      if (user) {
        try {
          await trackQuestProgress(user.id, 'view_gallery', 1);
          console.log('✅ [Quest] view_gallery progress updated');
        } catch (error) {
          console.error('❌ [Quest] Error updating view gallery quest:', error);
        }
      }
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };

  // Helper function to get card metadata
  const getCardMeta = (card: typeof tarotCards[0]) => {
    if (card.arcana === 'major') {
      return 'Major Arcana';
    } else if (card.suit && SUITS[card.suit]) {
      return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    }
    return 'Minor Arcana';
  };

  return (
    <div className="cards-screen">
      {/* Elegant Header with Back Button */}
      <div className="cards-header">
        {onNavigate && (
          <button className="cards-back-btn" onClick={handleBack}>
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="header-ornament-top">✦ ─── ✦</div>
        <h1 className="cards-title">Tarot Cards</h1>
        <div className="header-ornament-bottom">✦ ─── ✦</div>
      </div>

      {/* Filter Tabs - Elegant */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          ALL
        </button>
        <button
          className={`filter-tab ${activeFilter === 'major' ? 'active' : ''}`}
          onClick={() => setActiveFilter('major')}
        >
          MAJOR ARCANA
        </button>
        <button
          className={`filter-tab ${activeFilter === 'minor' ? 'active' : ''}`}
          onClick={() => setActiveFilter('minor')}
        >
          MINOR ARCANA
        </button>
      </div>

      {/* Cards Grid - 5 Columns */}
      <div className="cards-grid">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className={`card-item ${selectedCard?.id === card.id ? 'selected' : ''}`}
            onClick={() => handleCardSelect(card)}
          >
            {card.image_url ? (
              <img 
                src={card.image_url} 
                alt={card.name}
                className="card-image"
                loading="lazy"
              />
            ) : (
              <div className="card-image-placeholder">
                <span className="placeholder-number">{card.number}</span>
                <span className="placeholder-text">{card.name}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Preview */}
      {selectedCard && (
        <div className="floating-preview">
          <div className="preview-card">
            <div className="preview-card-image">
              {selectedCard.image_url ? (
                <img 
                  src={selectedCard.image_url} 
                  alt={selectedCard.name}
                  className="preview-image"
                />
              ) : (
                <>
                  <span className="preview-number">{selectedCard.number}</span>
                  <div className="preview-placeholder">
                    <span>{selectedCard.name}</span>
                  </div>
                </>
              )}
            </div>
            <div className="preview-info">
              <h3>{selectedCard.name}</h3>
              <p className="preview-arcana">
                {getCardMeta(selectedCard)}
              </p>
              <p className="preview-meaning">{selectedCard.meaning}</p>
            </div>
          </div>
          <button className="view-card-btn" onClick={handleViewCard}>
            VIEW CARD
          </button>
        </div>
      )}
    </div>
  );
}