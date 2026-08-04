import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import SplashScreen from './components/SplashScreen';
import OnboardingWelcome from './components/OnboardingWelcome';
import OnboardingZodiac from './components/OnboardingZodiac';
import OnboardingFirstReading from './components/OnboardingFirstReading';
import HomeScreen from './components/HomeScreen';
import CardsScreen from './components/CardsScreen';
import ReadingScreen from './components/ReadingScreen';
import AstroScreen from './components/AstroScreen';
import ProfileScreen from './components/ProfileScreen';
import CardFanScreen from './components/CardFanScreen';
import CardDetailScreen from './components/CardDetailScreen';
import DailyCardScreen from './components/DailyCardScreen';
import ThreeCardReadingScreen from './components/ThreeCardReadingScreen';
import ReadingHistoryScreen from './components/ReadingHistoryScreen';
import CelticCrossReadingScreen from './components/CelticCrossReadingScreen';
import HorseshoeReadingScreen from './components/HorseshoeReadingScreen';
import RelationshipReadingScreen from './components/RelationshipReadingScreen';
import HoroscopeScreen from './components/HoroscopeScreen';
import SignSelectionScreen from './components/SignSelectionScreen';
import AdminScreen from './components/AdminScreen';
import AdminAIManagement from './components/AdminAIManagement';
import UserAnalytics from './components/UserAnalytics';
import SubscriptionScreen from './components/SubscriptionScreen';
import ServicesScreen from './components/ServicesScreen';
import BottomNav from './components/BottomNav';
import { UserProvider, useUser } from './context/UserContext';
import { SettingsProvider } from './context/SettingsContext';
import { TranslationProvider } from './i18n/TranslationContext';
import { initializeTelegramAuth, getTelegramUser } from './lib/telegramAuth';
import { getOrCreateUser, completeOnboarding } from './lib/userService';
import { updateUserLastActive } from './lib/adminService';
import './App.css';

const ADMIN_USER_ID = 'c9dbe3be-5c02-4034-8bfd-1d693eb02754';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string; errorStack: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMessage: '', errorStack: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message, errorStack: error.stack || '' };
    }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 ERROR BOUNDARY:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#1a0a0a', color: '#ff6b6b', margin: '10px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '11px', maxHeight: '80vh', overflowY: 'auto' }}>
          <h2 style={{ color: '#ff4444', marginBottom: '10px' }}>🚨 React Error</h2>
          <pre style={{ color: '#ff6b6b', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{this.state.errorMessage}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '15px', padding: '10px 20px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>🔄 Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

type Screen = 'splash' | 'welcome' | 'zodiac' | 'first-reading' | 'home' | 'cards' | 'reading' | 'astro' | 'horoscope' | 'sign-selection' | 'profile' | 'card-fan' | 'card-detail' | 'daily-card' | 'three-card-reading' | 'reading-history' | 'celtic-cross' | 'horseshoe' | 'relationship' | 'admin' | 'user-analytics' | 'ai-management' | 'subscription' | 'services';

function SmartDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [authMessage, setAuthMessage] = useState('Initializing...');
  const [tgAvailable, setTgAvailable] = useState(false);
  const [hasInitData, setHasInitData] = useState(false);
  const [supabaseUid, setSupabaseUid] = useState<string | null>(null);
  const [edgeError, setEdgeError] = useState<string | null>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    setTgAvailable(!!tg);
    setHasInitData(!!tg?.initData);

    const checkAuth = async () => {
      if (!supabase) {
        setAuthStatus('error');
        setAuthMessage('Supabase not initialized');
        return;
      }

      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          setAuthStatus('error');
          setAuthMessage(`Auth error: ${error.message}`);
        } else if (user) {
          setAuthStatus('success');
          setAuthMessage(`Authenticated: ${user.id.substring(0, 8)}...`);
          setSupabaseUid(user.id);
        } else {
          setAuthStatus('error');
          setAuthMessage('No active session (auth.uid() is null)');
        }
      } catch (err: any) {
        setAuthStatus('error');
        setAuthMessage(`Exception: ${err.message}`);
      }

      // ვკითხულობთ Edge Function-ის შეცდომას თუ არსებობს
      const authErr = (window as any).__AUTH_ERROR;
      if (authErr) {
        setEdgeError(authErr);
      }
    };

    checkAuth();
    
    // პერიოდულად ვამოწმებთ, ხომ არ შეიცვალა შეცდომა
    const interval = setInterval(() => {
      const authErr = (window as any).__AUTH_ERROR;
      if (authErr && authErr !== edgeError) {
        setEdgeError(authErr);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [edgeError]);

  const getStatusColor = () => {
    if (authStatus === 'success') return '#10b981';
    if (authStatus === 'error') return '#ef4444';
    return '#fbbf24';
  };

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, fontFamily: 'monospace' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', padding: '10px',
          background: isOpen ? '#ef4444' : 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
          color: '#fff', border: 'none', borderTop: '2px solid #C5A059',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
        }}
      >
        🐞 {isOpen ? 'HIDE DEBUG' : 'SMART DEBUG'}
      </button>

      {isOpen && (
        <div style={{
          background: 'rgba(10, 6, 0, 0.98)', backdropFilter: 'blur(10px)',
          borderTop: '2px solid #C5A059', padding: '16px', fontSize: '11px',
          color: '#e2e8f0', maxHeight: '60vh', overflowY: 'auto'
        }}>
          <h4 style={{ color: '#C5A059', margin: '0 0 12px 0', fontSize: '13px' }}>🔍 SMART DEBUG STATUS</h4>

          <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
              <span>📱 Telegram WebApp:</span>
              <span style={{ color: tgAvailable ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{tgAvailable ? 'YES ✅' : 'NO ❌'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
              <span>🔐 Has initData:</span>
              <span style={{ color: hasInitData ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{hasInitData ? 'YES ✅' : 'NO ❌'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
              <span>🔑 Supabase Auth:</span>
              <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>
                {authStatus === 'success' ? 'ACTIVE ✅' : authStatus === 'error' ? 'INACTIVE ❌' : 'PENDING ⏳'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
              <span>👤 auth.uid():</span>
              <span style={{ color: supabaseUid ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '10px' }}>
                {supabaseUid ? `${supabaseUid.substring(0, 8)}...` : 'NULL'}
              </span>
            </div>
          </div>

          {edgeError && (
            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '6px', marginBottom: '12px' }}>
              <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '4px' }}>🚨 EDGE FUNCTION ERROR:</div>
              <div style={{ color: '#fca5a5', fontSize: '11px', wordBreak: 'break-word' }}>{edgeError}</div>
            </div>
          )}

          <div style={{ padding: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', marginBottom: '12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}>Auth Message:</div>
            <div style={{ color: getStatusColor(), fontSize: '11px' }}>{authMessage}</div>
          </div>

          <button
            onClick={() => window.location.reload()}
            style={{ width: '100%', padding: '10px', background: '#C5A059', color: '#0a0600', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}
          >
            🔄 Reload & Recheck
          </button>
        </div>
      )}
    </div>
  );
}

function UserLoader({ onReady }: { onReady: () => void }) {
  const { setUser, setLoading } = useUser();
  useEffect(() => {
    async function loadUser() {
      console.log('🔵 [UserLoader] Starting user load & auth...');
      try {
        let tgUser = await initializeTelegramAuth();
        if (!tgUser) {
          console.warn('⚠️ [UserLoader] Edge Auth failed. Using fallback.');
          tgUser = getTelegramUser();
        }
        if (!tgUser) {
          console.error('❌ [UserLoader] No Telegram user found at all.');
          setLoading(false);
          onReady();
          return;
        }
        console.log('🔵 [UserLoader] Loading user data from Supabase...');
        const user = await getOrCreateUser(tgUser);
        if (user) {
          setUser(user);
          console.log('✅ [UserLoader] User saved to context!');
        }
      } catch (error) {
        console.error('❌ [UserLoader] Critical Error:', error);
      } finally {
        setLoading(false);
        onReady();
      }
    }
    loadUser();
  }, [setUser, setLoading, onReady]);
  return null;
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [userReady, setUserReady] = useState(false);
  const { user, setUser } = useUser();

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#0a0600');
      if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor('#0a0600');
      if (typeof tg.expand === 'function') tg.expand();
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const updateLastActive = async () => {
      try { await updateUserLastActive(user.id); } 
      catch (error) { console.error('❌ [LastActive] Error:', error); }
    };
    updateLastActive();
    const interval = setInterval(updateLastActive, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') updateLastActive();
    });
    return () => { clearInterval(interval); };
  }, [user]);

  const goTo = (screen: Screen) => setCurrentScreen(screen);
  const handleTabChange = (tab: string) => { setActiveTab(tab); goTo(tab as Screen); };
  
  const handleHoroscopeNavigate = (screen: string) => {
    if (screen === 'horoscope') {
      if (!user?.sun_sign) { goTo('sign-selection'); return; }
      goTo('horoscope');
    } else if (screen === 'sign-selection') {
      goTo('sign-selection');
    } else {
      handleNavigate(screen);
    }
  };

  const handleNavigate = (screen: string) => {
    if (screen.startsWith('card-detail-')) {
      setSelectedCardId(parseInt(screen.split('-')[2]));
      goTo('card-detail');
    } else if (screen === 'horoscope') {
      handleHoroscopeNavigate('horoscope');
    } else if (['home', 'cards', 'astro', 'profile'].includes(screen)) {
      handleTabChange(screen);
    } else if (screen === 'admin' || screen === 'user-analytics' || screen === 'ai-management') {
      if (user && user.id === ADMIN_USER_ID) goTo(screen as Screen);
      else goTo('home');
    } else {
      goTo(screen as Screen);
    }
  };

  const handleUserReady = () => setUserReady(true);
  const handleSplashFinish = () => {
    if (!userReady) {
      const checkInterval = setInterval(() => {
        if (userReady) { clearInterval(checkInterval); handleSplashFinish(); }
      }, 100);
      return;
    }
    if (user?.onboarding_completed) goTo('home');
    else goTo('welcome');
  };

  const handleOnboardingComplete = async () => {
    if (user && supabase) {
      await completeOnboarding(user.id);
      const { data: freshUser } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (freshUser) setUser(freshUser);
    }
    goTo('home');
  };

  return (
    <div className="app-container">
      {!userReady && <UserLoader onReady={handleUserReady} />}
      {currentScreen === 'splash' && <SplashScreen onFinish={handleSplashFinish} />}
      {currentScreen === 'welcome' && <OnboardingWelcome onFinish={() => goTo('zodiac')} />}
      {currentScreen === 'zodiac' && <OnboardingZodiac onFinish={() => goTo('first-reading')} />}
      {currentScreen === 'first-reading' && <OnboardingFirstReading onFinish={handleOnboardingComplete} />}
      {currentScreen === 'home' && <><HomeScreen onNavigate={handleNavigate} /><BottomNav activeTab={activeTab} onTabChange={handleTabChange} /></>}
      {currentScreen === 'cards' && <><CardsScreen onNavigate={handleNavigate} /><BottomNav activeTab={activeTab} onTabChange={handleTabChange} /></>}
      {currentScreen === 'reading' && <><ReadingScreen onNavigate={handleNavigate} /><BottomNav activeTab={activeTab} onTabChange={handleTabChange} /></>}
      {currentScreen === 'astro' && <><AstroScreen onNavigate={handleNavigate} /><BottomNav activeTab={activeTab} onTabChange={handleTabChange} /></>}
      {currentScreen === 'horoscope' && <><ErrorBoundary><HoroscopeScreen onNavigate={handleNavigate} /></ErrorBoundary><BottomNav activeTab={activeTab} onTabChange={handleTabChange} /></>}
      {currentScreen === 'sign-selection' && <SignSelectionScreen onNavigate={handleNavigate} />}
      {currentScreen === 'profile' && <><ProfileScreen onNavigate={handleNavigate} /><BottomNav activeTab={activeTab} onTabChange={handleTabChange} /></>}
      {currentScreen === 'card-fan' && <CardFanScreen onNavigate={handleNavigate} />}
      {currentScreen === 'card-detail' && selectedCardId && <CardDetailScreen cardId={selectedCardId} onNavigate={handleNavigate} />}
      {currentScreen === 'daily-card' && <DailyCardScreen onNavigate={handleNavigate} />}
      {currentScreen === 'three-card-reading' && <ThreeCardReadingScreen onNavigate={handleNavigate} />}
      {currentScreen === 'reading-history' && <ReadingHistoryScreen onNavigate={handleNavigate} />}
      {currentScreen === 'celtic-cross' && <CelticCrossReadingScreen onNavigate={handleNavigate} />}
      {currentScreen === 'horseshoe' && <HorseshoeReadingScreen onNavigate={handleNavigate} />}
      {currentScreen === 'relationship' && <RelationshipReadingScreen onNavigate={handleNavigate} />}
      {currentScreen === 'admin' && <AdminScreen onNavigate={handleNavigate} />}
      {currentScreen === 'user-analytics' && <UserAnalytics onNavigate={handleNavigate} />}
      {currentScreen === 'ai-management' && <AdminAIManagement onNavigate={handleNavigate} />}
      {currentScreen === 'subscription' && <SubscriptionScreen onNavigate={handleNavigate} />}
      {currentScreen === 'services' && <ServicesScreen onNavigate={handleNavigate} />}

      <SmartDebugPanel />
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <SettingsProvider>
        <TranslationProvider>
          <AppContent />
        </TranslationProvider>
      </SettingsProvider>
    </UserProvider>
  );
}

export default App;