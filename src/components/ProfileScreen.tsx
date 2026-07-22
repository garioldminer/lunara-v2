import { useEffect, useState } from 'react';
import './ProfileScreen.css';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { updateUser, resetZodiacSign } from '../lib/userService';
import { getActiveSubscription } from '../lib/subscriptionService';
import { supabase } from '../lib/supabase';
import { Bug, X, Star, Heart, BookOpen, Lock, User, Trophy, Gem, Settings, LogOut, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';

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
  if (!signName) return { symbol: '✧', element: 'Unknown', planet: 'Unknown' };
  const capitalized = signName.charAt(0).toUpperCase() + signName.slice(1).toLowerCase();
  return ZODIAC_DATA[capitalized] || { symbol: '✧', element: 'Unknown', planet: 'Unknown' };
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
    { phase: 'New Moon', symbol: '🌑', bestFor: 'New beginnings, setting intentions' },
    { phase: 'Waxing Crescent', symbol: '🌒', bestFor: 'Action, building momentum' },
    { phase: 'First Quarter', symbol: '🌓', bestFor: 'Decisions, overcoming obstacles' },
    { phase: 'Waxing Gibbous', symbol: '🌔', bestFor: 'Refinement, preparation' },
    { phase: 'Full Moon', symbol: '🌕', bestFor: 'Culmination, release, celebration' },
    { phase: 'Waning Gibbous', symbol: '🌖', bestFor: 'Gratitude, sharing wisdom' },
    { phase: 'Last Quarter', symbol: '🌗', bestFor: 'Release, forgiveness, letting go' },
    { phase: 'Waning Crescent', symbol: '🌘', bestFor: 'Rest, reflection, surrender' },
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
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
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

  const mySigns: { label: string; icon: string; sign: SignInfo }[] = userData ? [
    { label: 'Sun', icon: '☀', sign: { name: userData.sunSign, ...getSignInfo(userData.sunSign) } },
    { label: 'Moon', icon: '☾', sign: { name: userData.moonSign, ...getSignInfo(userData.moonSign) } },
    { label: 'Rising', icon: '↑', sign: { name: userData.risingSign, ...getSignInfo(userData.risingSign) } },
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
  const circumference = 2 * Math.PI * 24;
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
      <div className="screen-container profile profile-screen">
        <div className="profile-loading">
          <div className="loading-glyph">✦</div>
          <span>Loading profile…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container profile profile-screen">
      <div className="particles-container" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`, animationDuration: `${4 + Math.random() * 3}s`,
            width: `${2 + Math.random() * 2}px`, height: `${2 + Math.random() * 2}px`,
          }} />
        ))}
      </div>

      {isUserAdmin && (
        <button className="debug-fab" onClick={() => setShowDebug(!showDebug)} aria-label="Toggle debug panel">
          <Bug size={20} />
        </button>
      )}

      {/* HEADER — avatar, name, level ring, nav pills all in one compact band */}
      <div className="identity-bar">
        <div className="identity-left" onClick={() => setShowEditProfile(true)}>
          <div className="ring-avatar">
            <svg className="ring-svg" width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(197,160,89,0.18)" strokeWidth="3" />
              <circle
                cx="28" cy="28" r="24" fill="none" stroke="url(#ringGrad)" strokeWidth="3"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 28 28)"
              />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f0c869" />
                  <stop offset="100%" stopColor="#8b6914" />
                </linearGradient>
              </defs>
            </svg>
            <div className="avatar-glyph">{userData.avatar}</div>
            <div className="level-chip">{userData.level}</div>
          </div>
          <div className="identity-text">
            <h1 className="identity-name">{userData.displayName}</h1>
            <p className="identity-meta">{userData.zodiacSymbol} {userData.zodiac.charAt(0).toUpperCase() + userData.zodiac.slice(1)} · {userData.levelTitle}</p>
          </div>
        </div>

        <nav className="tab-rail" aria-label="Profile sections">
          <button className={`rail-btn ${activeTab === 'profile' ? 'is-active' : ''}`} onClick={() => setActiveTab('profile')} aria-label="Profile">
            <User size={17} />
          </button>
          <button className={`rail-btn ${activeTab === 'achievements' ? 'is-active' : ''}`} onClick={() => setActiveTab('achievements')} aria-label="Achievements">
            <Trophy size={17} />
          </button>
          <button className="rail-btn rail-btn--gold" onClick={() => onNavigate && onNavigate('subscription')} aria-label={activeSubscription ? 'Premium' : 'Upgrade'}>
            <Gem size={17} />
          </button>
          <button className={`rail-btn ${activeTab === 'settings' ? 'is-active' : ''}`} onClick={() => setActiveTab('settings')} aria-label="Settings">
            <Settings size={17} />
          </button>
        </nav>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="tab-content">
            {/* Stat strip — single dense row, no card padding wasted */}
            <div className="stat-strip animate-fade-in stagger-1">
              {stats.map((stat, idx) => (
                <div key={idx} className="stat-cell">
                  <span className="stat-cell-icon">{stat.icon}</span>
                  <span className="stat-cell-value">{stat.value}</span>
                  <span className="stat-cell-label">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Natal trio — merges former "core traits" + "my signs" into one row */}
            <section className="panel animate-fade-in stagger-2">
              <div className="panel-head">
                <h3 className="panel-title">✦ NATAL CHART ✦</h3>
                <div className="panel-actions">
                  <button className="ghost-btn" onClick={handleChangeSign}><Shuffle size={12} /> Change</button>
                  <button className="ghost-btn ghost-btn--danger" onClick={() => setShowResetConfirm(true)}><RotateCcw size={12} /> Reset</button>
                </div>
              </div>
              <div className="natal-trio">
                {mySigns.map((item, index) => (
                  <div key={index} className="natal-cell">
                    <span className="natal-glyph">{item.sign.symbol}</span>
                    <span className="natal-role">{item.label}</span>
                    <span className="natal-sign">{item.sign.name || '—'}</span>
                    <span className="natal-sub">{item.sign.element} · {item.sign.planet}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Moon phase — slim horizontal strip instead of tall card */}
            <section className="panel panel--row animate-fade-in stagger-3">
              <div className="moon-emblem">{moonPhase.symbol}</div>
              <div className="moon-copy">
                <div className="moon-row-top">
                  <span className="panel-title">{moonPhase.phase}</span>
                  <span className="moon-illum">{moonPhase.illumination}% lit</span>
                </div>
                <p className="moon-best">{moonPhase.bestFor}</p>
              </div>
            </section>

            {/* Quick actions — horizontal pill row */}
            <section className="action-row animate-fade-in stagger-4">
              <button className="action-pill" onClick={() => onNavigate && onNavigate('natal-chart')}>
                <Star size={16} />
                <span>Natal Chart</span>
                {userData.currentPlan === 'FREE' && <Lock size={11} className="pill-lock" />}
              </button>
              <button className="action-pill" onClick={() => onNavigate && onNavigate('compatibility')}>
                <Heart size={16} />
                <span>Compatibility</span>
              </button>
              <button className="action-pill" onClick={() => onNavigate && onNavigate('journal')}>
                <BookOpen size={16} />
                <span>Journal</span>
              </button>
            </section>

            {/* Recent readings — compact horizontal scroll strip, capped so it never grows the page */}
            {recentReadings.length > 0 && (
              <section className="panel animate-fade-in stagger-5">
                <h3 className="panel-title">✦ RECENT READINGS ✦</h3>
                <div className="readings-strip">
                  {recentReadings.map((reading) => (
                    <div key={reading.id} className="reading-chip">
                      <span className="reading-chip-icon">{reading.icon}</span>
                      <div className="reading-chip-text">
                        <span className="reading-chip-type">{reading.type}</span>
                        <span className="reading-chip-date">{reading.date} ago</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="tab-content animate-fade-in">
            <h3 className="section-title">✦ ACHIEVEMENTS ✦</h3>
            <div className="achv-list">
              {achievements.map((achievement, index) => (
                <div key={achievement.id} className={`achv-row ${achievement.unlocked ? 'is-unlocked' : 'is-locked'} animate-fade-in stagger-${index + 1}`}>
                  <div className="achv-icon">{achievement.unlocked ? achievement.icon : '🔒'}</div>
                  <div className="achv-body">
                    <div className="achv-top">
                      <span className="achv-title">{achievement.title}</span>
                      <span className="achv-count">{achievement.progress}/{achievement.total}</span>
                    </div>
                    <p className="achv-desc">{achievement.description}</p>
                    <div className="achv-bar">
                      <div className="achv-fill" style={{ width: mounted ? `${(achievement.progress / achievement.total) * 100}%` : '0%' }} />
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

            <div className="settings-group">
              <span className="settings-group-label">Appearance</span>
              <div className="setting-row">
                <span className="setting-row-icon">🌗</span>
                <span className="setting-row-label">Theme</span>
                <div className="segmented">
                  <button className={`segmented-opt ${settings.theme === 'dark' ? 'is-active' : ''}`} onClick={() => updateSetting('theme', 'dark')}>Dark</button>
                  <button className={`segmented-opt ${settings.theme === 'light' ? 'is-active' : ''}`} onClick={() => updateSetting('theme', 'light')}>Light</button>
                </div>
              </div>
              <div className="setting-row">
                <span className="setting-row-icon">🌐</span>
                <span className="setting-row-label">Language</span>
                <select className="mini-select" value={settings.language} onChange={(e) => updateSetting('language', e.target.value as any)}>
                  <option value="en">EN</option>
                  <option value="ka">ქარ</option>
                </select>
              </div>
            </div>

            <div className="settings-group">
              <span className="settings-group-label">Account</span>
              <button className="setting-row setting-row--link" onClick={() => handleSettingClick('subscription')}>
                <Gem size={16} className="setting-row-icon" />
                <span className="setting-row-label">Subscription</span>
                <span className={`status-pill ${activeSubscription ? 'status-pill--active' : ''}`}>{activeSubscription ? 'Active' : 'Free'}</span>
                <ChevronRight size={16} className="row-chevron" />
              </button>
              <button className="setting-row setting-row--link setting-row--danger" onClick={() => handleSettingClick('logout')}>
                <LogOut size={16} className="setting-row-icon" />
                <span className="setting-row-label">Log out</span>
                <ChevronRight size={16} className="row-chevron" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isUserAdmin && showDebug && (
        <div className="debug-panel">
          <div className="debug-head">
            <span>Admin Debug</span>
            <div className="debug-actions">
              <button onClick={copyDebugData}>{copySuccess ? 'Copied' : 'Copy JSON'}</button>
              <button onClick={() => setShowDebug(false)}>✕</button>
            </div>
          </div>
          <pre className="debug-body">
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
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2 className="modal-title">Edit Profile</h2>
        <div className="edit-section-tabs">
          <button type="button" className={`edit-tab ${editSection === 'personal' ? 'is-active' : ''}`} onClick={() => setEditSection('personal')}>Personal</button>
          <button type="button" className={`edit-tab ${editSection === 'astrology' ? 'is-active' : ''}`} onClick={() => setEditSection('astrology')}>Astro</button>
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
                  <label className="form-label">{signType === 'sunSign' ? 'Sun Sign' : signType === 'moonSign' ? 'Moon Sign' : 'Rising Sign'}</label>
                  <select className="form-input form-select" value={(formData as any)[signType]} onChange={(e) => setFormData({ ...formData, [signType]: e.target.value })}>
                    {zodiacSigns.map(sign => <option key={sign.name} value={sign.name}>{sign.symbol} {sign.name} ({sign.element})</option>)}
                  </select>
                </div>
              ))}
              <button type="button" className="edit-birth-info-btn" onClick={onEditBirthInfo}>Edit Birth Info →</button>
            </div>
          )}
          <button type="submit" className="modal-submit-btn">Save Changes</button>
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
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2 className="modal-title">Birth Info</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData.date, formData.time, formData.place); onClose(); }}>
          <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Time of Birth</label><input type="time" className="form-input" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Place of Birth</label><input type="text" className="form-input" value={formData.place} onChange={(e) => setFormData({ ...formData, place: e.target.value })} placeholder="City, Country" /></div>
          <button type="submit" className="modal-submit-btn">Save Birth Info</button>
        </form>
      </div>
    </div>
  );
}

function ResetConfirmModal({ resetting, onConfirm, onCancel }: any) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content reset-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reset-icon">⚠</div>
        <h2 className="modal-title">Reset Zodiac Sign?</h2>
        <p className="reset-message">This will remove your current zodiac sign and birth information.</p>
        <div className="reset-actions">
          <button className="reset-cancel-btn" onClick={onCancel} disabled={resetting}>Cancel</button>
          <button className="reset-confirm-btn" onClick={onConfirm} disabled={resetting}>{resetting ? 'Resetting…' : 'Reset Sign'}</button>
        </div>
      </div>
    </div>
  );
}