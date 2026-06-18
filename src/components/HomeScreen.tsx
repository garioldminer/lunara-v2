import { useEffect } from 'react';
import './HomeScreen.css';

interface Props {
  onBack?: () => void;
  onPricing?: () => void;
}

export default function HomeScreen({ onBack, onPricing }: Props) {
  useEffect(() => {
    console.log('🏠 HomeScreen mounted');
  }, []);

  return (
    <div className="screen-container home">
      {/* ნაწილაკები */}
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

      {/* მთავარი კონტენტი */}
      <div className="content-scroll">
        {/* TOP STATUS BAR */}
        <div className="top-bar">
          <div className="user-info">
            <div className="avatar">A</div>
            <span className="username">ArcanaSeeker</span>
          </div>
          <div className="badges">
            <div className="badge">
              <span className="icon">🔮</span>
              <span className="value">2,450</span>
            </div>
            <div className="badge">
              <span className="icon"></span>
              <span className="value">50</span>
            </div>
          </div>
        </div>

        {/* CARD OF THE DAY */}
        <div className="section">
          <h2 className="section-title">✦ CARD OF THE DAY ✦</h2>
          <div className="card-of-day">
            <div className="card-image">
              <div className="tarot-card">
                <div className="card-content">
                  <span className="card-number">XIII</span>
                  <div className="card-illustration">🌙</div>
                </div>
              </div>
            </div>
            <div className="card-info">
              <h3 className="card-title">DEATH</h3>
              <p className="card-subtitle">SCORPIO ♏ · WATER</p>
              <p className="card-description">
                An ending that brings new beginnings...
              </p>
              <button className="btn-read-more">READ MORE</button>
            </div>
          </div>
        </div>

        {/* 3 STAT BOXES */}
        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-value">78/78</div>
            <div className="stat-icon"></div>
            <div className="stat-label">Cards</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">12</div>
            <div className="stat-icon">🔥</div>
            <div className="stat-label">Streak</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">24</div>
            <div className="stat-icon">⭐</div>
            <div className="stat-label">MYSTIC</div>
          </div>
        </div>

        {/* DAILY QUESTS */}
        <div className="section">
          <h2 className="section-title">✦ DAILY QUESTS ✦</h2>
          <div className="quests-list">
            <div className="quest-item">
              <div className="quest-icon">🃏</div>
              <div className="quest-info">
                <div className="quest-header">
                  <span className="quest-title">Draw 3 Cards</span>
                  <span className="quest-progress">2/3</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '66%'}}></div>
                </div>
              </div>
              <div className="quest-reward">+20</div>
            </div>

            <div className="quest-item">
              <div className="quest-icon">⭐</div>
              <div className="quest-info">
                <div className="quest-header">
                  <span className="quest-title">Win 2 Daily Readings</span>
                  <span className="quest-progress">1/2</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '50%'}}></div>
                </div>
              </div>
              <div className="quest-reward">+25</div>
            </div>

            <div className="quest-item completed">
              <div className="quest-icon">🌙</div>
              <div className="quest-info">
                <div className="quest-header">
                  <span className="quest-title">Check Your Horoscope</span>
                  <span className="quest-progress">1/1</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '100%'}}></div>
                </div>
              </div>
              <div className="quest-reward">+15</div>
            </div>

            <div className="quest-item">
              <div className="quest-icon">👤</div>
              <div className="quest-info">
                <div className="quest-header">
                  <span className="quest-title">Invite a Friend</span>
                  <span className="quest-progress">0/1</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '0%'}}></div>
                </div>
              </div>
              <div className="quest-reward">+50🔮</div>
            </div>
          </div>
        </div>

        {/* Premium Banner */}
        <button 
          className="premium-banner" 
          onClick={() => onPricing && onPricing()}
        >
          <span className="premium-icon"></span>
          <span className="premium-text">UPGRADE TO PREMIUM</span>
          <span className="premium-arrow">→</span>
        </button>

        {/* Bottom spacing for navigation */}
        <div className="bottom-spacer"></div>
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="bottom-nav">
        <button className="nav-item active">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">HOME</span>
          <div className="nav-dot"></div>
        </button>
        <button className="nav-item">
          <span className="nav-icon"></span>
          <span className="nav-label">CARDS</span>
        </button>
        <button className="nav-item">
          <span className="nav-icon">🔮</span>
          <span className="nav-label">READING</span>
        </button>
        <button className="nav-item">
          <span className="nav-icon"></span>
          <span className="nav-label">ASTRO</span>
        </button>
        <button className="nav-item">
          <span className="nav-icon">👤</span>
          <span className="nav-label">PROFILE</span>
        </button>
      </div>
    </div>
  );
}