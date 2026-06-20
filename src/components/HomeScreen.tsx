import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { 
  Gem, Zap, Trophy, Flame, Star, 
  Sparkles, LayoutGrid, Moon, Hash, 
  Wind, Droplets, Brain, Crown,
  Gift, Scroll, Activity, ChevronRight
} from 'lucide-react';
import './HomeScreen.css';

export default function HomeScreen() {
  const { user } = useUser();
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [timeLeft, setTimeLeft] = useState('14:32:18');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClaimReward = () => {
    if (!rewardClaimed) {
      setRewardClaimed(true);
    }
  };

  const quickActions = [
    { icon: <LayoutGrid size={28} />, label: 'Tarot', sublabel: 'Readings', color: '#C5A059' },
    { icon: <Sparkles size={28} />, label: 'Astrology', sublabel: 'Today', color: '#a78bfa' },
    { icon: <Hash size={28} />, label: 'Numerology', sublabel: 'Report', color: '#60a5fa' },
    { icon: <Moon size={28} />, label: 'Moon', sublabel: 'Rituals', color: '#fbbf24' },
    { icon: <Gem size={28} />, label: 'Crystals', sublabel: '', color: '#f472b6' },
    { icon: <Droplets size={28} />, label: 'Chakras', sublabel: '', color: '#34d399' },
    { icon: <Wind size={28} />, label: 'Runes', sublabel: '', color: '#fb923c' },
    { icon: <Brain size={28} />, label: 'Dreams', sublabel: '', color: '#c084fc' },
  ];

  const quests = [
    { icon: <Scroll size={18} />, name: 'Draw 3 Cards', current: 2, total: 3, reward: 20 },
    { icon: <Sparkles size={18} />, name: 'Check Your Horoscope', current: 1, total: 1, reward: 15 },
    { icon: <Activity size={18} />, name: 'Complete a Reading', current: 1, total: 2, reward: 25 },
  ];

  const xpPercent = 78;
  const xpCurrent = 7850;
  const xpTotal = 10000;

  return (
    <div className="home-screen">
      {/* 1. USER HEADER */}
      <div className="user-header">
        <div className="user-main-row">
          <div className="avatar-section">
            <div className="avatar-ring-glow"></div>
            <div className="avatar-image">
              {user?.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div className="user-info-section">
            <h2 className="username">{user?.display_name || 'LunaraSeeker'}</h2>
            <p className="user-level">Lv.{user?.level || 24} <span className="user-title">{user?.current_plan?.toUpperCase() || 'MYSTIC'}</span></p>
          </div>
          <div className="user-resources">
            <div className="resource gems">
              <Gem size={14} className="resource-icon gem-icon" />
              <span className="value">{user?.gems?.toLocaleString() || '3,450'}</span>
              <button className="add-btn">+</button>
            </div>
            <div className="resource energy">
              <Zap size={14} className="resource-icon energy-icon" />
              <span className="value">18/20</span>
              <button className="add-btn">+</button>
            </div>
          </div>
        </div>
        <div className="xp-section">
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${xpPercent}%` }}></div>
          </div>
          <div className="xp-info">
            <span className="xp-text">XP {xpCurrent.toLocaleString()} / {xpTotal.toLocaleString()}</span>
            <span className="xp-percent">{xpPercent}%</span>
            <Star size={18} className="star-icon" fill="#C5A059" />
          </div>
        </div>
      </div>

      {/* 2. DAILY REWARD */}
      <div className="daily-reward-banner">
        <div className="reward-content">
          <div className="reward-text">
            <h3>DAILY REWARD</h3>
            <p>Claim your free reward</p>
          </div>
          <div className="reward-chest">
            <div className="chest-animation">
              <Gift size={48} className="chest-icon" />
            </div>
          </div>
        </div>
        <button 
          className={`claim-btn ${rewardClaimed ? 'claimed' : ''}`}
          onClick={handleClaimReward}
          disabled={rewardClaimed}
        >
          {rewardClaimed ? 'CLAIMED' : 'CLAIM'}
          {!rewardClaimed && <div className="claim-reward"><Gem size={12} /> 50</div>}
        </button>
      </div>

      {/* 3. STATS ROW */}
      <div className="stats-row">
        <div className="stat-card streak">
          <Flame size={32} className="stat-icon flame" />
          <div className="stat-info">
            <span className="stat-value">{user?.streak || 12} DAY STREAK</span>
            <span className="stat-label">Keep it up!</span>
          </div>
        </div>
        <div className="stat-card rank">
          <Trophy size={32} className="stat-icon trophy" />
          <div className="stat-info">
            <span className="stat-value">RANK</span>
            <span className="stat-label">TOP 8%</span>
          </div>
        </div>
      </div>

      {/* 4. CARD OF THE DAY */}
      <div className="card-of-day">
        <div className="card-image">
          <div className="card-art">
            <span className="card-number">XIII</span>
            <div className="card-symbol">💀</div>
            <span className="card-name-bottom">DEATH</span>
          </div>
        </div>
        <div className="card-info">
          <h3>DEATH</h3>
          <p className="card-meaning">Transformation</p>
          <p className="card-zodiac">Scorpio · Water</p>
          <button className="read-guidance-btn">
            READ GUIDANCE
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 5. DAILY QUESTS */}
      <div className="daily-quests">
        <div className="quests-header">
          <h3>DAILY QUESTS</h3>
          <span className="quests-timer">Resets in {timeLeft}</span>
        </div>
        <div className="quest-list">
          {quests.map((quest, index) => (
            <div key={index} className="quest-item">
              <div className="quest-info">
                <span className="quest-icon">{quest.icon}</span>
                <span className="quest-name">{quest.name}</span>
              </div>
              <div className="quest-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(quest.current / quest.total) * 100}%` }}></div>
                </div>
                <span className="progress-text">{quest.current}/{quest.total}</span>
                <span className="quest-reward">+{quest.reward} <Gem size={10} /></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. QUICK ACCESS GRID */}
      <div className="quick-access">
        <h3>QUICK ACCESS</h3>
        <div className="quick-grid">
          {quickActions.map((action, index) => (
            <button key={index} className="quick-item" style={{ '--glow-color': action.color } as React.CSSProperties}>
              <div className="q-icon-wrapper" style={{ color: action.color }}>
                {action.icon}
              </div>
              <span className="q-label">{action.label}</span>
              {action.sublabel && <span className="q-sublabel">{action.sublabel}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 7. UPGRADE BANNER */}
      <div className="upgrade-banner">
        <div className="upgrade-content">
          <Crown size={36} className="upgrade-icon" />
          <div className="upgrade-text">
            <h3>UPGRADE TO MYSTIC</h3>
            <p>Unlimited readings, full access & more</p>
          </div>
        </div>
        <button className="upgrade-btn">UPGRADE</button>
      </div>
    </div>
  );
}