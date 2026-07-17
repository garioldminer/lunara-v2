import { useEffect, useState } from 'react';
import './ProfileScreen.css';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { updateUser, resetZodiacSign } from '../lib/userService';
import { getActiveSubscription } from '../lib/subscriptionService';
import { supabase } from '../lib/supabase';
import { Bug, X, Star, Heart, BookOpen, Lock, Infinity } from 'lucide-react';

interface Props {
  onNavigate?: (screen: string) => void;
}

// ==========================================
// დინამიური მონაცემების ჰელპერები
// ==========================================
const ZODIAC_DATA: Record<string, { symbol: string; element: string; planet: string }> = {
  Aries: { symbol: '♈', element: 'Fire', planet: 'Mars' },
  Taurus: { symbol: '♉', element: 'Earth', planet: 'Venus' },
  Gemini: { symbol: '♊', element: 'Air', planet: 'Mercury' },
  Cancer: { symbol: '♋', element: 'Water', planet: 'Moon' },
  Leo: { symbol: '♌', element: 'Fire', planet: 'Sun' },
  Virgo: { symbol: '♍', element: 'Earth', planet: 'Mercury' },
  Libra: { symbol: '♎', element: 'Air', planet: 'Venus' },
  Scorpio: { symbol: '♏', element: 'Water', planet: 'Pluto' },
  Sagittarius: { symbol: '♐', element: 'Fire', planet: 'Jupiter' },
  Capricorn: { symbol: '♑', element: 'Earth', planet: 'Saturn' },
  Aquarius: { symbol: '♒', element: 'Air', planet: 'Uranus' },
  Pisces: { symbol: '♓', element: 'Water', planet: 'Neptune' },
};

const getSignInfo = (signName: string) => {
  if (!signName) return { symbol: '✨', element: 'Unknown', planet: 'Unknown' };
  const capitalized = signName.charAt(0).toUpperCase() + signName.slice(1).toLowerCase();
  return ZODIAC_DATA[capitalized] || { symbol: '✨', element: 'Unknown', planet: 'Unknown' };
};

const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getDynamicMoonPhase = () => {
  const dayOfYear = getDayOfYear(new Date());
  const lunarCycle = 29.53;
  const phaseIndex = Math.floor(((dayOfYear % lunarCycle) / lunarCycle) * 8) % 8;
  const phases = [
    { phase: 'New Moon', symbol: '🌑', bestFor: 'New beginnings, Setting intentions' },
    { phase: 'Waxing Crescent', symbol: '🌒', bestFor: 'Action, Building momentum' },
    { phase: 'First Quarter', symbol: '🌓', bestFor: 'Decisions, Overcoming obstacles' },
    { phase: 'Waxing Gibbous', symbol: '🌔', bestFor: 'Refinement, Preparation' },
    { phase: 'Full Moon', symbol: '🌕', bestFor: 'Culmination, Release, Celebration' },
    { phase: 'Waning Gibbous', symbol: '🌖', bestFor: 'Gratitude, Sharing wisdom' },
    { phase: 'Last Quarter', symbol: '🌗', bestFor: 'Release, Forgiveness, Letting go' },
    { phase: 'Waning Crescent', symbol: '🌘', bestFor: 'Rest, Reflection, Surrender' },
  ];
  
  const current = phases[phaseIndex];
  const illumination = Math.floor(((dayOfYear % lunarCycle) / lunarCycle) * 100);
  
  return {
    phase: current.phase,
    symbol: current.symbol,
    illumination: illumination,
    zodiac: 'Dynamic',
    bestFor: current.bestFor,
    nextFull: 'Calculated dynamically'
  };
};

const timeAgo = (dateString: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ==========================================
// ლეველის ლოგიკა
// ==========================================
const getXPToNextLevel = (level: number): number => {
  if (level === 1) return 100;
  if (level === 2) return 250;
  if (level === 3) return 500;
  if (level === 4) return 1000;
  if (level === 5) return 2000;
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

// ==========================================
// ინტერფეისები
// ==========================================
interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  total: number;
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

interface CoreTrait {
  title: string;
  sign: string;
  description: string;
  icon: string;
}

interface Reading {
  id: string;
  type: string;
  icon: string;
  date: string;
  cards: string[];
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
  const [recentReadings, setRecentReadings] = useState<Reading[]>([]);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  const [showDebug, setShowDebug] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const { user, setUser, loading } = useUser();
  const { settings, updateSetting } = useSettings();

  useEffect(() => {
    setMounted(true);
    if (user?.id === 'c9dbe3be-5c02-4034-8bfd-1d693eb02754') {
      setIsUserAdmin(true);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getActiveSubscription(user.id).then(setActiveSubscription);
      
      if (supabase) {
        supabase
          .from('reading_history')
          .select('reading_type, created_at, cards')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4)
          .then(({ data }) => {
            if (data && data.length > 0) {
              setRecentReadings(data.map((r: any, idx: number) => ({
                id: `r-${idx}`,
                type: r.reading_type || 'Unknown Reading',
                icon: '🔮',
                date: timeAgo(r.created_at),
                cards: r.cards || []
              })));
            }
          });
      }
    }
  }, [user]);

  const userLevelData = user ? getLevelFromTotalXP(user.xp || 0) : { level: 1, currentLevelXP: 0, xpToNext: 100 };
  const sunSignData = getSignInfo(user?.sun_sign || '');

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
    zodiacSymbol: sunSignData.symbol,
    element: sunSignData.element,
    level: userLevelData.level,
    levelTitle: getLevelTitle(userLevelData.level),
    xp: userLevelData.currentLevelXP,
    xpToNext: userLevelData.xpToNext,
    memberSince: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    avatar: user.display_name?.charAt(0).toUpperCase() || 'U',
    currentPlan: user.current_plan || 'FREE',
    gems: user.gems || 0,
    streak: user.streak || 0,
    readingsCount: (user as any).readings_count || 0,
    cardsCollected: (user as any).cards_collected || 0,
  } : null;

  const coreTraits: CoreTrait[] = userData ? [
    { title: 'Sun Sign', sign: userData.sunSign || 'Unknown', description: 'Your core identity.', icon: '☀️' },
    { title: 'Moon Sign', sign: userData.moonSign || 'Unknown', description: 'Your inner emotions.', icon: '🌙' },
    { title: 'Rising Sign', sign: userData.risingSign || 'Unknown', description: 'First impressions.', icon: '⬆️' },
  ] : [];

  const mySigns: { label: string; icon: string; sign: SignInfo }[] = userData ? [
    { label: 'Sun', icon: '☀️', sign: { name: userData.sunSign, ...getSignInfo(userData.sunSign) } },
    { label: 'Moon', icon: '🌙', sign: { name: userData.moonSign, ...getSignInfo(userData.moonSign) } },
    { label: 'Rising', icon: '⬆️', sign: { name: userData.risingSign, ...getSignInfo(userData.risingSign) } },
  ] : [];

  const stats: Stat[] = userData ? [
    { label: 'Readings', value: userData.readingsCount || recentReadings.length, icon: '🔮' },
    { label: 'Cards', value: `${userData.cardsCollected}/78`, icon: '🃏' },
    { label: 'Streak', value: userData.streak, icon: '🔥' },
    { label: 'Gems', value: userData.gems, icon: '💎' },
  ] : [];

  const achievements: Achievement[] = userData ? [
    { id: '1', icon: '🎯', title: 'First Reading', description: 'Complete your first tarot reading', unlocked: (userData.readingsCount || recentReadings.length) >= 1, progress: Math.min((userData.readingsCount || recentReadings.length), 1), total: 1 },
    { id: '2', icon: '🔥', title: '7-Day Streak', description: 'Use the app 7 days in a row', unlocked: userData.streak >= 7, progress: Math.min(userData.streak, 7), total: 7 },
    { id: '3', icon: '📚', title: 'Collector', description: 'Collect all 78 tarot cards', unlocked: userData.cardsCollected >= 78, progress: userData.cardsCollected, total: 78 },
    { id: '4', icon: '💕', title: 'Love Expert', description: 'Complete 50 love readings', unlocked: false, progress: 12, total: 50 },
    { id: '5', icon: '🌙', title: 'Moon Master', description: 'Complete 10 moon rituals', unlocked: false, progress: 3, total: 10 },
  ] : [];

  const moonPhase = getDynamicMoonPhase();

  const handleSettingClick = async (setting: string) => {
    if (setting === 'subscription' && onNavigate) {
      onNavigate(activeSubscription ? 'subscription' : 'services');
    } else if (setting === 'logout') {
      try {
        if (user && supabase) {
          await supabase.from('users').update({ onboarding_completed: false }).eq('id', user.id);
        }
        localStorage.clear();
        sessionStorage.clear();
        if (supabase) await supabase.auth.signOut();
        window.location.href = '/';
      } catch (error) {
        console.error('❌ Error logging out:', error);
        alert('გასვლა ვერ მოხერხდა. გთხოვთ, სცადოთ მოგვიანებით.');
      }
    }
  };

  const handleChangeSign = () => {
    if (onNavigate) onNavigate('sign-selection');
  };

  const handleResetSign = async () => {
    if (!user) return;
    setResetting(true);
    try {
      const updatedUser = await resetZodiacSign(user.id);
      if (updatedUser) {
        setUser(updatedUser);
        setShowResetConfirm(false);
        if (onNavigate) onNavigate('sign-selection');
      }
    } catch (error) {
      console.error('❌ Error resetting zodiac sign:', error);
      alert('Failed to reset zodiac sign. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const handleSaveEdit = async (section: string, data: any) => {
    if (!user) return;
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
    if (updatedUser) setUser(updatedUser);
  };

  const handleSaveBirthInfo = async (date: string, time: string, place: string) => {
    if (!user) { setShowBirthInfo(false); return; }
    const updatedUser = await updateUser(user.id, { birth_date: date, birth_time: time, birth_place: place });
    if (updatedUser) setUser(updatedUser);
    setShowBirthInfo(false);
  };

  const xpProgress = userData ? (userData.xp / userData.xpToNext) * 100 : 0;
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - (xpProgress / 100) * circumference;

  const copyDebugData = async () => {
    const debugText = JSON.stringify({ 
      isAdmin: isUserAdmin,
      userId: user?.id,
      userData, 
      stats, 
      recentReadings, 
      achievements 
    }, null, 2);
    try {
      await navigator.clipboard.writeText(debugText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading || !userData) {
    return (
      <div className="screen-container profile">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ffe566' }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="screen-container profile">
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`, animationDuration: `${4 + Math.random() * 3}s`,
            width: `${2 + Math.random() * 2}px`, height: `${2 + Math.random() * 2}px`,
          }} />
        ))}
      </div>

      {isUserAdmin && (
        <button 
          onClick={() => setShowDebug(!showDebug)} 
          style={{
            position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
            width: '48px', height: '48px', borderRadius: '50%',
            background: showDebug ? '#10b981' : '#333',
            border: '2px solid rgba(255,255,255,0.2)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}
        >
          <Bug size={24} />
        </button>
      )}

      <div className="profile-content">
        {/* 🆕 ახალი ჰედერი, ზუსტად HomeScreen-ის სტილში */}
        <div className="user-header" style={{ marginBottom: '12px' }}>
          <div className="user-main-row" style={{ 
            alignItems: 'center',
            height: '52px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            {/* ავატარი და XP წრე */}
            <div className="avatar-section" style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
              <svg className="xp-circular-progress" width="52" height="52" viewBox="0 0 52 52" style={{ position: 'absolute', top: 0, left: 0 }}>
                <circle className="xp-circle-bg" cx="26" cy="26" r="22" fill="none" stroke="#e9d5ff" strokeWidth="4" />
                <circle className="xp-circle-progress" cx="26" cy="26" r="22" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} transform="rotate(-90 26 26)" />
              </svg>
              
              <div style={{ 
                position: 'absolute',
                top: '6px',
                left: '6px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)',
                borderRadius: '50%',
                color: '#0f0c08',
                zIndex: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                {userData.avatar}
              </div>
              
              <div style={{
                position: 'absolute',
                bottom: '2px',
                left: '2px',
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                color: '#0f0c08',
                borderRadius: '6px',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                zIndex: 3,
                boxShadow: '0 2px 6px rgba(0,0,0,0.4), 0 0 0 1.5px #1a1510',
                border: '1.5px solid #1a1510'
              }}>
                {userData.level}
              </div>
            </div>
            
            {/* მომხმარებლის ინფო */}
            <div className="user-info-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '52px', marginLeft: '12px', flex: 1, minWidth: 0 }}>
              <h2 className="username" style={{ margin: 0, fontSize: '18px', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#ffe566' }}>
                {userData.displayName}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#c87800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userData.zodiacSymbol} {userData.zodiac.charAt(0).toUpperCase() + userData.zodiac.slice(1)} · {userData.element}
              </p>
            </div>
            
            {/* 4 ნავიგაციის ღილაკი (2x2 გრიდი) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', flexShrink: 0 }}>
              <button 
                className={`nav-pill ${activeTab === 'profile' ? 'active' : ''}`} 
                onClick={() => setActiveTab('profile')} 
                style={{ 
                  padding: '6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', 
                  background: activeTab === 'profile' ? 'linear-gradient(135deg, rgba(200, 120, 0, 0.3), rgba(255, 229, 102, 0.2))' : 'rgba(20, 12, 5, 0.8)', 
                  border: activeTab === 'profile' ? '1px solid #ffe566' : '1px solid rgba(200, 120, 0, 0.25)', 
                  borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '16px' }}>👤</span>
                <span style={{ fontSize: '8px', color: '#ffe566', fontWeight: 600 }}>Profile</span>
              </button>
              
              <button 
                className={`nav-pill ${activeTab === 'achievements' ? 'active' : ''}`} 
                onClick={() => setActiveTab('achievements')} 
                style={{ 
                  padding: '6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', 
                  background: activeTab === 'achievements' ? 'linear-gradient(135deg, rgba(200, 120, 0, 0.3), rgba(255, 229, 102, 0.2))' : 'rgba(20, 12, 5, 0.8)', 
                  border: activeTab === 'achievements' ? '1px solid #ffe566' : '1px solid rgba(200, 120, 0, 0.25)', 
                  borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '16px' }}>🏆</span>
                <span style={{ fontSize: '8px', color: '#ffe566', fontWeight: 600 }}>Awards</span>
              </button>

              <button 
                className="nav-pill premium-btn" 
                onClick={() => onNavigate && onNavigate('subscription')} 
                style={{ 
                  padding: '6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', 
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05))', 
                  border: '1px solid rgba(255, 215, 0, 0.4)', 
                  borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '16px' }}>💎</span>
                <span style={{ fontSize: '8px', color: '#ffe566', fontWeight: 600 }}>{activeSubscription ? 'PREMIUM' : 'FREE'}</span>
              </button>

              <button 
                className={`nav-pill ${activeTab === 'settings' ? 'active' : ''}`} 
                onClick={() => setActiveTab('settings')} 
                style={{ 
                  padding: '6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', 
                  background: activeTab === 'settings' ? 'linear-gradient(135deg, rgba(200, 120, 0, 0.3), rgba(255, 229, 102, 0.2))' : 'rgba(20, 12, 5, 0.8)', 
                  border: activeTab === 'settings' ? '1px solid #ffe566' : '1px solid rgba(200, 120, 0, 0.25)', 
                  borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '16px' }}>⚙️</span>
                <span style={{ fontSize: '8px', color: '#ffe566', fontWeight: 600 }}>Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* დანარჩენი კონტენტი (Tab-ების მიხედვით) */}
        {activeTab === 'profile' && (
          <div className="tab-content animate-fade-in">
            <div className="stats-compact-grid animate-fade-in stagger-2">
              {stats.map((stat, idx) => (
                <div key={idx} className="stat-compact-item">
                  <div className="stat-compact-icon">{stat.icon}</div>
                  <div className="stat-compact-value">{stat.value}</div>
                  <div className="stat-compact-label">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="core-traits-horizontal animate-fade-in stagger-3">
              <h3 className="card-title">✦ CORE TRAITS ✦</h3>
              <div className="traits-horizontal-grid">
                {coreTraits.map((trait, index) => (
                  <div key={index} className="trait-compact-item">
                    <div className="trait-compact-icon">{trait.icon}</div>
                    <div className="trait-compact-name">{trait.sign.charAt(0).toUpperCase() + trait.sign.slice(1)}</div>
                    <div className="trait-compact-desc">{trait.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="moon-phase-card animate-fade-in stagger-4">
              <h3 className="card-title">✦ MOON PHASE ✦</h3>
              <div className="moon-content">
                <div className="moon-symbol">{moonPhase.symbol}</div>
                <div className="moon-info">
                  <div className="moon-phase-name">{moonPhase.phase}</div>
                  <div className="moon-details">Illuminated: {moonPhase.illumination}%</div>
                  <div className="moon-best-for">Best for: {moonPhase.bestFor}</div>
                </div>
              </div>
            </div>

            <div className="quick-actions-card animate-fade-in stagger-5">
              <h3 className="card-title">✦ EXPLORE ✦</h3>
              <div className="action-buttons-grid">
                <button className="premium-action-btn" onClick={() => onNavigate && onNavigate('natal-chart')}>
                  <Star size={18} />
                  <span>Natal Chart</span>
                  {userData.currentPlan === 'FREE' && <Lock size={12} className="lock-icon" />}
                </button>
                <button className="premium-action-btn" onClick={() => onNavigate && onNavigate('compatibility')}>
                  <Heart size={18} />
                  <span>Compatibility</span>
                </button>
                <button className="premium-action-btn" onClick={() => onNavigate && onNavigate('journal')}>
                  <BookOpen size={18} />
                  <span>Journal</span>
                </button>
              </div>
            </div>

            <div className="my-signs-card animate-fade-in stagger-6">
              <h3 className="card-title">✦ MY SIGNS ✦</h3>
              <div className="signs-grid">
                {mySigns.map((item, index) => (
                  <div key={index} className="sign-item">
                    <div className="sign-icon">{item.icon}</div>
                    <div className="sign-label">{item.label}</div>
                    <div className="sign-name">{item.sign.symbol} {item.sign.name}</div>
                    <div className="sign-details">{item.sign.element} · {item.sign.planet}</div>
                  </div>
                ))}
              </div>
              <div className="sign-actions">
                <button className="change-sign-btn" onClick={handleChangeSign}><span>🔄 Change</span></button>
                <button className="reset-sign-btn" onClick={() => setShowResetConfirm(true)}><span>🗑️ Reset</span></button>
              </div>
            </div>

            {recentReadings.length > 0 && (
              <div className="recent-readings-card animate-fade-in stagger-7">
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
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="tab-content animate-fade-in">
            <h3 className="section-title">✦ ACHIEVEMENTS ✦</h3>
            <div className="achievements-list">
              {achievements.map((achievement, index) => (
                <div key={achievement.id} className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} animate-fade-in stagger-${index + 1}`}>
                  <div className="achievement-icon">{achievement.unlocked ? achievement.icon : '🔒'}</div>
                  <div className="achievement-info">
                    <h4 className="achievement-title">{achievement.title}</h4>
                    <p className="achievement-desc">{achievement.description}</p>
                    <div className="achievement-progress">
                      <div className="progress-bar-small">
                        <div className="progress-fill-small" style={{ width: mounted ? `${(achievement.progress / achievement.total) * 100}%` : '0%' }}></div>
                      </div>
                      <span className="progress-text">{achievement.progress} / {achievement.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-content animate-fade-in">
            <h3 className="section-title">✦ SETTINGS ✦</h3>
            <div className="settings-section">
              <h4 className="settings-section-title">🎨 Appearance</h4>
              <div className="setting-item">
                <span className="setting-icon">🌗</span>
                <div className="setting-content">
                  <span className="setting-label">Theme</span>
                  <div className="theme-options">
                    <button className={`theme-option-mini ${settings.theme === 'dark' ? 'active' : ''}`} onClick={() => updateSetting('theme', 'dark')}>🌙 Dark</button>
                    <button className={`theme-option-mini ${settings.theme === 'light' ? 'active' : ''}`} onClick={() => updateSetting('theme', 'light')}>☀️ Light</button>
                  </div>
                </div>
              </div>
              <div className="setting-item">
                <span className="setting-icon">🌐</span>
                <div className="setting-content">
                  <span className="setting-label">Language</span>
                  <select className="form-input form-select settings-select" value={settings.language} onChange={(e) => updateSetting('language', e.target.value as any)}>
                    <option value="en">🇬🇧 English</option>
                    <option value="ka">🇬🇪 ქართული</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="settings-section">
              <h4 className="settings-section-title">💎 Account</h4>
              <div className="setting-item premium" onClick={() => handleSettingClick('subscription')}>
                <span className="setting-icon">💎</span>
                <span className="setting-label">Subscription</span>
                <span className="setting-badge">{activeSubscription ? 'ACTIVE' : 'FREE'}</span>
                <span className="setting-arrow">→</span>
              </div>
              <div className="setting-item danger" onClick={() => handleSettingClick('logout')}>
                <span className="setting-icon">🚪</span>
                <span className="setting-label">Logout</span>
                <span className="setting-arrow">→</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {isUserAdmin && showDebug && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', bottom: '80px', width: '350px',
          background: 'rgba(10, 6, 0, 0.98)', border: '2px solid #fbbf24', borderRadius: '12px',
          zIndex: 9998, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '14px' }}>🔧 ADMIN DEBUG</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={copyDebugData} style={{ background: 'rgba(96, 165, 250, 0.2)', border: '1px solid #60a5fa', color: '#60a5fa', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}>
                {copySuccess ? 'Copied!' : 'Copy JSON'}
              </button>
              <button onClick={() => setShowDebug(false)} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
            </div>
          </div>
          <pre style={{ flex: 1, overflow: 'auto', padding: '12px', color: '#a78bfa', fontSize: '11px', margin: 0 }}>
            {JSON.stringify({
              isAdmin: isUserAdmin,
              userId: user?.id,
              userData: { ...userData, xpToNext: undefined, xp: undefined },
              levelData: userLevelData,
              stats,
              recentReadingsCount: recentReadings.length,
              achievementsUnlocked: achievements.filter(a => a.unlocked).length,
              localStorageKeys: Object.keys(localStorage)
            }, null, 2)}
          </pre>
        </div>
      )}

      {showEditProfile && (
        <EditProfileModal 
          userData={userData} 
          editSection={editSection} 
          setEditSection={setEditSection} 
          onSave={handleSaveEdit} 
          onClose={() => setShowEditProfile(false)} 
          onEditBirthInfo={() => { setShowEditProfile(false); setShowBirthInfo(true); }} 
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

// ==========================================
// MODAL COMPONENTS
// ==========================================
function EditProfileModal({ userData, editSection, setEditSection, onSave, onClose, onEditBirthInfo }: any) {
  const [formData, setFormData] = useState(userData);
  const zodiacSigns = Object.keys(ZODIAC_DATA).map(key => ({ name: key, ...ZODIAC_DATA[key] }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <h2 className="modal-title">✦ EDIT PROFILE ✦</h2>
        <div className="edit-section-tabs">
          <button type="button" className={`edit-tab ${editSection === 'personal' ? 'active' : ''}`} onClick={() => setEditSection('personal')}>👤 Personal</button>
          <button type="button" className={`edit-tab ${editSection === 'astrology' ? 'active' : ''}`} onClick={() => setEditSection('astrology')}>✨ Astro</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(editSection, formData); onClose(); }}>
          {editSection === 'personal' && (
            <div className="edit-section">
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input type="text" className="form-input" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-input form-textarea" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} maxLength={150} rows={3} />
              </div>
            </div>
          )}
          {editSection === 'astrology' && (
            <div className="edit-section">
              {['sunSign', 'moonSign', 'risingSign'].map((signType) => (
                <div className="form-group" key={signType}>
                  <label className="form-label">{signType === 'sunSign' ? '☀️ Sun Sign' : signType === 'moonSign' ? '🌙 Moon Sign' : '⬆️ Rising Sign'}</label>
                  <select className="form-input form-select" value={(formData as any)[signType]} onChange={(e) => setFormData({ ...formData, [signType]: e.target.value })}>
                    {zodiacSigns.map(sign => <option key={sign.name} value={sign.name}>{sign.symbol} {sign.name} ({sign.element})</option>)}
                  </select>
                </div>
              ))}
              <button type="button" className="edit-birth-info-btn" onClick={onEditBirthInfo}>Edit Birth Info →</button>
            </div>
          )}
          <button type="submit" className="modal-submit-btn">SAVE CHANGES</button>
        </form>
      </div>
    </div>
  );
}

function BirthInfoModal({ birthDate, birthTime, birthPlace, onSave, onClose }: any) {
  const [formData, setFormData] = useState({ date: birthDate, time: birthTime, place: birthPlace });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <h2 className="modal-title">✦ BIRTH INFO ✦</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData.date, formData.time, formData.place); onClose(); }}>
          <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Time of Birth</label><input type="time" className="form-input" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Place of Birth</label><input type="text" className="form-input" value={formData.place} onChange={(e) => setFormData({ ...formData, place: e.target.value })} placeholder="City, Country" /></div>
          <button type="submit" className="modal-submit-btn">SAVE BIRTH INFO</button>
        </form>
      </div>
    </div>
  );
}

function ResetConfirmModal({ resetting, onConfirm, onCancel }: any) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content reset-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reset-icon">⚠️</div>
        <h2 className="modal-title">Reset Zodiac Sign?</h2>
        <p className="reset-message">This will remove your current zodiac sign and birth information.</p>
        <div className="reset-actions">
          <button className="reset-cancel-btn" onClick={onCancel} disabled={resetting}>Cancel</button>
          <button className="reset-confirm-btn" onClick={onConfirm} disabled={resetting}>{resetting ? 'Resetting...' : 'Reset Sign'}</button>
        </div>
      </div>
    </div>
  );
}