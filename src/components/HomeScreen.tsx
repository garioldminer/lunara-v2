import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { tarotCards, SUITS } from '../data/tarotCards';
import { getUserStreak } from '../lib/readingService';
import { isAdmin } from '../lib/adminService';
import { getActiveSubscription } from '../lib/subscriptionService';
import { 
  Gem, Zap, Trophy, Flame,
  Sparkles, LayoutGrid, Moon, Hash, 
  Crown, Scroll, ChevronRight, Gift, Shield, Infinity
} from 'lucide-react';
import './HomeScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [timeLeft, setTimeLeft] = useState('14:32:18');
  const [dailyCard, setDailyCard] = useState<typeof tarotCards[0] | null>(null);
  const [isDailyReversed, setIsDailyReversed] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);

  useEffect(() => {
    if (user) {
      isAdmin(user.id).then(admin => {
        setIsUserAdmin(admin);
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getActiveSubscription(user.id).then(sub => {
        setActiveSubscription(sub);
      });
    }
  }, [user]);

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

  // 🆕 გამარტივებული Edge Function-ის გამოძახება (X-User-Id header-ით)
  const handleClaimReward = async () => {
    if (rewardClaimed || isClaiming) return;
    
    setIsClaiming(true);
    try {
      if (!user?.id) {
        alert('❌ მომხმარებლის ID ვერ მოიძებნა.');
        setIsClaiming(false);
        return;
      }

      const response = await fetch('https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/claim-daily-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id
        },
        body: JSON.stringify({})
      });
      
      const result = await response.json();
      
      if (result.success) {
        setRewardClaimed(true);
        setCurrentStreak(result.reward.streak);
        alert(`✅ Daily Reward Claimed!\n💰 Coins: +${result.reward.coins}\n⭐ XP: +${result.reward.xp}\n🔥 Streak: ${result.reward.streak} days`);
      } else {
        alert(`⚠️ ${result.error || 'Failed to claim reward'}`);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('❌ Failed to connect to server.');
    } finally {
      setIsClaiming(false);
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
      } else if (action === 'Horoscope') {
        onNavigate('horoscope');
      } else if (action === 'Admin') {
        onNavigate('admin');
      } else if (action === 'Subscription') {
        onNavigate('subscription');
      } else if (action === 'Services') {
        onNavigate('services');
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
    { icon: <Sparkles size={28} />, label: 'Horoscope', sublabel: 'Daily', color: '#C5A059', action: 'Horoscope' },
    { icon: <Sparkles size={28} />, label: 'Services', sublabel: 'Shop', color: '#FFD700', action: 'Services', isServices: true },
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
    { icon: <Scroll size={16} />, name: 'Draw 3 Cards', current: 2, total: 3, reward: 20 },
    { icon: <Sparkles size={16} />, name: 'Check Horoscope', current: 1, total: 1, reward: 15 },
  ];

  const dailyCardName = dailyCard?.name || 'THE FOOL';
  const dailyCardNumber = dailyCard?.number || '0';
  const dailyCardMeaning = isDailyReversed 
    ? (dailyCard?.reversed_keywords?.[0] || 'Reflection')
    : (dailyCard?.keywords?.[0] || 'New Beginnings');
  const dailyCardElement = dailyCard ? getCardMeta(dailyCard) : '';

  const xpPercent = 78;
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - (xpPercent / 100) * circumference;

  return (
    <div className="home-screen">
      {/* 1. USER HEADER */}
      <div className="user-header">
        <div className="user-main-row">
          <div 
            className="avatar-section clickable-avatar"
            onClick={() => onNavigate?.('profile')}
          >
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
            
            {activeSubscription && (
              <div className="premium-avatar-badge">
                <Crown size={10} />
              </div>
            )}
          </div>
          
          <div className="user-info-section">
            <h2 className="username">{user?.display_name || 'LunaraSeeker'}</h2>
            {activeSubscription && (
              <div 
                className="premium-status-badge"
                onClick={() => onNavigate?.('subscription')}
              >
                <Infinity size={10} />
                <span>PREMIUM</span>
              </div>
            )}
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
      <div 
        className="quests-and-actions-split"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '2px',
          marginBottom: '2px',
          width: '100%',
          alignItems: 'stretch'
        }}
      >
        {/* LEFT - Daily Quests (60%) */}
        <div 
          className="daily-quests-compact"
          style={{
            flex: '0 0 60%',
            minWidth: 0,
            background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
            border: '1px solid #332a1a',
            borderRadius: '14px',
            padding: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div 
            className="quests-header-compact"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
              padding: '0 2px'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '9px', color: '#C5A059', letterSpacing: '1px', fontWeight: 700, textTransform: 'uppercase' }}>DAILY QUESTS</h3>
            <span style={{ fontSize: '9px', color: '#b3a68c', fontFamily: 'monospace' }}>{timeLeft}</span>
          </div>
          <div 
            className="quest-list-compact"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              flex: 1,
              justifyContent: 'center'
            }}
          >
            {quests.map((quest, index) => (
              <div 
                key={index} 
                className="quest-item-compact"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 6px',
                  background: 'rgba(197, 160, 89, 0.05)',
                  borderRadius: '6px',
                  border: '1px solid rgba(197, 160, 89, 0.08)'
                }}
              >
                <div 
                  className="quest-icon-compact"
                  style={{
                    color: '#C5A059',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px'
                  }}
                >
                  {quest.icon}
                </div>
                <div className="quest-info-compact" style={{ flex: 1, minWidth: 0 }}>
                  <span 
                    className="quest-name-compact"
                    style={{
                      fontSize: '9px',
                      color: '#fff',
                      fontWeight: 500,
                      display: 'block',
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {quest.name}
                  </span>
                  <div className="quest-progress-compact" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div 
                      className="progress-bar-compact"
                      style={{
                        flex: 1,
                        height: '3px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}
                    >
                      <div 
                        className="progress-fill-compact" 
                        style={{ 
                          width: `${(quest.current / quest.total) * 100}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #C5A059, #ffe566)',
                          borderRadius: '2px',
                          boxShadow: '0 0 4px rgba(197, 160, 89, 0.5)'
                        }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '8px', color: '#b3a68c', minWidth: '18px' }}>{quest.current}/{quest.total}</span>
                  </div>
                </div>
                <div 
                  className="quest-reward-compact"
                  style={{
                    fontSize: '9px',
                    color: '#C5A059',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1px',
                    flexShrink: 0
                  }}
                >
                  +{quest.reward} <Gem size={9} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT - Action Buttons (40%) */}
        <div 
          className="action-buttons-panel"
          style={{
            flex: '0 0 calc(40% - 2px)',
            minWidth: 0,
            background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
            border: '1px solid #332a1a',
            borderRadius: '14px',
            padding: '6px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            display: 'flex'
          }}
        >
          <div 
            className="action-grid-vertical"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: '4px',
              width: '100%',
              height: '100%'
            }}
          >
            <button 
              className={`action-btn-vertical ${rewardClaimed ? 'claimed' : ''}`}
              onClick={handleClaimReward}
              disabled={rewardClaimed || isClaiming}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(197, 160, 89, 0.15)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (rewardClaimed || isClaiming) ? 'not-allowed' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                padding: '4px',
                width: '100%',
                height: '100%',
                opacity: (rewardClaimed || isClaiming) ? 0.7 : 1
              }}
            >
              {isClaiming ? (
                <svg className="animate-spin" style={{ width: '20px', height: '20px', color: '#C5A059' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Gift size={22} style={{ filter: 'drop-shadow(0 0 6px #C5A059)', color: '#C5A059', width: '20px', height: '20px' }} />
              )}
              {!rewardClaimed && !isClaiming && <div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(197, 160, 89, 0.9)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>50</div>}
            </button>

            <button 
              className="action-btn-vertical streak-btn-v"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(197, 160, 89, 0.15)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                padding: '4px',
                width: '100%',
                height: '100%'
              }}
            >
              <Flame size={22} style={{ filter: 'drop-shadow(0 0 6px #ff6b35)', color: '#ff6b35', width: '20px', height: '20px' }} />
              <div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(197, 160, 89, 0.9)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>{currentStreak}</div>
            </button>

            <button 
              className="action-btn-vertical rank-btn-v"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(197, 160, 89, 0.15)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                padding: '4px',
                width: '100%',
                height: '100%'
              }}
            >
              <Trophy size={22} style={{ filter: 'drop-shadow(0 0 6px #ffd700)', color: '#ffd700', width: '20px', height: '20px' }} />
              <div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(197, 160, 89, 0.9)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>TOP</div>
            </button>

            <button 
              className={`action-btn-vertical ${activeSubscription ? 'subscription-btn-v' : 'upgrade-btn-v'}`}
              onClick={() => onNavigate && onNavigate(activeSubscription ? 'subscription' : 'pricing')}
              style={{
                background: activeSubscription ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)' : 'rgba(255, 255, 255, 0.03)',
                border: activeSubscription ? '1px solid rgba(255, 215, 0, 0.4)' : '1px solid rgba(197, 160, 89, 0.15)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                padding: '4px',
                width: '100%',
                height: '100%'
              }}
            >
              {activeSubscription ? (
                <>
                  <Infinity size={22} style={{ filter: 'drop-shadow(0 0 6px #FFD700)', color: '#FFD700', width: '20px', height: '20px' }} />
                  <div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>VIP</div>
                </>
              ) : (
                <>
                  <Crown size={22} style={{ filter: 'drop-shadow(0 0 6px #a78bfa)', color: '#a78bfa', width: '20px', height: '20px' }} />
                  <div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(197, 160, 89, 0.9)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>PRO</div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. CARD OF THE DAY */}
      <div 
        className="card-of-day-banner clickable-card"
        onClick={() => onNavigate && onNavigate('daily-card')}
        style={{
          background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
          border: '1px solid #332a1a',
          borderRadius: '16px',
          padding: '12px',
          marginBottom: '2px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'visible',
          cursor: 'pointer'
        }}
      >
        <div 
          className="card-of-day-content"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '0'
          }}
        >
          <div 
            className="card-half-left"
            style={{
              flex: '0 0 45%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0'
            }}
          >
            <div 
              className="card-image-3d-wrapper"
              style={{
                position: 'relative',
                width: 'clamp(80px, 22vw, 110px)',
                aspectRatio: '2/3',
                perspective: '800px'
              }}
            >
              <div 
                className="card-image-tilted"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transform: 'rotateY(-5deg) rotateX(2deg) rotate(3deg)',
                  transition: 'transform 0.4s ease',
                  zIndex: 2,
                  transformStyle: 'preserve-3d'
                }}
              >
                {dailyCard?.image_url ? (
                  <img 
                    src={dailyCard.image_url} 
                    alt={dailyCardName}
                    className="card-image-large"
                    style={{ 
                      transform: isDailyReversed ? 'rotate(183deg)' : 'rotate(3deg)',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid #C5A059',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.5), 0 16px 32px rgba(0,0,0,0.6), 0 0 20px rgba(197,160,89,0.3)'
                    }}
                  />
                ) : (
                  <div 
                    className="card-placeholder-large" 
                    style={{ 
                      transform: 'rotate(3deg)',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #2a2215, #1a1510)',
                      borderRadius: '8px',
                      border: '2px solid #C5A059',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.5), 0 16px 32px rgba(0,0,0,0.6), 0 0 20px rgba(197,160,89,0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#C5A059' }}>{dailyCardNumber}</span>
                    <div style={{ fontSize: '28px', filter: 'drop-shadow(0 0 10px rgba(197, 160, 89, 0.6))' }}>✦</div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#C5A059', textAlign: 'center', padding: '0 6px' }}>{dailyCardName}</span>
                  </div>
                )}
                {isDailyReversed && (
                  <div 
                    className="card-reversed-indicator-large"
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 900,
                      zIndex: 3,
                      background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                      color: '#fff',
                      border: '2px solid #fff',
                      boxShadow: '0 0 0 2px rgba(167,139,250,0.5), 0 4px 12px rgba(167,139,250,0.8), 0 0 20px rgba(167,139,250,0.6)'
                    }}
                  >
                    <span>R</span>
                  </div>
                )}
              </div>
              <div 
                className="card-3d-shadow"
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '10%',
                  width: '80%',
                  height: '14px',
                  background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)',
                  filter: 'blur(6px)',
                  zIndex: 1,
                  opacity: 0.7
                }}
              ></div>
            </div>
          </div>

          <div 
            className="card-half-right"
            style={{
              flex: '0 0 55%',
              paddingLeft: '12px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div 
              className="card-info-section"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '4px',
                width: '100%',
                minWidth: 0
              }}
            >
              <div style={{ fontSize: '9px', color: '#C5A059', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.7, fontWeight: 600 }}>CARD OF THE DAY</div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#C5A059', letterSpacing: '0.5px', fontWeight: 700, lineHeight: 1.2 }}>{dailyCardName}</h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 1.3 }}>"{dailyCardMeaning}"</p>
              {dailyCardElement && (
                <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>{dailyCardElement}</p>
              )}
              <button 
                className="read-guidance-btn"
                style={{
                  background: 'transparent',
                  border: '1px solid #C5A059',
                  color: '#C5A059',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: '4px',
                  alignSelf: 'flex-start'
                }}
              >
                READ GUIDANCE
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. QUICK ACCESS GRID */}
      <div className="quick-access" style={{ marginBottom: '8px', width: '100%' }}>
        <div className="quick-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {quickActions.map((action, index) => (
            <button 
              key={index} 
              className={`quick-item ${action.isPremium ? 'premium-item' : ''} ${action.action === 'Admin' ? 'admin-item' : ''} ${(action as any).isServices ? 'services-item' : ''}`}
              style={{ 
                '--glow-color': action.color,
                background: action.isPremium ? 'linear-gradient(135deg, rgba(197, 160, 89, 0.15) 0%, rgba(139, 105, 20, 0.1) 100%)' : (action as any).isServices ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.08) 100%)' : '#1a1510',
                border: action.isPremium ? '1px solid rgba(197, 160, 89, 0.4)' : (action as any).isServices ? '1px solid rgba(255, 215, 0, 0.4)' : '1px solid #2a2215',
                borderRadius: '12px',
                padding: 'clamp(8px, 2.5vw, 12px) 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                color: '#fff',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              } as React.CSSProperties}
              onClick={() => handleQuickAction(action.action)}
            >
              {action.isPremium && (
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', boxShadow: '0 2px 8px rgba(197, 160, 89, 0.5)', zIndex: 10 }}>💎</div>
              )}
              {(action as any).isServices && (
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', boxShadow: '0 2px 8px rgba(255, 215, 0, 0.5)', zIndex: 10, animation: 'paywallPulse 2s ease-in-out infinite' }}>🛍️</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, filter: `drop-shadow(0 0 6px ${action.color})`, color: action.color }}>
                {action.icon}
              </div>
              <span style={{ fontSize: '10px', color: '#fff', fontWeight: 600, textAlign: 'center', lineHeight: 1.1 }}>{action.label}</span>
              {action.sublabel && <span style={{ fontSize: '9px', color: '#b3a68c', textAlign: 'center', lineHeight: 1.1 }}>{action.sublabel}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}