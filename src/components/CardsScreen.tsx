import { useState } from 'react';
import { tarotCards, SUITS } from '../data/tarotCards';
import { X } from 'lucide-react';
import './CardsScreen.css';

type FilterType = 'all' | 'major' | 'minor';

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function CardsScreen({ onNavigate }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCard, setSelectedCard] = useState(tarotCards[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter cards
  const filteredCards = tarotCards.filter((card) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'major') return card.arcana === 'major';
    return card.arcana === 'minor';
  });

  const handleCardSelect = (card: typeof tarotCards[0]) => {
    setSelectedCard(card);
  };

  const handleViewCard = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
      {/* Elegant Header */}
      <div className="cards-header">
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

      {/* Card Detail Modal */}
      {isModalOpen && selectedCard && (
        <div className="card-modal-overlay" onClick={handleCloseModal}>
          <div className="card-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>
              <X size={20} />
            </button>
            
            <div className="modal-card-image">
              {selectedCard.image_url ? (
                <img 
                  src={selectedCard.image_url} 
                  alt={selectedCard.name}
                  className="modal-image"
                />
              ) : (
                <div className="modal-placeholder">
                  <span className="modal-number">{selectedCard.number}</span>
                  <span className="modal-name">{selectedCard.name}</span>
                </div>
              )}
            </div>

            <div className="modal-content">
              <h2 className="modal-title">{selectedCard.name}</h2>
              <p className="modal-meta">{getCardMeta(selectedCard)}</p>

              <div className="modal-meaning">
                <h3 className="modal-label">Meaning</h3>
                <p className="modal-text">{selectedCard.meaning}</p>
              </div>

              <div className="modal-keywords">
                <h3 className="modal-label">Keywords</h3>
                <div className="keywords-container">
                  {selectedCard.keywords.map((keyword: string, idx: number) => (
                    <span key={idx} className="keyword-tag">{keyword}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}