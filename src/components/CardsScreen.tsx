import { useState } from 'react';
import { tarotCards } from '../data/tarotCards';
import { Search, Filter } from 'lucide-react';
import './CardsScreen.css';

type FilterType = 'all' | 'major' | 'minor';

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function CardsScreen({ onNavigate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCard, setSelectedCard] = useState(tarotCards[0]); // The Fool as default

  // Filter cards
  const filteredCards = tarotCards.filter((card) => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'all'
        ? true
        : activeFilter === 'major'
        ? card.arcana === 'major'
        : card.arcana === 'minor';
    return matchesSearch && matchesFilter;
  });

  const handleCardSelect = (card: typeof tarotCards[0]) => {
    setSelectedCard(card);
  };

  const handleViewCard = () => {
    if (selectedCard && onNavigate) {
      onNavigate(`card-detail-${selectedCard.id}`);
    }
  };

  return (
    <div className="cards-screen">
      {/* Header */}
      <div className="cards-header">
        <h1 className="cards-title">TAROT CARDS</h1>
        <div className="header-ornament">✦ ─── ✦</div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <button className="filter-btn">
          <Filter size={18} />
        </button>
      </div>

      {/* Filter Tabs */}
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
            <div className="card-banner">
              <span className="card-number">{card.number}</span>
              <div className="card-image-container">
                {card.image_url ? (
                  <img 
                    src={card.image_url} 
                    alt={card.name}
                    className="card-image"
                    loading="lazy"
                  />
                ) : (
                  <div className="card-image-placeholder">
                    <span className="placeholder-text">CARD</span>
                  </div>
                )}
              </div>
              <span className="card-name" title={card.name}>{card.name}</span>
            </div>
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
                {selectedCard.arcana === 'major' ? 'Major Arcana' : selectedCard.suit}
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