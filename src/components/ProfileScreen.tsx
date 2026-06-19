import { useEffect } from 'react';
import './ProfileScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function ProfileScreen({ onNavigate }: Props) {
  useEffect(() => {
    console.log('👤 ProfileScreen mounted');
  }, []);

  return (
    <div className="screen-container profile">
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
        {/* User Info */}
        <div className="user-section">
          <div className="avatar-large">A</div>
          <h2 className="username">ArcanaSeeker</h2>
          <p className="zodiac-sign">♏ Scorpio</p>
          <div className="level-progress">
            <div className="level-info">
              <span className="level-text">Lv.24 MYSTIC</span>
              <span className="xp-text">2,450 / 3,000 XP</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '82%'}}></div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">156</div>
            <div className="stat-label">Readings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">78/78</div>
            <div className="stat-label">Cards</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">12</div>
            <div className="stat-label">Day Streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">2,450</div>
            <div className="stat-label">Gems</div>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="settings-menu">
          <h3 className="menu-title">✦ SETTINGS ✦</h3>
          
          <div className="menu-item">
            <span className="menu-icon">🔔</span>
            <span className="menu-text">Notifications</span>
            <span className="menu-arrow">→</span>
          </div>

          <div className="menu-item">
            <span className="menu-icon">🌗</span>
            <span className="menu-text">Theme</span>
            <span className="menu-arrow">→</span>
          </div>

          <div className="menu-item">
            <span className="menu-icon">🌐</span>
            <span className="menu-text">Language</span>
            <span className="menu-arrow">→</span>
          </div>

          <div className="menu-item">
            <span className="menu-icon"></span>
            <span className="menu-text">Privacy</span>
            <span className="menu-arrow">→</span>
          </div>

          <div className="menu-item premium" onClick={() => onNavigate && onNavigate('pricing')}>
            <span className="menu-icon">💎</span>
            <span className="menu-text">Subscription</span>
            <span className="menu-arrow">→</span>
          </div>

          <div className="menu-item">
            <span className="menu-icon"></span>
            <span className="menu-text">Support</span>
            <span className="menu-arrow">→</span>
          </div>

          <div className="menu-item">
            <span className="menu-icon">ℹ️</span>
            <span className="menu-text">About</span>
            <span className="menu-arrow">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}