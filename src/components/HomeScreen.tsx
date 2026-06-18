import { useEffect, useState } from 'react';
import './HomeScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

interface Quest {
  id: number;
  icon: string;
  title: string;
  current: number;
  target: number;
  reward: number;
}

export default function HomeScreen({ onNavigate }: Props) {
  const [quests] = useState<Quest[]>([
    { id: 1, icon: '📖', title: 'Draw 3 Cards', current: 2, target: 3, reward: 20 },
    { id: 2, icon: '⭐', title: 'Win 2 Readings', current: 1, target: 2, reward: 25 },
    { id: 3, icon: '🌙', title: 'Check Horoscope', current: 1, target: 1, reward: 15 },
  ]);

  useEffect(() => {
    console.log('🏠 HomeScreen mounted');
  }, []);

  const handleQuestClick = (questId: number) => {
    console.log(`Quest clicked: ${questId}`);
  };

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    if (onNavigate) {
      onNavigate(action);
    }
  };

  return (
    <div className="screen-container home">
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

      {/* Scrollable Content */}
      <div className="content-scroll">
        {/* 1. HEADER */}
        <div className="header-section">
          <div className="user-info">
            <div className="avatar">A</div>
            <div className="user-details">
              <span className="username">ArcanaSeeker</span>
              <span className="level">Lv.24 MYSTIC</span>
            </div>
          </div>
          <div className="badges">
            <div className="badge gems">
              <span className="badge-icon">🔮</span>
              <span className="badge-value">2,450</span>
            </div>
            <div className="badge energy">
              <span className="badge-icon">⚡</span>
              <span className="badge-value">50</span>
            </div>
          </div>
        </div>

        {/* 2. DAILY COSMIC SNAPSHOT */}
        <div className="cosmic-snapshot">
          <h3 className="section-label">🌙 TODAY'S COSMIC ENERGY</h3>
          <div className="cosmic-grid">
            <div className="cosmic-item" onClick={() => handleQuickAction('moon')}>
              <div className="cosmic-icon">🌕</div>
              <div className="cosmic-text">
                <span className="cosmic-title">Waxing</span>
                <span className="cosmic-subtitle">Gibbous</span>
              </div>
            </div>
            <div className="cosmic-item" onClick={() => handleQuickAction('zodiac')}>
              <div className="cosmic-icon">♏</div>
              <div className="cosmic-text">
                <span className="cosmic-title">Scorpio</span>
                <span className="cosmic-subtitle">Season</span>
              </div>
            </div>
            <div className="cosmic-item" onClick={() => handleQuickAction('transit')}>
              <div className="cosmic-icon">🔥</div>
              <div className="cosmic-text">
                <span className="cosmic-title">Venus in</span>
                <span className="cosmic-subtitle">Taurus</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CARD OF THE DAY */}
        <div className="card-of-day-section">
          <h3 className="section-label">✦ CARD OF THE DAY ✦</h3>
          <div className="card-of-day" onClick={() => handleQuickAction('card-detail')}>
            <div className="card-image">
              <div className="tarot-card">
                <span className="card-number">XIII</span>
                <div className="card-symbol"></div>
              </div>
            </div>
            <div className="card-info">
              <h4 className="card-title">DEATH</h4>
              <p className="card-subtitle">Scorpio ♏ · Water</p>
              <p className="card-description">An ending that brings new beginnings...</p>
              <button className="btn-read-more">READ MORE →</button>
            </div>
          </div>
        </div>

        {/* 4. QUICK ACTIONS */}
        <div className="quick-actions-section">
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={() => handleQuickAction('draw')}>
              <span className="action-icon">🔮</span>
              <span className="action-title">Draw</span>
              <span className="action-subtitle">Card</span>
            </button>
            <button className="quick-action-btn" onClick={() => handleQuickAction('horoscope')}>
              <span className="action-icon">🌟</span>
              <span className="action-title">Horoscope</span>
              <span className="action-subtitle">Today</span>
            </button>
            <button className="quick-action-btn" onClick={() => handleQuickAction('match')}>
              <span className="action-icon">💕</span>
              <span className="action-title">Check</span>
              <span className="action-subtitle">Match</span>
            </button>
            <button className="quick-action-btn" onClick={() => handleQuickAction('moon-ritual')}>
              <span className="action-icon">🌙</span>
              <span className="action-title">Moon</span>
              <span className="action-subtitle">Ritual</span>
            </button>
          </div>
        </div>

        {/* 5. MY PROGRESS */}
        <div className="progress-section">
          <div className="progress-grid">
            <div className="progress-box" onClick={() => handleQuickAction('cards')}>
              <div className="progress-value">78/78</div>
              <div className="progress-icon">🃏</div>
              <div className="progress-label">Cards</div>
            </div>
            <div className="progress-box" onClick={() => handleQuickAction('streak')}>
              <div className="progress-value">12</div>
              <div className="progress-icon"></div>
              <div className="progress-label">Streak</div>
            </div>
            <div className="progress-box" onClick={() => handleQuickAction('level')}>
              <div className="progress-value">Lv.24</div>
              <div className="progress-icon">⭐</div>
              <div className="progress-label">MYSTIC</div>
            </div>
          </div>
        </div>

        {/* 6. DAILY QUESTS */}
        <div className="quests-section">
          <h3 className="section-label">✦ DAILY QUESTS ✦</h3>
          <div className="quests-list">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className={`quest-item ${quest.current >= quest.target ? 'completed' : ''}`}
                onClick={() => handleQuestClick(quest.id)}
              >
                <div className="quest-icon">{quest.icon}</div>
                <div className="quest-info">
                  <div className="quest-header">
                    <span className="quest-title">{quest.title}</span>
                    <span className="quest-progress">
                      {quest.current}/{quest.target}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(quest.current / quest.target) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="quest-reward">+{quest.reward}💎</div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. PREMIUM BANNER */}
        <div className="premium-banner" onClick={() => onNavigate && onNavigate('pricing')}>
          <span className="premium-icon">🌙</span>
          <span className="premium-text">Unlock MYSTIC - 7 Days Free</span>
          <span className="premium-arrow">→</span>
        </div>

        <div className="bottom-spacer"></div>
      </div>

      {/* 8. BOTTOM NAVIGATION */}
      <div className="bottom-nav">
        <button className="nav-item active">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">HOME</span>
          <div className="nav-dot"></div>
        </button>
        <button className="nav-item" onClick={() => onNavigate && onNavigate('cards')}>
          <span className="nav-icon">🃏</span>
          <span className="nav-label">CARDS</span>
        </button>
        <button className="nav-item" onClick={() => onNavigate && onNavigate('reading')}>
          <span className="nav-icon">🔮</span>
          <span className="nav-label">READING</span>
        </button>
        <button className="nav-item" onClick={() => onNavigate && onNavigate('astro')}>
          <span className="nav-icon">🌟</span>
          <span className="nav-label">ASTRO</span>
        </button>
        <button className="nav-item" onClick={() => onNavigate && onNavigate('profile')}>
          <span className="nav-icon">👤</span>
          <span className="nav-label">PROFILE</span>
        </button>
      </div>
    </div>
  );
}