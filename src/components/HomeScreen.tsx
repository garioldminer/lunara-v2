import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { tarotCards, SUITS } from '../data/tarotCards';
import { getUserStreak } from '../lib/readingService';
import { isAdmin } from '../lib/adminService';
import { 
  Gem, Zap, Trophy, Flame, Star, 
  Sparkles, LayoutGrid, Moon, Hash, 
  Crown,
  Scroll, Activity, ChevronRight, Gift, Shield
} from 'lucide-react';
import './HomeScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [timeLeft, setTimeLeft] = useState('14:32:18');
  const [dailyCard, setDailyCard] = useState<typeof tarotCards[0] | null>(null);
  const [isDailyReversed, setIsDailyReversed] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // ✅ Admin-ის შემოწმება - async/await სწორად
  useEffect(() => {
    if (user) {
      isAdmin(user.id).then(admin => {
        setIsUserAdmin(admin);
      });
    }
  }, [user]);

  // Daily Card - მიიღე დღის კარტი
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('dailyCard');
    
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        setDailyCard(parsed.card);
        setIsDailyReversed(parsed.isReversed);
        return;
      }
    }

    // ახალი კარტი
    const dayOfYear = getDayOfYear(new Date());
    const cardIndex = dayOfYear % tarotCards.length;
    const card = tarotCards[cardIndex];
    const isReversed = Math.random() < 0.5;
    
    const newReading = { card, isReversed, date: today };
    localStorage.setItem('dailyCard', JSON.stringify(newReading));
    setDailyCard(card);
    setIsDailyReversed(isReversed);
  }, []);

  // Streak - მიიღე Supabase-დან
  useEffect(() => {
    if (user) {
      getUserStreak(user.id).then(streakData => {
        setCurrentStreak(streakData.current_streak || 0);
      });
    }
  }, [user]);

  const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const getCardMeta = (card: typeof tarotCards[0]) => {
    if (card.arcana === 'major') return 'Major Arcana';
    if (card.suit && SUITS[card.suit]) {
      return `${SUITS[card.suit].element}`;
    }
    return '';
  };

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

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
    if (onNavigate) {
      if (action === 'Tarot') {
        onNavigate('card-fan');
      } else if (action === 'Daily') {
        onNavigate('daily-card');
      } else if (action === '3Cards') {
        onNavigate('three-card-reading');
      } else if (action === 'Astrology') {
        onNavigate('astro');
      } else if (action === 'Cards') {
        onNavigate('cards');
      } else if (action === 'History') {
        onNavigate('reading-history');
      } else if (action === 'CelticCross') {
        onNavigate('celtic-cross');
      } else if (action === 'Horseshoe') {
        onNavigate('horseshoe');
      } else if (action === 'Relationship') {
        onNavigate('relationship');
      } else if (action === 'Admin') {
        onNavigate('admin');
      }
    }
  };

  const quickActions = [
    { icon: <Sparkles size={28} />, label: 'Daily', sublabel: 'Card', color: '#C5A059', action: 'Daily' },
    { icon: <LayoutGrid size={28} />, label: '3 Cards', sublabel: 'Reading', color: '#a78bfa', action: '3Cards' },
    { icon: <Moon size={28} />, label: 'Tarot', sublabel: 'Draw', color: '#60a5fa', action: 'Tarot' },
    { icon: <Hash size={28} />, label: 'Cards', sublabel: 'Gallery', color: '#fbbf24', action: 'Cards' },
    { icon: <Scroll size={28} />, label: 'History', sublabel: 'Readings', color: '#34d399', action: 'History' },
    { icon: <Crown size={28} />, label: 'Celtic', sublabel: 'Cross', color: '#C5A059', action: 'CelticCross', isPremium: true },
    { icon: <span style={{ fontSize: '28px' }}>🐎</span>, label: 'Horseshoe', sublabel: '7 Cards', color: '#fb923c', action: 'Horseshoe', isPremium: true },
    { icon: <span style={{ fontSize: '28px' }}>❤️</span>, label: 'Love', sublabel: 'Spread', color: '#f472b6', action: 'Relationship', isPremium: true },
    { icon: <Gem size={28} />, label: 'Crystals', sublabel: '', color: '#f472b6', action: 'Crystals' },
  ];

  // ✅ Admin ღილაკი - მხოლოდ admin-სთვის
  if (isUserAdmin) {
    quickActions.push({
      icon: <Shield size={28} />,
      label: 'Admin',
      sublabel: 'Panel',
      color: '#ef4444',
      action: 'Admin'
    });
  }

  const quests = [
    { icon: <Scroll size={18} />, name: 'Draw 3 Cards', current: 2, total: 3, reward: 20 },
    { icon: <Sparkles size={18} />, name: 'Check Your Horoscope', current: 1, total: 1, reward: 15 },
    { icon: <Activity size={18} />, name: 'Complete a Reading', current: 1, total: 2, reward: 25 },
  ];

  const xpPercent = 78;
  const xpCurrent = 7850;
  const xpTotal = 10000;

  // Daily Card display info
  const dailyCardName = dailyCard?.name || 'THE FOOL';
  const dailyCardNumber = dailyCard?.number || '0';
  const dailyCardMeaning = isDailyReversed 
    ? (dailyCard?.reversed_keywords?.[0] || 'Reflection')
    : (dailyCard?.keywords?.[0] || 'New Beginnings');
  const dailyCardElement = dailyCard ? getCardMeta(dailyCard) : '';

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

      {/* 2. CARD SECTION - 60/40 Split (Horizontal) */}
      <div className="card-section-split">
        {/* LEFT - Card of the Day (60%) - Clickable */}
        <div 
          className="card-left-horizontal clickable-card"
          onClick={() => onNavigate && onNavigate('daily-card')}
        >
          {/* Card Image - Left Side */}
          <div className="card-art-horizontal">
            {dailyCard?.image_url ? (
              <img 
                src={dailyCard.image_url} 
                alt={dailyCardName}
                className="card-art-image-h"
                style={{ transform: isDailyReversed ? 'rotate(180deg)' : 'none' }}
              />
            ) : (
              <>
                <span className="card-number-h">{dailyCardNumber}</span>
                <div className="card-symbol-h">✦</div>
                <span className="card-name-h">{dailyCardName}</span>
              </>
            )}
            {isDailyReversed && (
              <div className="card-reversed-indicator">R</div>
            )}
          </div>

          {/* Card Info - Right Side */}
          <div className="card-info-horizontal">
            <div className="card-day-label">CARD OF THE DAY</div>
            <h3>{dailyCardName}</h3>
            <p className="card-meaning-h">{dailyCardMeaning}</p>
            {dailyCardElement && (
              <p className="card-zodiac-h">{dailyCardElement}</p>
            )}
            <button className="read-guidance-btn-h">
              READ GUIDANCE
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* RIGHT - Single Card with 4 Action Buttons (40%) */}
        <div className="card-right-single">
          <div className="action-grid">
            {/* Daily Reward */}
            <button 
              className={`action-btn ${rewardClaimed ? 'claimed' : ''}`}
              onClick={handleClaimReward}
              disabled={rewardClaimed}
            >
              <Gift size={24} className="action-icon" />
              {!rewardClaimed && <div className="action-badge">50</div>}
            </button>

            {/* Streak */}
            <button className="action-btn streak-btn">
              <Flame size={24} className="action-icon flame-icon" />
              <div className="action-badge">{currentStreak}</div>
            </button>

            {/* Rank */}
            <button className="action-btn rank-btn">
              <Trophy size={24} className="action-icon trophy-icon" />
              <div className="action-badge">TOP</div>
            </button>

            {/* Upgrade */}
            <button 
              className="action-btn upgrade-btn"
              onClick={() => onNavigate && onNavigate('pricing')}
            >
              <Crown size={24} className="action-icon crown-icon" />
              <div className="action-badge">PRO</div>
            </button>
          </div>
        </div>
      </div>

      {/* 3. DAILY QUESTS */}
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

      {/* 4. QUICK ACCESS GRID */}
      <div className="quick-access">
        <div className="quick-grid">
          {quickActions.map((action, index) => (
            <button 
              key={index} 
              className={`quick-item ${action.isPremium ? 'premium-item' : ''} ${action.action === 'Admin' ? 'admin-item' : ''}`}
              style={{ '--glow-color': action.color } as React.CSSProperties}
              onClick={() => handleQuickAction(action.action)}
            >
              {action.isPremium && (
                <div className="premium-badge">💎</div>
              )}
              <div className="q-icon-wrapper" style={{ color: action.color }}>
                {action.icon}
              </div>
              <span className="q-label">{action.label}</span>
              {action.sublabel && <span className="q-sublabel">{action.sublabel}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}