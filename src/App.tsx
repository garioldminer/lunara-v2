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

// ✅ Admin user ID
const ADMIN_USER_ID = 'c9dbe3be-5c02-4034-8bfd-1d693eb02754';

// 🆕 ERROR BOUNDARY COMPONENT
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string; errorStack: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMessage: '', errorStack: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { 
      hasError: true, 
      errorMessage: error.message,
      errorStack: error.stack || ''
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 ERROR BOUNDARY:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          background: '#1a0a0a', 
          color: '#ff6b6b',
          margin: '10px',
          borderRadius: '12px',
          fontFamily: 'monospace',
          fontSize: '11px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <h2 style={{ color: '#ff4444', marginBottom: '10px' }}>🚨 React Error</h2>
          <div style={{ 
            background: '#000', 
            padding: '10px', 
            borderRadius: '6px',
            border: '1px solid #ff4444',
            marginBottom: '10px'
          }}>
            <strong style={{ color: '#ffaa00' }}>Error Message:</strong>
            <pre style={{ 
              color: '#ff6b6b',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              marginTop: '5px',
              fontSize: '10px'
            }}>
              {this.state.errorMessage}
            </pre>
          </div>
          <div style={{ 
            background: '#000', 
            padding: '10px', 
            borderRadius: '6px',
            border: '1px solid #666',
            marginBottom: '10px'
          }}>
            <strong style={{ color: '#ffaa00' }}>Stack Trace:</strong>
            <pre style={{ 
              color: '#aaa',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              marginTop: '5px',
              fontSize: '9px'
            }}>
              {this.state.errorStack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              background: '#ff4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            🔄 Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

type Screen = 
  | 'splash' 
  | 'welcome' 
  | 'zodiac' 
  | 'first-reading' 
  | 'home' 
  | 'cards'
  | 'reading'
  | 'astro'
  | 'horoscope'
  | 'sign-selection'
  | 'profile'
  | 'card-fan'
  | 'card-detail'
  | 'daily-card'
  | 'three-card-reading'
  | 'reading-history'
  | 'celtic-cross'
  | 'horseshoe'
  | 'relationship'
  | 'admin'
  | 'user-analytics'
  | 'ai-management'
  | 'subscription'
  | 'services';

function UserLoader({ onReady }: { onReady: () => void }) {
  const { setUser, setLoading } = useUser();

  useEffect(() => {
    async function loadUser() {
      console.log('🔵 [UserLoader] Starting user load & auth...');
      
      try {
        // 1. ჯერ ვცდილობთ Edge Function-ით ავტორიზაციას (ქმნის Supabase Auth სესიას)
        let tgUser = await initializeTelegramAuth();
        
        // 2. თუ Telegram-ში არ ვართ (მაგ. ბრაუზერში ტესტირება), ვიყენებთ ფოლბექს
        if (!tgUser) {
          console.warn('⚠️ [UserLoader] Edge Auth failed or not in Telegram. Using fallback.');
          tgUser = getTelegramUser();
        }
        
        if (!tgUser) {
          console.error('❌ [UserLoader] No Telegram user found at all.');
          setLoading(false);
          onReady();
          return;
        }

        console.log('🔵 [UserLoader] Auth successful. Loading user data from Supabase...');
        // 3. ახლა, როცა auth.uid() აქტიურია, ვიღებთ/ვქმნით მომხმარებელს
        const user = await getOrCreateUser(tgUser);
        
        if (user) {
          setUser(user);
          console.log('✅ [UserLoader] User saved to context!');
          console.log('📊 Onboarding completed:', user.onboarding_completed);
          console.log('♏ Sun sign:', user.sun_sign);
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
      console.log('🔵 Telegram WebApp detected');
      if (typeof tg.setHeaderColor === 'function') {
        tg.setHeaderColor('#0a0600');
      }
      if (typeof tg.setBackgroundColor === 'function') {
        tg.setBackgroundColor('#0a0600');
      }
      if (typeof tg.expand === 'function') {
        tg.expand();
      }
    } else {
      console.warn('⚠️ Telegram WebApp NOT detected');
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const updateLastActive = async () => {
      try {
        await updateUserLastActive(user.id);
        console.log('✅ [LastActive] Updated at:', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('❌ [LastActive] Error:', error);
      }
    };

    updateLastActive();
    const interval = setInterval(updateLastActive, 5 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateLastActive();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  useEffect(() => {
    if (!user || !supabase) return;

    let sessionStartTime = Date.now();
    let totalActiveTime = 0;
    let lastActiveTime = Date.now();
    let isTabActive = true;

    const getDeviceInfo = () => {
      const ua = navigator.userAgent;
      let deviceType = 'unknown', os = 'unknown', browser = 'unknown';

      if (/Mobile|Android|iPhone|iPad/i.test(ua)) deviceType = /iPad/i.test(ua) ? 'tablet' : 'mobile';
      else deviceType = 'desktop';

      if (/Windows/i.test(ua)) os = 'Windows';
      else if (/Mac/i.test(ua)) os = 'macOS';
      else if (/Android/i.test(ua)) os = 'Android';
      else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
      else if (/Linux/i.test(ua)) os = 'Linux';

      if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = 'Chrome';
      else if (/Firefox/i.test(ua)) browser = 'Firefox';
      else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
      else if (/Edge/i.test(ua)) browser = 'Edge';
      else browser = 'Other';

      return {
        device_type: deviceType, os, browser,
        user_agent: ua.substring(0, 200),
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        language: navigator.language
      };
    };

    const startSession = async () => {
      sessionStartTime = Date.now();
      lastActiveTime = Date.now();
      totalActiveTime = 0;
      isTabActive = true;
      const deviceInfo = getDeviceInfo();

      try {
        const { data: session, error } = await supabase
          .from('user_sessions')
          .insert({ user_id: user.id, started_at: new Date(sessionStartTime).toISOString(), device_info: deviceInfo })
          .select().single();
        if (error) console.error('❌ [Session] Error:', error);
        else console.log('✅ [Session] Started:', session?.id);
      } catch (error) { console.error('❌ [Session] Exception:', error); }
    };

    const endSession = async () => {
      if (!isTabActive) return;
      isTabActive = false;
      const sessionEndTime = Date.now();
      const duration = Math.floor((sessionEndTime - sessionStartTime) / 1000);
      if (duration < 5) return;

      try {
        const { error } = await supabase
          .from('user_sessions')
          .update({ ended_at: new Date(sessionEndTime).toISOString(), duration_seconds: duration })
          .eq('user_id', user.id).is('ended_at', null).order('started_at', { ascending: false }).limit(1);
        if (error) console.error('❌ [Session] End Error:', error);
        else console.log('✅ [Session] Ended. Duration:', duration, 's');
      } catch (error) { console.error('❌ [Session] Exception:', error); }
    };

    startSession();
    const trackInterval = setInterval(() => {
      if (!isTabActive) return;
      const now = Date.now();
      totalActiveTime += now - lastActiveTime;
      lastActiveTime = now;
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        isTabActive = false;
        totalActiveTime += Date.now() - lastActiveTime;
      } else if (document.visibilityState === 'visible') {
        isTabActive = true;
        lastActiveTime = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', endSession);
    window.addEventListener('pagehide', endSession);

    return () => {
      clearInterval(trackInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', endSession);
      window.removeEventListener('pagehide', endSession);
      endSession();
    };
  }, [user]);

  useEffect(() => {
    const syncTelegramChatId = async () => {
      if (!supabase || !user) return;
      const tg = (window as any).Telegram?.WebApp;
      if (!tg) return;
      const tgUser = tg.initDataUnsafe?.user;
      if (!tgUser || !tgUser.id) return;
      const chatId = String(tgUser.id);

      const { data: prefs } = await supabase.from('user_preferences').select('telegram_chat_id').eq('user_id', user.id).single();
      if (!prefs || prefs.telegram_chat_id !== chatId) {
        const { error } = await supabase.from('user_preferences').upsert({ user_id: user.id, telegram_chat_id: chatId }, { onConflict: 'user_id' });
        if (error) console.error('❌ Failed to sync Chat ID:', error);
        else console.log('✅ Chat ID synced:', chatId);
      }
    };
    syncTelegramChatId();
  }, [user]);

  const goTo = (screen: Screen) => {
    console.log('🔄 Navigating to:', screen);
    setCurrentScreen(screen);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    goTo(tab as Screen);
  };

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
    } else if (['home', 'cards', 'horoscope', 'astro', 'profile'].includes(screen)) {
      handleTabChange(screen);
    } else if (screen === 'admin' || screen === 'user-analytics' || screen === 'ai-management') {
      if (user && user.id === ADMIN_USER_ID) goTo(screen as Screen);
      else goTo('home');
    } else {
      goTo(screen as Screen);
    }
  };

  const handleUserReady = () => {
    setUserReady(true);
  };

  const handleSplashFinish = () => {
    if (!userReady) {
      const checkInterval = setInterval(() => {
        if (userReady) {
          clearInterval(checkInterval);
          handleSplashFinish();
        }
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