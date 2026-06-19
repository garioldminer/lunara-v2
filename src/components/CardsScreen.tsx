import { useEffect } from 'react';
import './CardsScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function CardsScreen({ onNavigate }: Props) {
  useEffect(() => {
    console.log('🃏 CardsScreen mounted');
    console.log('onNavigate available:', !!onNavigate);
  }, [onNavigate]);

  const handleCardClick = (cardIndex: number) => {
    console.log(`Card clicked: ${cardIndex}`);
    // მომავალში: onNavigate && onNavigate('card-detail');
  };

  return (
    <div className="screen-container cards">
      {/* ნაწილაკები */}
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

      {/* Content */}
      <div className="content-scroll">
        <div className="header-section">
          <h1 className="page-title">✦ TAROT COLLECTION ✦</h1>
          <p className="page-subtitle">78 cards of ancient wisdom</p>
        </div>

        {/* Search & Filter */}
        <div className="search-filter">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search cards..." className="search-input" />
          </div>
          <div className="filter-buttons">
            <button className="filter-btn active">All</button>
            <button className="filter-btn">Major</button>
            <button className="filter-btn">Minor</button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="cards-grid">
          {[...Array(78)].map((_, i) => (
            <div 
              key={i} 
              className="card-item"
              onClick={() => handleCardClick(i)}
            >
              <div className="card-thumb">🃏</div>
              <div className="card-name">Card {i + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}