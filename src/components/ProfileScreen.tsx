import { useEffect, useState } from 'react';
import './ProfileScreen.css';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { updateUser, resetZodiacSign } from '../lib/userService';
import { getActiveSubscription } from '../lib/subscriptionService';
import { supabase } from '../lib/supabase';

interface Props {
  onNavigate?: (screen: string) => void;
}

// 🆕 ექსპონენციალური ლეველის ლოგიკა
const getXPToNextLevel = (level: number): number => {
  if (level === 1) return 100;
  if (level === 2) return 250;
  if (level === 3) return 500;
  if (level === 4) return 1000;
  if (level === 5) return 2000;
  // 6-ე ლეველიდან იწყება ექსპონენციალური ზრდა (1.8-ჯერ მეტი წინაზე)
  return Math.floor(2000 * Math.pow(1.8, level - 5));
};

const getLevelTitle = (level: number): string => {
  if (level >= 20) return 'CELESTIAL';
  if (level >= 10) return 'ORACLE';
  if (level >= 5) return 'MYSTIC';
  return 'SEEKER';
};

const getLevelFromTotalXP = (totalXP: number) => {
  let level = 1;
  let xpRequiredForNext = getXPToNextLevel(level);
  let currentLevelXP = totalXP;
  
  while (currentLevelXP >= xpRequiredForNext) {
    currentLevelXP -= xpRequiredForNext;
    level++;
    xpRequiredForNext = getXPToNextLevel(level);
  }
  
  return { level, currentLevelXP, xpToNext: xpRequiredForNext };
};

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

interface Stat {
  label: string;
  value: string | number;
  icon: string;
}

interface SignInfo {
  name: string;
  symbol: string;
  element: string;
  planet: string;
}

interface Reading {
  id: string;
  type: string;
  icon: string;
  date: string;
  cards: string[];
}

// ===== PILL TABS COMPONENT =====
function PillTabs({ 
  activeTab, 
  setActiveTab 
}: { 
  activeTab: 'profile' | 'achievements' | 'settings';
  setActiveTab: (tab: 'profile' | 'achievements' | 'settings') => void;
}) {
  return (
    <div className="pill-tabs">
      <button 
        className={`pill-tab ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
      >
        👤 Profile
      </button>
      <button 
        className={`pill-tab ${activeTab === 'achievements' ? 'active' : ''}`}
        onClick={() => setActiveTab('achievements')}
      >
        🏆 Awards
      </button>
      <button 
        className={`pill-tab ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        ⚙️ Settings
      </button>
    </div>
  );
}

export default function ProfileScreen({ onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<'profile' | 'achievements' | 'settings'>('profile');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showBirthInfo, setShowBirthInfo] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [editSection, setEditSection] = useState<'personal' | 'astrology' | 'preferences'>('personal');
  const [mounted, setMounted] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  
  const { user, setUser, loading } = useUser();
  const { settings, updateSetting } = useSettings();

  useEffect(() => {
    console.log('👤 ProfileScreen mounted');
    console.log('👤 User from context:', user);
    setMounted(true);
  }, [user]);

  useEffect(() => {
    if (user) {
      getActiveSubscription(user.id).then(sub => {
        setActiveSubscription(sub);
      });
    }
  }, [user]);

  // 🆕 დინამიური ლეველის გამოთვლა ჯამური XP-დან
  const userLevelData = user ? getLevelFromTotalXP(user.xp || 0) : { level: 1, currentLevelXP: 0, xpToNext: 100 };

  const userData = user ? {
    telegramUsername: '@' + (user.username || 'user'),
    displayName: user.display_name || 'User',
    bio: user.bio || '',
    sunSign: user.sun_sign || '',
    moonSign: user.moon_sign || '',
    risingSign: user.rising_sign || '',
    partnerSign: user.partner_sign || '',
    birthDate: user.birth_date || '',
    birthTime: user.birth_time || '',
    birthPlace: user.birth_place || '',
    zodiac: user.sun_sign || '',
    zodiacSymbol: '♏', // ეს შეიძლება დინამიურიც გახდეს, მაგრამ ჯერ ასე დავტოვოთ
    element: 'Water',
    level: userLevelData.level,
    levelTitle: getLevelTitle(userLevelData.level),
    xp: userLevelData.currentLevelXP, // XP მიმდინარე ლეველში
    xpToNext: userLevelData.xpToNext,  // XP რაც სჭირდება შემდეგ ლეველამდე
    memberSince: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    avatar: user.display_name?.charAt(0).toUpperCase() || 'U',
    currentPlan: user.current_plan || 'FREE',
    gems: user.gems || 0,
    streak: user.streak || 0,
  } : null;

  const collectionData = {
    total: 78,
    collected: 62,
    majorArcana: { collected: 22, total: 22 },
    wands: { collected: 12, total: 14 },
    cups: { collected: 10, total: 14 },
    swords: { collected: 9, total: 14 },
    pentacles: { collected: 9, total: 14 },
  };

  const moonPhase = {
    phase: 'Waxing Gibbous',
    symbol: '🌔',
    illumination: 85,
    zodiac: 'Sagittarius',
    bestFor: 'Manifestation, Action, Growth',
    nextFull: '3 days',
  };

  const recentReadings: Reading[] = [
    { id: '1', type: 'Daily Card', icon: '🔮', date: '2h ago', cards: ['The Star'] },
    { id: '2', type: 'Love Spread', icon: '💕', date: 'Yesterday', cards: ['The Lovers', 'Two of Cups', 'Ace of Wands'] },
    { id: '3', type: 'Celtic Cross', icon: '✝️', date: '3 days ago', cards: ['The Moon', 'The Tower', 'The Sun'] },
    { id: '4', type: 'Past/Present/Future', icon: '⏳', date: '5 days ago', cards: ['Death', 'The Magician', 'The Star'] },
  ];

  const mySigns: { label: string; icon: string; sign: SignInfo }[] = [
    { label: 'Sun Sign', icon: '☀️', sign: { name: userData?.sunSign || '', symbol: '♏', element: 'Water', planet: 'Mars' } },
    { label: 'Moon Sign', icon: '🌙', sign: { name: userData?.moonSign || '', symbol: '♓', element: 'Water', planet: 'Neptune' } },
    { label: 'Rising Sign', icon: '⬆️', sign: { name: userData?.risingSign || '', symbol: '♎', element: 'Air', planet: 'Venus' } },
  ];

  const stats: Stat[] = [
    { label: 'Readings', value: 156, icon: '🔮' },
    { label: 'Cards', value: '78/78', icon: '🃏' },
    { label: 'Streak', value: userData?.streak || 0, icon: '🔥' },
    { label: 'Gems', value: userData?.gems || 0, icon: '💎' },
  ];

  const achievements: Achievement[] = [
    { id: '1', icon: '🎯', title: 'First Reading', description: 'Complete your first tarot reading', unlocked: true },
    { id: '2', icon: '🔥', title: '7-Day Streak', description: 'Use the app 7 days in a row', unlocked: true },
    { id: '3', icon: '📚', title: 'Collector', description: 'Collect all 78 tarot cards', unlocked: true, progress: 78, total: 78 },
    { id: '4', icon: '💕', title: 'Love Expert', description: 'Complete 50 love readings', unlocked: false, progress: 32, total: 50 },
    { id: '5', icon: '🌙', title: 'Moon Master', description: 'Complete 10 moon rituals', unlocked: false, progress: 6, total: 10 },
    { id: '6', icon: '⭐', title: 'Daily User', description: 'Use the app for 30 consecutive days', unlocked: false, progress: 12, total: 30 },
    { id: '7', icon: '🔮', title: 'Oracle', description: 'Complete 100 readings', unlocked: false, progress: 156, total: 100 },
    { id: '8', icon: '💰', title: 'High Roller', description: 'Spin the wheel 100 times', unlocked: false, progress: 23, total: 100 },
  ];

  const handleSettingClick = async (setting: string) => {
    console.log(`Setting clicked: ${setting}`);
    
    if (setting === 'subscription' && onNavigate) {
      if (activeSubscription) {
        onNavigate('subscription');
      } else {
        onNavigate('services');
      }
    } else if (setting === 'logout') {
      try {
        console.log('🚪 Initiating safe logout with onboarding reset...');
        
        if (user && supabase) {
          await supabase
            .from('users')
            .update({ onboarding_completed: false })
            .eq('id', user.id);
          console.log('✅ Onboarding flag reset in database (Data preserved)');
        }

        localStorage.clear();
        sessionStorage.clear();
        
        if (supabase) {
          await supabase.auth.signOut();
        }
        
        window.location.href = '/';
        
      } catch (error) {
        console.error('❌ Error logging out:', error);
        alert('გასვლა ვერ მოხერხდა. გთხოვთ, სცადოთ მოგვიანებით.');
      }
    }
  };

  const handleChangeSign = () => {
    console.log('🔄 Changing zodiac sign...');
    if (onNavigate) {
      onNavigate('sign-selection');
    }
  };

  const handleResetSign = async () => {
    if (!user) {
      console.warn('⚠️ No user to reset');
      return;
    }

    setResetting(true);
    
    try {
      console.log('🗑️ Resetting zodiac sign...');
      const updatedUser = await resetZodiacSign(user.id);
      
      if (updatedUser) {
        setUser(updatedUser);
        console.log('✅ Zodiac sign reset successfully');
        setShowResetConfirm(false);
        
        if (onNavigate) {
          onNavigate('sign-selection');
        }
      }
    } catch (error) {
      console.error('❌ Error resetting zodiac sign:', error);
      alert('Failed to reset zodiac sign. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const handleSaveEdit = async (section: string, data: any) => {
    if (!user) {
      console.warn('⚠️ No current user - cannot save to Supabase');
      return;
    }

    const updates: any = {};
    
    if (section === 'personal') {
      if (data.displayName) updates.display_name = data.displayName;
      if (data.bio !== undefined) updates.bio = data.bio;
    } else if (section === 'astrology') {
      if (data.sunSign) updates.sun_sign = data.sunSign;
      if (data.moonSign) updates.moon_sign = data.moonSign;
      if (data.risingSign) updates.rising_sign = data.risingSign;
      if (data.partnerSign !== undefined) updates.partner_sign = data.partnerSign;
      if (data.birthDate) updates.birth_date = data.birthDate;
      if (data.birthTime) updates.birth_time = data.birthTime;
      if (data.birthPlace) updates.birth_place = data.birthPlace;
    }

    const updatedUser = await updateUser(user.id, updates);
    if (updatedUser) {
      setUser(updatedUser);
      console.log(`✅ Saved ${section}:`, updates);
    }
  };

  const handleSaveBirthInfo = async (date: string, time: string, place: string) => {
    if (!user) {
      console.warn('⚠️ No current user - cannot save birth info');
      setShowBirthInfo(false);
      return;
    }

    const updates = {
      birth_date: date,
      birth_time: time,
      birth_place: place,
    };

    const updatedUser = await updateUser(user.id, updates);
    if (updatedUser) {
      setUser(updatedUser);
      console.log('✅ Birth info saved:', updates);
    }
    
    setShowBirthInfo(false);
  };

  const xpProgress = userData ? (userData.xp / userData.xpToNext) * 100 : 0;
  const collectionProgress = (collectionData.collected / collectionData.total) * 100;

  const getPlanConfig = (plan: string) => {
    const configs: Record<string, { icon: string; color: string; glow: string }> = {
      SEEKER: { icon: '🌑', color: '#888', glow: 'rgba(136, 136, 136, 0.5)' },
      MYSTIC: { icon: '🌙', color: '#ffe566', glow: 'rgba(255, 229, 102, 0.5)' },
      ORACLE: { icon: '🌕', color: '#a78bfa', glow: 'rgba(167, 139, 250, 0.5)' },
      CELESTIAL: { icon: '✨', color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.5)' },
      FREE: { icon: '🌑', color: '#888', glow: 'rgba(136, 136, 136, 0.5)' },
    };
    return configs[plan] || configs.FREE;
  };

  const planConfig = userData ? getPlanConfig(userData.currentPlan) : getPlanConfig('FREE');

  if (loading || !userData) {
    return (
      <div className="screen-container profile">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ffe566' }}>
          Loading profile...
        </div>
      </div>
    );
  }

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

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-tab">
            <div className="hero-card animate-fade-in stagger-1">
              <div className="hero-shimmer"></div>
              
              <div className="hero-plan-badge" style={{ '--plan-color': planConfig.color } as React.CSSProperties}>
                <span className="plan-badge-icon">{planConfig.icon}</span>
                <span className="plan-badge-text">{userData.currentPlan}</span>
              </div>

              <div className="hero-top-row">
                <div className="hero-avatar">
                  <span className="avatar-letter">{userData.avatar}</span>
                  <div className="avatar-ring"></div>
                  <button 
                    className="avatar-edit-btn" 
                    onClick={() => setShowEditProfile(true)}
                    aria-label="Edit profile"
                  >
                    ✏️
                  </button>
                </div>
                <div className="hero-user-info">
                  <h2 className="hero-username">{userData.displayName}</h2>
                  <p className="hero-zodiac">
                    {userData.zodiacSymbol} {userData.zodiac} · {userData.element}
                  </p>
                </div>
              </div>

              {/* 🆕 დინამიური ლეველის სექცია */}
              <div className="hero-level-section">
                <div className="hero-level-header">
                  <span className="hero-level-text">
                    Lv.{userData.level} <span className="level-title">{userData.levelTitle}</span>
                  </span>
                  <span className="hero-xp-text">{userData.xp} / {userData.xpToNext} XP</span>
                </div>
                <div className="hero-progress-bar">
                  <div 
                    className="hero-progress-fill" 
                    style={{ width: mounted ? `${xpProgress}%` : '0%' }}
                  >
                    <div className="progress-shimmer"></div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '10px', color: '#888', marginTop: '4px' }}>
                  {userData.xpToNext - userData.xp} XP to Level {userData.level + 1}
                </div>
              </div>

              <PillTabs activeTab={activeTab} setActiveTab={setActiveTab} />

              <div className="hero-stats-row">
                <div className="hero-stat">
                  <span className="hero-stat-icon">💎</span>
                  <span className="hero-stat-value">{userData.gems.toLocaleString()}</span>
                  <span className="hero-stat-label">Gems</span>
                </div>
                <div className="hero-stat-divider"></div>
                <div className="hero-stat">
                  <span className="hero-stat-icon">🔥</span>
                  <span className="hero-stat-value">{userData.streak}</span>
                  <span className="hero-stat-label">Day Streak</span>
                </div>
                <div className="hero-stat-divider"></div>
                <div className="hero-stat">
                  <span className="hero-stat-icon">📅</span>
                  <span className="hero-stat-value" style={{ fontSize: '10px' }}>{userData.memberSince}</span>
                  <span className="hero-stat-label">Member</span>
                </div>
              </div>
            </div>

            {/* ... დანარჩენი კომპონენტები (Moon Phase, Collection, My Signs, Recent Readings, Stats) უცვლელი რჩება ... */}
            <div className="moon-phase-card animate-fade-in stagger-2">
              <h3 className="card-title">✦ MOON PHASE ✦</h3>
              <div className="moon-content">
                <div className="moon-symbol">{moonPhase.symbol}</div>
                <div className="moon-info">
                  <div className="moon-phase-name">{moonPhase.phase}</div>
                  <div className="moon-details">
                    {moonPhase.zodiac} · {moonPhase.illumination}% Illuminated
                  </div>
                  <div className="moon-best-for">
                    Best for: {moonPhase.bestFor}
                  </div>
                  <div className="moon-next-full">
                    Next Full Moon: {moonPhase.nextFull}
                  </div>
                </div>
              </div>
            </div>

            <div className="collection-card animate-fade-in stagger-3">
              <h3 className="card-title">✦ MY COLLECTION ✦</h3>
              <div className="collection-progress">
                <div className="collection-total">
                  <span className="collection-count">{collectionData.collected}/{collectionData.total}</span>
                  <span className="collection-label">Cards Collected</span>
                </div>
                <div className="collection-bar">
                  <div 
                    className="collection-fill" 
                    style={{ width: mounted ? `${collectionProgress}%` : '0%' }}
                  ></div>
                </div>
              </div>
              <div className="collection-suits">
                <div className="suit-item">
                  <span className="suit-icon">🎴</span>
                  <span className="suit-name">Major</span>
                  <span className="suit-count">{collectionData.majorArcana.collected}/{collectionData.majorArcana.total}</span>
                </div>
                <div className="suit-item">
                  <span className="suit-icon">🔥</span>
                  <span className="suit-name">Wands</span>
                  <span className="suit-count">{collectionData.wands.collected}/{collectionData.wands.total}</span>
                </div>
                <div className="suit-item">
                  <span className="suit-icon">💧</span>
                  <span className="suit-name">Cups</span>
                  <span className="suit-count">{collectionData.cups.collected}/{collectionData.cups.total}</span>
                </div>
                <div className="suit-item">
                  <span className="suit-icon">💨</span>
                  <span className="suit-name">Swords</span>
                  <span className="suit-count">{collectionData.swords.collected}/{collectionData.swords.total}</span>
                </div>
                <div className="suit-item">
                  <span className="suit-icon">🌍</span>
                  <span className="suit-name">Pentacles</span>
                  <span className="suit-count">{collectionData.pentacles.collected}/{collectionData.pentacles.total}</span>
                </div>
              </div>
              <button className="view-collection-btn" onClick={() => onNavigate && onNavigate('cards')}>
                <span>View Collection</span>
                <span className="arrow">→</span>
              </button>
            </div>

            <div className="my-signs-card animate-fade-in stagger-4">
              <h3 className="card-title">✦ MY SIGNS ✦</h3>
              <div className="signs-grid">
                {mySigns.map((item, index) => (
                  <div key={index} className="sign-item">
                    <div className="sign-icon">{item.icon}</div>
                    <div className="sign-label">{item.label}</div>
                    <div className="sign-name">
                      {item.sign.symbol} {item.sign.name}
                    </div>
                    <div className="sign-details">
                      {item.sign.element} · {item.sign.planet}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="sign-actions">
                <button className="change-sign-btn" onClick={handleChangeSign}>
                  <span>🔄 Change Sign</span>
                </button>
                <button className="reset-sign-btn" onClick={() => setShowResetConfirm(true)}>
                  <span>🗑️ Reset Sign</span>
                </button>
              </div>

              <button className="birth-chart-btn" onClick={() => setShowBirthInfo(true)}>
                <span>View Birth Chart</span>
                <span className="arrow">→</span>
              </button>
            </div>

            <div className="recent-readings-card animate-fade-in stagger-5">
              <h3 className="card-title">✦ RECENT READINGS ✦</h3>
              <div className="readings-list">
                {recentReadings.map((reading) => (
                  <div key={reading.id} className="reading-item">
                    <div className="reading-icon">{reading.icon}</div>
                    <div className="reading-info">
                      <div className="reading-type">{reading.type}</div>
                      <div className="reading-cards">{reading.cards.join(' · ')}</div>
                    </div>
                    <div className="reading-date">{reading.date}</div>
                  </div>
                ))}
              </div>
              <button className="view-all-btn">
                <span>View All Readings</span>
                <span className="arrow">→</span>
              </button>
            </div>

            <div className="stats-grid-section animate-fade-in stagger-6">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <PillTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <h3 className="section-title">✦ ACHIEVEMENTS ✦</h3>
            <div className="achievements-list">
              {achievements.map((achievement, index) => (
                <div
                  key={achievement.id}
                  className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} animate-fade-in stagger-${index + 1}`}
                >
                  <div className="achievement-icon">
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>
                  <div className="achievement-info">
                    <h4 className="achievement-title">{achievement.title}</h4>
                    <p className="achievement-desc">{achievement.description}</p>
                    {achievement.progress !== undefined && (
                      <div className="achievement-progress">
                        <div className="progress-bar-small">
                          <div
                            className="progress-fill-small"
                            style={{ width: mounted ? `${(achievement.progress / (achievement.total || 1)) * 100}%` : '0%' }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {achievement.progress} / {achievement.total}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-tab">
            <PillTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <h3 className="section-title">✦ SETTINGS ✦</h3>
            
            <div className="settings-section">
              <h4 className="settings-section-title">🎨 Appearance</h4>
              
              <div className="setting-item animate-fade-in stagger-1">
                <span className="setting-icon">🌗</span>
                <div className="setting-content">
                  <span className="setting-label">Theme</span>
                  <div className="theme-options">
                    <button 
                      className={`theme-option-mini ${settings.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => updateSetting('theme', 'dark')}
                    >
                      🌙 Dark
                    </button>
                    <button 
                      className={`theme-option-mini ${settings.theme === 'light' ? 'active' : ''}`}
                      onClick={() => updateSetting('theme', 'light')}
                    >
                      ☀️ Light
                    </button>
                    <button 
                      className={`theme-option-mini ${settings.theme === 'auto' ? 'active' : ''}`}
                      onClick={() => updateSetting('theme', 'auto')}
                    >
                      ⚙️ Auto
                    </button>
                  </div>
                </div>
              </div>

              <div className="setting-item animate-fade-in stagger-2">
                <span className="setting-icon">🌐</span>
                <div className="setting-content">
                  <span className="setting-label">Language</span>
                  <select 
                    className="form-input form-select settings-select"
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value as any)}
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="ka">🇬🇪 ქართული</option>
                    <option value="ru">🇷🇺 Русский</option>
                    <option value="es">🇪🇸 Español</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h4 className="settings-section-title">🔔 Notifications</h4>
              
              <div className="setting-item animate-fade-in stagger-3">
                <span className="setting-icon">📅</span>
                <div className="setting-content">
                  <span className="setting-label">Daily Card Reminder</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.dailyReminder}
                      onChange={(e) => updateSetting('dailyReminder', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {settings.dailyReminder && (
                <div className="setting-item sub-setting animate-fade-in stagger-4">
                  <span className="setting-icon">⏰</span>
                  <div className="setting-content">
                    <span className="setting-label">Reminder Time</span>
                    <input 
                      type="time" 
                      className="form-input settings-time-input"
                      value={settings.reminderTime}
                      onChange={(e) => updateSetting('reminderTime', e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="setting-item animate-fade-in stagger-5">
                <span className="setting-icon">🌙</span>
                <div className="setting-content">
                  <span className="setting-label">Horoscope Notifications</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.horoscopeNotifs}
                      onChange={(e) => updateSetting('horoscopeNotifs', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item animate-fade-in stagger-6">
                <span className="setting-icon">🌕</span>
                <div className="setting-content">
                  <span className="setting-label">Moon Phase Alerts</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.moonPhaseAlerts}
                      onChange={(e) => updateSetting('moonPhaseAlerts', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h4 className="settings-section-title">🔊 Sounds & Feedback</h4>
              
              <div className="setting-item animate-fade-in stagger-7">
                <span className="setting-icon">🔊</span>
                <div className="setting-content">
                  <span className="setting-label">Sound Effects</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.soundEffects}
                      onChange={(e) => updateSetting('soundEffects', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-item animate-fade-in stagger-8">
                <span className="setting-icon">📳</span>
                <div className="setting-content">
                  <span className="setting-label">Haptic Feedback</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.hapticFeedback}
                      onChange={(e) => updateSetting('hapticFeedback', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h4 className="settings-section-title">💎 Account</h4>
              
              <div 
                className="setting-item premium animate-fade-in stagger-9" 
                onClick={() => handleSettingClick('subscription')}
              >
                <span className="setting-icon">💎</span>
                <span className="setting-label">Subscription</span>
                <span className="setting-badge">{activeSubscription ? 'ACTIVE' : 'FREE'}</span>
                <span className="setting-arrow">→</span>
              </div>

              <div className="setting-item animate-fade-in stagger-10" onClick={() => handleSettingClick('support')}>
                <span className="setting-icon">📧</span>
                <span className="setting-label">Support</span>
                <span className="setting-arrow">→</span>
              </div>

              <div className="setting-item animate-fade-in stagger-11" onClick={() => handleSettingClick('about')}>
                <span className="setting-icon">ℹ️</span>
                <span className="setting-label">About</span>
                <span className="setting-arrow">→</span>
              </div>

              <div className="setting-item danger animate-fade-in stagger-12" onClick={() => handleSettingClick('logout')}>
                <span className="setting-icon">🚪</span>
                <span className="setting-label">Logout</span>
                <span className="setting-arrow">→</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEditProfile && (
        <EditProfileModal
          userData={userData}
          editSection={editSection}
          setEditSection={setEditSection}
          onSave={handleSaveEdit}
          onClose={() => setShowEditProfile(false)}
          onEditBirthInfo={() => {
            setShowEditProfile(false);
            setShowBirthInfo(true);
          }}
        />
      )}

      {showBirthInfo && (
        <BirthInfoModal
          birthDate={userData.birthDate}
          birthTime={userData.birthTime}
          birthPlace={userData.birthPlace}
          onSave={handleSaveBirthInfo}
          onClose={() => setShowBirthInfo(false)}
        />
      )}

      {showResetConfirm && (
        <ResetConfirmModal
          resetting={resetting}
          onConfirm={handleResetSign}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}

// ===== EDIT PROFILE MODAL =====
function EditProfileModal({ 
  userData, editSection, setEditSection, onSave, onClose, onEditBirthInfo,
}: { 
  userData: any; 
  editSection: 'personal' | 'astrology' | 'preferences';
  setEditSection: (s: 'personal' | 'astrology' | 'preferences') => void;
  onSave: (section: string, data: any) => void; 
  onClose: () => void;
  onEditBirthInfo: () => void;
}) {
  const [formData, setFormData] = useState(userData);

  const zodiacSigns = [
    { name: 'Aries', symbol: '♈', element: 'Fire' },
    { name: 'Taurus', symbol: '♉', element: 'Earth' },
    { name: 'Gemini', symbol: '♊', element: 'Air' },
    { name: 'Cancer', symbol: '♋', element: 'Water' },
    { name: 'Leo', symbol: '♌', element: 'Fire' },
    { name: 'Virgo', symbol: '♍', element: 'Earth' },
    { name: 'Libra', symbol: '♎', element: 'Air' },
    { name: 'Scorpio', symbol: '♏', element: 'Water' },
    { name: 'Sagittarius', symbol: '♐', element: 'Fire' },
    { name: 'Capricorn', symbol: '♑', element: 'Earth' },
    { name: 'Aquarius', symbol: '♒', element: 'Air' },
    { name: 'Pisces', symbol: '♓', element: 'Water' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editSection, formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title">✦ EDIT PROFILE ✦</h2>
        
        <div className="edit-section-tabs">
          <button type="button" className={`edit-tab ${editSection === 'personal' ? 'active' : ''}`} onClick={() => setEditSection('personal')}>
            👤 Personal
          </button>
          <button type="button" className={`edit-tab ${editSection === 'astrology' ? 'active' : ''}`} onClick={() => setEditSection('astrology')}>
            ✨ Astro
          </button>
          <button type="button" className={`edit-tab ${editSection === 'preferences' ? 'active' : ''}`} onClick={() => setEditSection('preferences')}>
            ⚙️ Settings
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {editSection === 'personal' && (
            <div className="edit-section">
              <div className="edit-avatar-section">
                <div className="edit-avatar-circle">
                  <span>{userData.avatar}</span>
                </div>
                <div className="edit-avatar-info">
                  <div className="edit-telegram-name">{userData.telegramUsername}</div>
                  <button type="button" className="edit-avatar-btn">Change Avatar</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input type="text" className="form-input" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} placeholder="Your display name" />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-input form-textarea" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell us about yourself..." maxLength={150} rows={3} />
                <span className="char-count">{formData.bio.length}/150</span>
              </div>
            </div>
          )}

          {editSection === 'astrology' && (
            <div className="edit-section">
              <div className="form-group">
                <label className="form-label">☀️ Sun Sign</label>
                <select className="form-input form-select" value={formData.sunSign} onChange={(e) => setFormData({ ...formData, sunSign: e.target.value })}>
                  {zodiacSigns.map(sign => <option key={sign.name} value={sign.name}>{sign.symbol} {sign.name} ({sign.element})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">🌙 Moon Sign</label>
                <select className="form-input form-select" value={formData.moonSign} onChange={(e) => setFormData({ ...formData, moonSign: e.target.value })}>
                  {zodiacSigns.map(sign => <option key={sign.name} value={sign.name}>{sign.symbol} {sign.name} ({sign.element})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">⬆️ Rising Sign</label>
                <select className="form-input form-select" value={formData.risingSign} onChange={(e) => setFormData({ ...formData, risingSign: e.target.value })}>
                  {zodiacSigns.map(sign => <option key={sign.name} value={sign.name}>{sign.symbol} {sign.name} ({sign.element})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">💕 Partner's Sign (Optional)</label>
                <select className="form-input form-select" value={formData.partnerSign} onChange={(e) => setFormData({ ...formData, partnerSign: e.target.value })}>
                  <option value="">None</option>
                  {zodiacSigns.map(sign => <option key={sign.name} value={sign.name}>{sign.symbol} {sign.name}</option>)}
                </select>
              </div>
              <button type="button" className="edit-birth-info-btn" onClick={onEditBirthInfo}>Edit Birth Info →</button>
            </div>
          )}

          {editSection === 'preferences' && (
            <div className="edit-section">
              <p>Edit preferences in Settings tab</p>
            </div>
          )}

          <button type="submit" className="modal-submit-btn">SAVE CHANGES</button>
        </form>
      </div>
    </div>
  );
}

// ===== BIRTH INFO MODAL =====
function BirthInfoModal({ birthDate, birthTime, birthPlace, onSave, onClose }: {
  birthDate: string; birthTime: string; birthPlace: string;
  onSave: (date: string, time: string, place: string) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({ date: birthDate, time: birthTime, place: birthPlace });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData.date, formData.time, formData.place);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title">✦ BIRTH INFO ✦</h2>
        <p className="modal-subtitle">Required for accurate birth chart</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Time of Birth</label>
            <input type="time" className="form-input" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Place of Birth</label>
            <input type="text" className="form-input" value={formData.place} onChange={(e) => setFormData({ ...formData, place: e.target.value })} placeholder="City, Country" />
          </div>
          <button type="submit" className="modal-submit-btn">SAVE BIRTH INFO</button>
        </form>
      </div>
    </div>
  );
}

// ===== RESET CONFIRMATION MODAL =====
function ResetConfirmModal({ 
  resetting, 
  onConfirm, 
  onCancel 
}: { 
  resetting: boolean; 
  onConfirm: () => void; 
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content reset-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reset-icon">⚠️</div>
        <h2 className="modal-title">Reset Zodiac Sign?</h2>
        <p className="reset-message">
          This will remove your current zodiac sign and birth information. 
          You'll need to select your sign again to continue using the horoscope features.
        </p>
        <div className="reset-actions">
          <button 
            className="reset-cancel-btn" 
            onClick={onCancel}
            disabled={resetting}
          >
            Cancel
          </button>
          <button 
            className="reset-confirm-btn" 
            onClick={onConfirm}
            disabled={resetting}
          >
            {resetting ? 'Resetting...' : 'Reset Sign'}
          </button>
        </div>
      </div>
    </div>
  );
}