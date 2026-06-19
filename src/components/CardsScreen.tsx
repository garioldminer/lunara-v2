import { useEffect, useState } from 'react';
import { tarotCards, TarotCard } from '../data/tarotCards';
import './CardsScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function CardsScreen({ onNavigate }: Props) {
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [filter, setFilter] = useState<'all' | 'major' | 'minor'>('all');

  useEffect(() => {
    console.log('🃏 CardsScreen mounted');
  }, []);

  const filteredCards = tarotCards.filter(card => {
    if (filter === 'all') return true;
    return card.arcana === filter;
  });

  const handleCardClick = (card: TarotCard) => {
    console.log(`Card clicked: ${card.name}`);
    setSelectedCard(card);
  };

  const handleCloseModal = () => {
    setSelectedCard(null);
  };

  return (
    <div className="screen-container cards">
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
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

      <div className="content-scroll">
        <div className="header-section">
          <h1 className="page-title">✦ TAROT COLLECTION ✦</h1>
          <p className="page-subtitle">{tarotCards.length} cards of ancient wisdom</p>
        </div>

        {/* Search & Filter */}
        <div className="search-filter">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search cards..." className="search-input" />
          </div>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({tarotCards.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'major' ? 'active' : ''}`}
              onClick={() => setFilter('major')}
            >
              Major (22)
            </button>
            <button 
              className={`filter-btn ${filter === 'minor' ? 'active' : ''}`}
              onClick={() => setFilter('minor')}
            >
              Minor
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="cards-grid">
          {filteredCards.map((card) => (
            <div 
              key={card.id} 
              className="card-item"
              onClick={() => handleCardClick(card)}
            >
              <div className="card-thumb">{card.symbol}</div>
              <div className="card-number">{card.number}</div>
              <div className="card-name">{card.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>✕</button>
            
            <div className="modal-header">
              <div className="modal-symbol">{selectedCard.symbol}</div>
              <h2 className="modal-title">{selectedCard.name}</h2>
              <p className="modal-number">{selectedCard.number}</p>
              <p className="modal-meta">
                {selectedCard.zodiac} · {selectedCard.element}
              </p>
            </div>

            <div className="modal-body">
              <div className="meaning-section">
                <h3 className="section-title">Upright Meaning</h3>
                <p className="meaning-text">{selectedCard.meaning.upright}</p>
                <div className="keywords">
                  {selectedCard.keywords.upright.map((keyword, idx) => (
                    <span key={idx} className="keyword-tag">{keyword}</span>
                  ))}
                </div>
              </div>

              <div className="meaning-section">
                <h3 className="section-title">Reversed Meaning</h3>
                <p className="meaning-text">{selectedCard.meaning.reversed}</p>
                <div className="keywords">
                  {selectedCard.keywords.reversed.map((keyword, idx) => (
                    <span key={idx} className="keyword-tag reversed">{keyword}</span>
                  ))}
                </div>
              </div>
            </div>

            <button className="modal-cta">ADD TO COLLECTION</button>
          </div>
        </div>
      )}
    </div>
  );
}