import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { tarotCards, SUITS } from '../data/tarotCards';
import { getUserStreak } from '../lib/readingService';
import { isAdmin } from '../lib/adminService';
import { getActiveSubscription, formatExpirationDate } from '../lib/subscriptionService';
import { 
  Gem, Zap, Trophy, Flame,
  Sparkles, LayoutGrid, Moon, Hash, 
  Crown,
  Scroll, Activity, ChevronRight, Gift, Shield, Infinity
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
  const [activeSubscription, setActiveSubscription] = useState<any>(null);

  // XP values
  const xpPercent = 78;
  const xpCurrent = 7850;
  const xpTotal = 10000;

  // ✅ Admin-ის შემოწმება
  useEffect(() => {
    if (user) {
      isAdmin(user.id).then(admin => {
        setIsUserAdmin(admin);
      });
    }
  }, [user]);

  // ✅ Subscription-ის შემოწმება
  useEffect(() => {
    if (user) {
      getActiveSubscription(user.id).then(sub => {
        setActiveSubscription(sub);
      });
    }
  }, [user]);

  // Daily Card
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

    const dayOfYear = getDayOfYear(new Date());
    const cardIndex = dayOfYear % tarotCards.length;
    const card = tarotCards[cardIndex];
    const isReversed = Math.random() < 0.5;
    
    const newReading = { card, isReversed, date: today };
    localStorage.setItem('dailyCard', JSON.stringify(newReading));
    setDailyCard(card);
    setIsDailyReversed(isReversed);
  }, []);

  // Streak
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
      } else if (action === 'Subscription') {
        onNavigate('subscription');
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

  const dailyCardName = dailyCard?.name || 'THE FOOL';
  const dailyCardNumber = dailyCard?.number || '0';
  const dailyCardMeaning = isDailyReversed 
    ? (dailyCard?.reversed_keywords?.[0] || 'Reflection')
    : (dailyCard?.keywords?.[0] || 'New Beginnings');
  const dailyCardElement = dailyCard ? getCardMeta(dailyCard) : '';

  // XP circular progress calculation
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - (xpPercent / 100) * circumference;

  return (
    <div className="home-screen">
      {/* 1. USER HEADER */}
      <div className="user-header">
        <div className="user-main-row">
          <div className="avatar-section">
            {/* XP Circular Progress Bar */}
            <svg className="xp-circular-progress" width="56" height="56" viewBox="0 0 56 56">
              <circle
                className="xp-circle-bg"
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="rgba(197, 160, 89, 0.2)"
                strokeWidth="3"
              />
              <circle
                className="xp-circle-progress"
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="url(#xpGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 28 28)"
              />
              <defs>
                <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C5A059" />
                  <stop offset="100%" stopColor="#ffe566" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="avatar-image">
              {user?.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            {/* Premium Badge */}
            {activeSubscription && (
              <div className="premium-avatar-badge">
                <Crown size={10} />
              </div>
            )}
          </div>
          
          <div className="user-info-section">
            <div className="username-row">
              <h2 className="username">{user?.display_name || 'LunaraSeeker'}</h2>
              {activeSubscription && (
                <div className="premium-name-badge" onClick={() => onNavigate?.('subscription')}>
                  <Infinity size={10} />
                  <span>PREMIUM</span>
                </div>
              )}
            </div>
            <p className="user-level">
              Lv.{user?.level || 24} 
              <span className="user-title">{user?.current_plan?.toUpperCase() || 'MYSTIC'}</span>
              {activeSubscription && (
                <span className="subscription-expiry">
                  · {formatExpirationDate(activeSubscription.expires_at)}
                </span>
              )}
            </p>
            <div className="xp-text-inline">
              <span className="xp-current">{xpCurrent.toLocaleString()}</span>
              <span className="xp-separator">/</span>
              <span className="xp-total">{xpTotal.toLocaleString()} XP</span>
            </div>
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
      </div>

      {/* 2. DAILY QUESTS (60%) + ACTION BUTTONS (40%) */}
      <div className="quests-and-actions-split">
        {/* LEFT - Daily Quests (60%) */}
        <div className="daily-quests-compact">
          <div className="quests-header-compact">
            <h3>DAILY QUESTS</h3>
            <span className="quests-timer-compact">{timeLeft}</span>
          </div>
          <div className="quest-list-compact">
            {quests.map((quest, index) => (
              <div key={index} className="quest-item-compact">
                <div className="quest-icon-compact">
                  {quest.icon}
                </div>
                <div className="quest-info-compact">
                  <span className="quest-name-compact">{quest.name}</span>
                  <div className="quest-progress-compact">
                    <div className="progress-bar-compact">
                      <div 
                        className="progress-fill-compact" 
                        style={{ width: `${(quest.current / quest.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="progress-text-compact">{quest.current}/{quest.total}</span>
                  </div>
                </div>
                <div className="quest-reward-compact">
                  +{quest.reward} <Gem size={10} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT - Action Buttons (40%) */}
        <div className="action-buttons-panel">
          <div className="action-grid-vertical">
            <button 
              className={`action-btn-vertical ${rewardClaimed ? 'claimed' : ''}`}
              onClick={handleClaimReward}
              disabled={rewardClaimed}
            >
              <Gift size={22} className="action-icon-v" />
              {!rewardClaimed && <div className="action-badge-v">50</div>}
            </button>

            <button className="action-btn-vertical streak-btn-v">
              <Flame size={22} className="action-icon-v flame-icon-v" />
              <div className="action-badge-v">{currentStreak}</div>
            </button>

            <button className="action-btn-vertical rank-btn-v">
              <Trophy size={22} className="action-icon-v trophy-icon-v" />
              <div className="action-badge-v">TOP</div>
            </button>

            <button 
              className={`action-btn-vertical ${activeSubscription ? 'subscription-btn-v' : 'upgrade-btn-v'}`}
              onClick={() => onNavigate && onNavigate(activeSubscription ? 'subscription' : 'pricing')}
            >
              {activeSubscription ? (
                <>
                  <Infinity size={22} className="action-icon-v subscription-icon-v" />
                  <div className="action-badge-v">VIP</div>
                </>
              ) : (
                <>
                  <Crown size={22} className="action-icon-v crown-icon-v" />
                  <div className="action-badge-v">PRO</div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. CARD OF THE DAY - Full Width, Tilted */}
      <div 
        className="card-of-day-banner clickable-card"
        onClick={() => onNavigate && onNavigate('daily-card')}
      >
        <div className="card-of-day-content">
          {/* Card Image - Tilted */}
          <div className="card-image-wrapper">
            <div className="card-image-tilted">
              {dailyCard?.image_url ? (
                <img 
                  src={dailyCard.image_url} 
                  alt={dailyCardName}
                  className="card-image-large"
                  style={{ transform: isDailyReversed ? 'rotate(192deg)' : 'rotate(12deg)' }}
                />
              ) : (
                <div className="card-placeholder-large" style={{ transform: 'rotate(12deg)' }}>
                  <span className="card-number-large">{dailyCardNumber}</span>
                  <div className="card-symbol-large">✦</div>
                  <span className="card-name-large">{dailyCardName}</span>
                </div>
              )}
              {isDailyReversed && (
                <div className="card-reversed-indicator-large">R</div>
              )}
            </div>
          </div>

          {/* Card Info */}
          <div className="card-info-section">
            <div className="card-day-label">CARD OF THE DAY</div>
            <h3 className="card-title">{dailyCardName}</h3>
            <p className="card-meaning">"{dailyCardMeaning}"</p>
            {dailyCardElement && (
              <p className="card-element">{dailyCardElement}</p>
            )}
            <button className="read-guidance-btn">
              READ GUIDANCE
              <ChevronRight size={14} />
            </button>
          </div>
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