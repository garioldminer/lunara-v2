import { useEffect, useState } from 'react';
import './ProfileScreen.css';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { updateUser, resetZodiacSign } from '../lib/userService';
import { getActiveSubscription } from '../lib/subscriptionService';
import { supabase } from '../lib/supabase';
import { Bug, X, Star, Heart, BookOpen, Lock, User, Trophy, Gem, Settings, LogOut, ChevronRight, RotateCcw, Shuffle, Bell, Mail, Sun, Moon } from 'lucide-react';
import { useTranslation, LANGUAGE_META, type Language } from '../i18n/TranslationContext';

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

const getSignInfo = (signName: string, t: (key: string) => string) => {
  if (!signName) return { symbol: '✧', element: t('elements.Unknown'), planet: t('planets.Unknown') };
  const capitalized = signName.charAt(0).toUpperCase() + signName.slice(1).toLowerCase();
  const data = ZODIAC_DATA[capitalized] || { symbol: '✧', element: 'Unknown', planet: 'Unknown' };
  return {
    symbol: data.symbol,
    element: t(`elements.${data.element}`),
    planet: t(`planets.${data.planet}`)
  };
};

const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const getDynamicMoonPhase = (t: (key: string) => string) => {
  const dayOfYear = getDayOfYear(new Date());
  const lunarCycle = 29.53;
  const phaseIndex = Math.floor(((dayOfYear % lunarCycle) / lunarCycle) * 8) % 8;
  const phases = ['newMoon', 'waxingCrescent', 'firstQuarter', 'waxingGibbous', 'fullMoon', 'waningGibbous', 'lastQuarter', 'waningCrescent'];
  const current = phases[phaseIndex];
  const illumination = Math.floor(((dayOfYear % lunarCycle) / lunarCycle) * 100);

  return {
    phase: t(`moonPhase.${current}`),
    symbol: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][phaseIndex],
    illumination: illumination,
    bestFor: t(`moonPhase.bestFor.${current}`)
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

interface Notifications {
  push: boolean;
  email: boolean;
  dailyHoroscope: boolean;
  moonPhase: boolean;
}

// ენების ახალი თანმიმდევრობა: English, Russian, German, Spanish, Georgian
const LANGUAGE_ORDER: Language[] = ['en', 'ru', 'de', 'es', 'ka'];

const LANGUAGE_FLAGS: Record<Language, string> = {
  en: '🇬🇧',
  ru: '🇷🇺',
  de: '🇩🇪',
  es: '🇪🇸',
  ka: '🇬🇪'
};

export default function ProfileScreen({ onNavigate }: Props) {
  const { t, language, setLanguage } = useTranslation();
  
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
  const [notifications, setNotifications] = useState<Notifications>({
    push: true,
    email: false,
    dailyHoroscope: true,
    moonPhase: true
  });

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

  // 🆕 ახალი useEffect: პრეფერენციების ჩატვირთვა ბაზიდან
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setNotifications({
          push: data.push_notifications ?? true,
          email: data.email_notifications ?? false,
          dailyHoroscope: data.daily_horoscope ?? true,
          moonPhase: data.moon_phase_alerts ?? true
        });
      }
    };
    loadPreferences();
  }, [user]);

  const userLevelData = user ? getLevelFromTotalXP(user.xp || 0) : { level: 1, currentLevelXP: 0, xpToNext: 100 };
  
  const userData = user ? {
    displayName: user.display_name || 'User',
    sunSign: user.sun_sign || '',
    moonSign: user.moon_sign || '',
    risingSign: user.rising_sign || '',
    zodiac: user.sun_sign || '',
    zodiacSymbol: getSignInfo(user.sun_sign || '', t).symbol,
    element: getSignInfo(user.sun_sign || '', t).element,
    level: userLevelData.level,
    levelTitle: getLevelTitle(userLevelData.level),
    xp: userLevelData.currentLevelXP,
    xpToNext: userLevelData.xpToNext,
    avatar: user.display_name?.charAt(0).toUpperCase() || 'U',
    currentPlan: user.current_plan || 'FREE',
    gems: user.gems || 0,
    streak: user.streak || 0,
    readingsCount: (user as any).readings_count || 0,
    cardsCollected: (user as any).cards_collected || 0,
  } : null;

  const mySigns: { label: string; icon: string; sign: SignInfo }[] = userData ? [
    { label: t('profile.signs.sun'), icon: '☀', sign: { name: userData.sunSign, ...getSignInfo(userData.sunSign, t) } },
    { label: t('profile.signs.moon'), icon: '☾', sign: { name: userData.moonSign, ...getSignInfo(userData.moonSign, t) } },
    { label: t('profile.signs.rising'), icon: '↑', sign: { name: userData.risingSign, ...getSignInfo(userData.risingSign, t) } },
  ] : [];

  const stats: Stat[] = userData ? [
    { label: t('profile.stats.readings'), value: userData.readingsCount || recentReadings.length, icon: '🔮' },
    { label: t('profile.stats.cards'), value: `${userData.cardsCollected}/78`, icon: '🃏' },
    { label: t('profile.stats.streak'), value: userData.streak, icon: '🔥' },
    { label: t('profile.stats.gems'), value: userData.gems, icon: '💎' },
  ] : [];

  const achievements: Achievement[] = userData ? [
    { id: '1', icon: '🎯', title: t('achievements.firstReading'), description: t('achievements.firstReadingDesc'), unlocked: (userData.readingsCount || recentReadings.length) >= 1, progress: Math.min((userData.readingsCount || recentReadings.length), 1), total: 1 },
    { id: '2', icon: '🔥', title: t('achievements.streak7'), description: t('achievements.streak7Desc'), unlocked: userData.streak >= 7, progress: Math.min(userData.streak, 7), total: 7 },
    { id: '3', icon: '📚', title: t('achievements.collector'), description: t('achievements.collectorDesc'), unlocked: userData.cardsCollected >= 78, progress: userData.cardsCollected, total: 78 },
    { id: '4', icon: '💕', title: t('achievements.loveExpert'), description: t('achievements.loveExpertDesc'), unlocked: false, progress: 12, total: 50 },
    { id: '5', icon: '🌙', title: t('achievements.moonMaster'), description: t('achievements.moonMasterDesc'), unlocked: false, progress: 3, total: 10 },
  ] : [];

  const moonPhase = getDynamicMoonPhase(t);

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
        alert('გასვლა ვერ მოხერხდა.');
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

  // 🆕 განახლებული handleNotificationToggle: ინახავს მონაცემებს ბაზაში
  const handleNotificationToggle = async (key: keyof Notifications) => {
    if (!user) return;

    const newNotifications = {
      ...notifications,
      [key]: !notifications[key]
    };
    setNotifications(newNotifications);

    const dbKey = key === 'push' ? 'push_notifications' :
                  key === 'email' ? 'email_notifications' :
                  key === 'dailyHoroscope' ? 'daily_horoscope' : 'moon_phase_alerts';

    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, [dbKey]: newNotifications[key] }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving preferences:', error);
      setNotifications(notifications); // შეცდომის შემთხვევაში ვაბრუნებთ ძველ მდგომარეობას
    }
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
      achievements,
      notifications,
      currentLanguage: language,
      theme: settings.theme
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
          <span>{t('profile.loading')}</span>
        </div>
      </div>
    );
  }

  const zodiacName = userData.zodiac ? t(`zodiac.${userData.zodiac.charAt(0).toUpperCase() + userData.zodiac.slice(1)}`) : '';

  return (
    <div className={`screen-container profile profile-screen ${settings.theme === 'light' ? 'light-theme' : ''}`}>
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

      {/* HEADER */}
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
            <p className="identity-meta">{userData.zodiacSymbol} {zodiacName} · {userData.levelTitle}</p>
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
            <div className="stat-strip animate-fade-in stagger-1">
              {stats.map((stat, idx) => (
                <div key={idx} className="stat-cell">
                  <span className="stat-cell-icon">{stat.icon}</span>
                  <span className="stat-cell-value">{stat.value}</span>
                  <span className="stat-cell-label">{stat.label}</span>
                </div>
              ))}
            </div>

            <section className="panel animate-fade-in stagger-2">
              <div className="panel-head">
                <h3 className="panel-title">{t('profile.natalChart')}</h3>
                <div className="panel-actions">
                  <button className="ghost-btn" onClick={handleChangeSign}><Shuffle size={12} /> {t('profile.change')}</button>
                  <button className="ghost-btn ghost-btn--danger" onClick={() => setShowResetConfirm(true)}><RotateCcw size={12} /> {t('profile.reset')}</button>
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

            <section className="panel panel--row animate-fade-in stagger-3">
              <div className="moon-emblem">{moonPhase.symbol}</div>
              <div className="moon-copy">
                <div className="moon-row-top">
                  <span className="panel-title">{moonPhase.phase}</span>
                  <span className="moon-illum">{moonPhase.illumination}% {t('moonPhase.lit')}</span>
                </div>
                <p className="moon-best">{moonPhase.bestFor}</p>
              </div>
            </section>

            <section className="action-row animate-fade-in stagger-4">
              <button className="action-pill" onClick={() => onNavigate && onNavigate('natal-chart')}>
                <Star size={16} />
                <span>{t('profile.actions.natalChart')}</span>
                {userData.currentPlan === 'FREE' && <Lock size={11} className="pill-lock" />}
              </button>
              <button className="action-pill" onClick={() => onNavigate && onNavigate('compatibility')}>
                <Heart size={16} />
                <span>{t('profile.actions.compatibility')}</span>
              </button>
              <button className="action-pill" onClick={() => onNavigate && onNavigate('journal')}>
                <BookOpen size={16} />
                <span>{t('profile.actions.journal')}</span>
              </button>
            </section>

            {recentReadings.length > 0 && (
              <section className="panel animate-fade-in stagger-5">
                <h3 className="panel-title">{t('profile.recentReadings')}</h3>
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
            <h3 className="section-title">{t('profile.achievementsTitle')}</h3>
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
            <h3 className="section-title">{t('profile.settingsTitle')}</h3>

            {/* Appearance - Compact */}
            <div className="settings-group">
              <span className="settings-group-label">{t('settings.appearance')}</span>
              <div className="setting-row setting-row--compact">
                <span className="setting-row-icon"><Moon size={16} /></span>
                <span className="setting-row-label">{t('settings.theme')}</span>
                <div className="segmented segmented--small">
                  <button className={`segmented-opt ${settings.theme === 'dark' ? 'is-active' : ''}`} onClick={() => updateSetting('theme', 'dark')}>{t('settings.themeDark')}</button>
                  <button className={`segmented-opt ${settings.theme === 'light' ? 'is-active' : ''}`} onClick={() => updateSetting('theme', 'light')}>{t('settings.themeLight')}</button>
                </div>
              </div>
              <div className="setting-row setting-row--compact">
                <span className="setting-row-icon"><span className="flag-icon">🌐</span></span>
                <span className="setting-row-label">{t('settings.language')}</span>
                <select className="mini-select mini-select--small" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                  {LANGUAGE_ORDER.map(lang => (
                    <option key={lang} value={lang}>{LANGUAGE_FLAGS[lang]} {LANGUAGE_META[lang].nativeName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notifications - Compact */}
            <div className="settings-group">
              <span className="settings-group-label">{t('settings.notifications')}</span>
              <div className="setting-row setting-row--compact">
                <span className="setting-row-icon"><Bell size={16} /></span>
                <span className="setting-row-label">{t('settings.pushNotifications')}</span>
                <button 
                  className={`toggle-switch toggle-switch--small ${notifications.push ? 'is-active' : ''}`}
                  onClick={() => handleNotificationToggle('push')}
                  aria-label="Toggle push notifications"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
              <div className="setting-row setting-row--compact">
                <span className="setting-row-icon"><Mail size={16} /></span>
                <span className="setting-row-label">{t('settings.emailNotifications')}</span>
                <button 
                  className={`toggle-switch toggle-switch--small ${notifications.email ? 'is-active' : ''}`}
                  onClick={() => handleNotificationToggle('email')}
                  aria-label="Toggle email notifications"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
              <div className="setting-row setting-row--compact">
                <span className="setting-row-icon"><Sun size={16} /></span>
                <span className="setting-row-label">{t('settings.dailyHoroscope')}</span>
                <button 
                  className={`toggle-switch toggle-switch--small ${notifications.dailyHoroscope ? 'is-active' : ''}`}
                  onClick={() => handleNotificationToggle('dailyHoroscope')}
                  aria-label="Toggle daily horoscope"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
              <div className="setting-row setting-row--compact">
                <span className="setting-row-icon"><Moon size={16} /></span>
                <span className="setting-row-label">{t('settings.moonPhaseAlerts')}</span>
                <button 
                  className={`toggle-switch toggle-switch--small ${notifications.moonPhase ? 'is-active' : ''}`}
                  onClick={() => handleNotificationToggle('moonPhase')}
                  aria-label="Toggle moon phase alerts"
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>

            {/* Account - Compact */}
            <div className="settings-group">
              <span className="settings-group-label">{t('settings.account')}</span>
              <button className="setting-row setting-row--link setting-row--compact" onClick={() => handleSettingClick('subscription')}>
                <Gem size={16} className="setting-row-icon" />
                <span className="setting-row-label">{t('settings.subscription')}</span>
                <span className={`status-pill status-pill--small ${activeSubscription ? 'status-pill--active' : ''}`}>{activeSubscription ? t('common.active') : t('common.free')}</span>
                <ChevronRight size={14} className="row-chevron" />
              </button>
              <button className="setting-row setting-row--link setting-row--danger setting-row--compact" onClick={() => handleSettingClick('logout')}>
                <LogOut size={16} className="setting-row-icon" />
                <span className="setting-row-label">{t('settings.logout')}</span>
                <ChevronRight size={14} className="row-chevron" />
              </button>
            </div>

            {/* Help & Support - Compact */}
            <div className="settings-group">
              <span className="settings-group-label">{t('settings.helpSupport')}</span>
              <button className="setting-row setting-row--link setting-row--compact" onClick={() => onNavigate && onNavigate('faq')}>
                <span className="setting-row-icon">❓</span>
                <span className="setting-row-label">{t('settings.faq')}</span>
                <ChevronRight size={14} className="row-chevron" />
              </button>
              <button className="setting-row setting-row--link setting-row--compact" onClick={() => onNavigate && onNavigate('contact')}>
                <span className="setting-row-icon">💬</span>
                <span className="setting-row-label">{t('settings.contactSupport')}</span>
                <ChevronRight size={14} className="row-chevron" />
              </button>
              <button className="setting-row setting-row--link setting-row--compact" onClick={() => onNavigate && onNavigate('terms')}>
                <span className="setting-row-icon">📄</span>
                <span className="setting-row-label">{t('settings.terms')}</span>
                <ChevronRight size={14} className="row-chevron" />
              </button>
              <button className="setting-row setting-row--link setting-row--compact" onClick={() => onNavigate && onNavigate('privacy')}>
                <span className="setting-row-icon">🔒</span>
                <span className="setting-row-label">{t('settings.privacy')}</span>
                <ChevronRight size={14} className="row-chevron" />
              </button>
              <div className="setting-row setting-row--static setting-row--compact">
                <span className="setting-row-icon">ℹ️</span>
                <span className="setting-row-label">{t('settings.version')}</span>
                <span className="version-text version-text--small">1.0.0</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {isUserAdmin && showDebug && (
        <div className="debug-panel">
          <div className="debug-head">
            <span>🔧 Admin Debug Panel</span>
            <div className="debug-actions">
              <button onClick={copyDebugData}>{copySuccess ? '✓ Copied' : '📋 Copy'}</button>
              <button onClick={() => setShowDebug(false)}>✕</button>
            </div>
          </div>
          <div className="debug-body">
            <div className="debug-section">
              <h4>👤 User Info</h4>
              <div className="debug-item"><span>ID:</span> <code>{user?.id?.substring(0, 8)}...</code></div>
              <div className="debug-item"><span>Username:</span> <code>{user?.username || 'N/A'}</code></div>
              <div className="debug-item"><span>Display Name:</span> <code>{userData.displayName}</code></div>
              <div className="debug-item"><span>Email:</span> <code>{user ? (user as any).email || 'N/A' : 'N/A'}</code></div>
            </div>
            
            <div className="debug-section">
              <h4>⭐ Progress</h4>
              <div className="debug-item"><span>Level:</span> <code>{userData.level} ({userData.levelTitle})</code></div>
              <div className="debug-item"><span>XP:</span> <code>{userData.xp} / {userData.xpToNext}</code></div>
              <div className="debug-item"><span>Progress:</span> <code>{xpProgress.toFixed(1)}%</code></div>
              <div className="debug-item"><span>Gems:</span> <code>{userData.gems}</code></div>
              <div className="debug-item"><span>Streak:</span> <code>{userData.streak} days</code></div>
            </div>

            <div className="debug-section">
              <h4>♏ Astrology</h4>
              <div className="debug-item"><span>Sun Sign:</span> <code>{userData.sunSign || 'Not set'}</code></div>
              <div className="debug-item"><span>Moon Sign:</span> <code>{userData.moonSign || 'Not set'}</code></div>
              <div className="debug-item"><span>Rising Sign:</span> <code>{userData.risingSign || 'Not set'}</code></div>
              <div className="debug-item"><span>Element:</span> <code>{userData.element}</code></div>
            </div>

            <div className="debug-section">
              <h4>📊 Stats</h4>
              <div className="debug-item"><span>Readings:</span> <code>{userData.readingsCount}</code></div>
              <div className="debug-item"><span>Cards:</span> <code>{userData.cardsCollected}/78</code></div>
              <div className="debug-item"><span>Recent:</span> <code>{recentReadings.length} readings</code></div>
            </div>

            <div className="debug-section">
              <h4>⚙️ Settings</h4>
              <div className="debug-item"><span>Theme:</span> <code>{settings.theme}</code></div>
              <div className="debug-item"><span>Language:</span> <code>{language}</code></div>
              <div className="debug-item"><span>Plan:</span> <code>{userData.currentPlan}</code></div>
              <div className="debug-item"><span>Onboarding:</span> <code>{user?.onboarding_completed ? '✓' : '✗'}</code></div>
            </div>

            <div className="debug-section">
              <h4>🔔 Notifications</h4>
              <div className="debug-item"><span>Push:</span> <code>{notifications.push ? '✓' : '✗'}</code></div>
              <div className="debug-item"><span>Email:</span> <code>{notifications.email ? '✓' : '✗'}</code></div>
              <div className="debug-item"><span>Daily:</span> <code>{notifications.dailyHoroscope ? '✓' : '✗'}</code></div>
              <div className="debug-item"><span>Moon:</span> <code>{notifications.moonPhase ? '✓' : '✗'}</code></div>
            </div>

            <div className="debug-section">
              <h4>🏆 Achievements</h4>
              <div className="debug-item"><span>Unlocked:</span> <code>{achievements.filter(a => a.unlocked).length}/{achievements.length}</code></div>
              {achievements.map(a => (
                <div key={a.id} className="debug-item debug-item--small">
                  <span>{a.icon} {a.title}:</span>
                  <code>{a.unlocked ? '✓' : `${a.progress}/${a.total}`}</code>
                </div>
              ))}
            </div>

            <div className="debug-section">
              <h4>💾 Storage</h4>
              <div className="debug-item"><span>localStorage:</span> <code>{Object.keys(localStorage).length} keys</code></div>
              <div className="debug-item"><span>sessionStorage:</span> <code>{Object.keys(sessionStorage).length} keys</code></div>
            </div>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditProfile(false)}><X size={18} /></button>
            <h2 className="modal-title">{t('editProfile.title')}</h2>
            <div className="edit-section-tabs">
              <button type="button" className={`edit-tab ${editSection === 'personal' ? 'is-active' : ''}`} onClick={() => setEditSection('personal')}>{t('editProfile.personal')}</button>
              <button type="button" className={`edit-tab ${editSection === 'astrology' ? 'is-active' : ''}`} onClick={() => setEditSection('astrology')}>{t('editProfile.astro')}</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(editSection, { displayName: (e.target as any).displayName.value, bio: (e.target as any).bio.value }); setShowEditProfile(false); }}>
              {editSection === 'personal' && (
                <div className="edit-section">
                  <div className="form-group">
                    <label className="form-label">{t('editProfile.displayName')}</label>
                    <input name="displayName" type="text" className="form-input" defaultValue={userData.displayName} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('editProfile.bio')}</label>
                    <textarea name="bio" className="form-input form-textarea" defaultValue={user?.bio || ''} maxLength={150} rows={3} />
                  </div>
                </div>
              )}
              {editSection === 'astrology' && (
                <div className="edit-section">
                  <div className="form-group">
                    <label className="form-label">{t('editProfile.sunSign')}</label>
                    <select name="sunSign" className="form-input form-select" defaultValue={user?.sun_sign || ''}>
                      {Object.keys(ZODIAC_DATA).map(sign => <option key={sign} value={sign}>{ZODIAC_DATA[sign].symbol} {sign} ({ZODIAC_DATA[sign].element})</option>)}
                    </select>
                  </div>
                  <button type="button" className="edit-birth-info-btn" onClick={() => { setShowEditProfile(false); setShowBirthInfo(true); }}>{t('editProfile.editBirthInfo')}</button>
                </div>
              )}
              <button type="submit" className="modal-submit-btn">{t('editProfile.saveChanges')}</button>
            </form>
          </div>
        </div>
      )}

      {showBirthInfo && (
        <div className="modal-overlay" onClick={() => setShowBirthInfo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBirthInfo(false)}><X size={18} /></button>
            <h2 className="modal-title">{t('birthInfo.title')}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveBirthInfo((e.target as any).date.value, (e.target as any).time.value, (e.target as any).place.value); }}>
              <div className="form-group"><label className="form-label">{t('birthInfo.dateOfBirth')}</label><input name="date" type="date" className="form-input" defaultValue={user?.birth_date || ''} /></div>
              <div className="form-group"><label className="form-label">{t('birthInfo.timeOfBirth')}</label><input name="time" type="time" className="form-input" defaultValue={user?.birth_time || ''} /></div>
              <div className="form-group"><label className="form-label">{t('birthInfo.placeOfBirth')}</label><input name="place" type="text" className="form-input" defaultValue={user?.birth_place || ''} placeholder={t('birthInfo.cityCountry')} /></div>
              <button type="submit" className="modal-submit-btn">{t('birthInfo.saveBirthInfo')}</button>
            </form>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-content reset-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reset-icon">⚠</div>
            <h2 className="modal-title">{t('resetSign.title')}</h2>
            <p className="reset-message">{t('resetSign.message')}</p>
            <div className="reset-actions">
              <button className="reset-cancel-btn" onClick={() => setShowResetConfirm(false)} disabled={resetting}>{t('resetSign.cancel')}</button>
              <button className="reset-confirm-btn" onClick={handleResetSign} disabled={resetting}>{resetting ? t('resetSign.resetting') : t('resetSign.resetSign')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}