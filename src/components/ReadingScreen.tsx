import { useEffect } from 'react';
import './ReadingScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function ReadingScreen({ onNavigate }: Props) {
  useEffect(() => {
    console.log('🔮 ReadingScreen mounted');
    console.log('onNavigate available:', !!onNavigate);
  }, [onNavigate]);

  const handleSpreadClick = (spreadName: string) => {
    console.log(`Spread selected: ${spreadName}`);
    // მომავალში: onNavigate && onNavigate('reading-detail');
  };

  return (
    <div className="screen-container reading">
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
          <h1 className="page-title">✦ CHOOSE YOUR SPREAD ✦</h1>
          <p className="page-subtitle">Select a reading type</p>
        </div>

        <div className="spreads-list">
          <div 
            className="spread-item"
            onClick={() => handleSpreadClick('Single Card')}
          >
            <div className="spread-icon">🎴</div>
            <div className="spread-info">
              <h3 className="spread-title">Single Card</h3>
              <p className="spread-desc">Quick answer to your question</p>
            </div>
          </div>

          <div 
            className="spread-item"
            onClick={() => handleSpreadClick('3-Card Spread')}
          >
            <div className="spread-icon">🔮</div>
            <div className="spread-info">
              <h3 className="spread-title">3-Card Spread</h3>
              <p className="spread-desc">Past · Present · Future</p>
            </div>
          </div>

          <div 
            className="spread-item premium"
            onClick={() => handleSpreadClick('Celtic Cross')}
          >
            <div className="spread-icon">✨</div>
            <div className="spread-info">
              <h3 className="spread-title">Celtic Cross</h3>
              <p className="spread-desc">10 cards · Full analysis</p>
            </div>
            <div className="premium-badge">👑</div>
          </div>

          <div 
            className="spread-item premium"
            onClick={() => handleSpreadClick('Love Spread')}
          >
            <div className="spread-icon">💕</div>
            <div className="spread-info">
              <h3 className="spread-title">Love Spread</h3>
              <p className="spread-desc">Relationship guidance</p>
            </div>
            <div className="premium-badge">👑</div>
          </div>

          <div 
            className="spread-item premium"
            onClick={() => handleSpreadClick('Career Spread')}
          >
            <div className="spread-icon">💼</div>
            <div className="spread-info">
              <h3 className="spread-title">Career Spread</h3>
              <p className="spread-desc">Professional path</p>
            </div>
            <div className="premium-badge">👑</div>
          </div>
        </div>
      </div>
    </div>
  );
}