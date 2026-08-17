import React, { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { logger } from './lib/logger';
import { applyPlatformTokens } from './lib/platform';
import { queryClient, initSessionGuard } from './lib/queryClient';
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
import JournalStatsScreen from './components/JournalStatsScreen';
import './App.css';

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
    logger.error('🚨 ERROR BOUNDARY:', error, errorInfo);
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

type Screen = 
  | 'splash' | 'welcome' | 'zodiac' | 'first-reading' | 'home' | 'cards' | 'reading' 
  | 'astro' | 'horoscope' | 'sign-selection' | 'profile' | 'card-fan' | 'card-detail' 
  | 'daily-card' | 'three-card-reading' | 'reading-history' | 'celtic-cross' | 'horseshoe' 
  | 'relationship' | 'admin' | 'user-analytics' | 'ai-management' | 'subscription' | 'services'
  | 'journal-stats';

function UserLoader({ onReady }: { onReady: () => void }) {
  const { setUser, setLoading } = useUser();
  
  useEffect(() => {
    async function loadUser() {
      logger.log('🔵 [UserLoader] Starting user load & auth...');
      try {
        let tgUser = await initializeTelegramAuth();
        if (!tgUser) {
          logger.warn('⚠️ [UserLoader] Edge Auth failed. Using fallback.');
          tgUser = getTelegramUser();
        }
        if (!tgUser) {
          logger.error('❌ [UserLoader] No Telegram user found at all.');
          setLoading(false);
          onReady();
          return;
        }
        logger.log('🔵 [UserLoader] Loading user data from Supabase...');
        const user = await getOrCreateUser(tgUser);
        if (user) {
          setUser(user);
          logger.log('✅ [UserLoader] User saved to context!');
        }
      } catch (error) {
        logger.error('❌ [UserLoader] Critical Error:', error);
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
  
  const [splashFinished, setSplashFinished] = useState(false);
  
  const { user, setUser } = useUser();

  // 🎯 PLATFORM DETECTION + CSS TOKENS (ერთხელ, აპის გაშვებისას)
  useEffect(() => {
    applyPlatformTokens();

    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      if (typeof tg.ready === 'function') tg.ready();
      if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#0a0600');
      if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor('#0a0600');
      if (typeof tg.expand === 'function') tg.expand();

      const applyTopInset = () => {
        const content = tg.contentSafeAreaInset?.top;
        const safe = tg.safeAreaInset?.top;
        
        if (typeof content === 'number' && content > 0) {
          document.documentElement.style.setProperty('--tg-top-inset', `${content}px`);
          logger.log(`📐 [TopInset] contentSafeAreaInset: ${content}px`);
        } else if (typeof safe === 'number' && safe > 0) {
          document.documentElement.style.setProperty('--tg-top-inset', `${safe + 48}px`);
          logger.log(`📐 [TopInset] safeAreaInset + 48: ${safe + 48}px`);
        } else {
          document.documentElement.style.removeProperty('--tg-top-inset');
          logger.log('📐 [TopInset] SDK = 0 → CSS fallback: env() + 48px');
        }
      };

      applyTopInset();

      if (typeof tg.onEvent === 'function') {
        tg.onEvent('viewportChanged', applyTopInset);
        tg.onEvent('safeAreaChanged', applyTopInset);
        tg.onEvent('contentSafeAreaChanged', applyTopInset);
      }

      return () => {
        if (typeof tg.offEvent === 'function') {
          tg.offEvent('viewportChanged', applyTopInset);
          tg.offEvent('safeAreaChanged', applyTopInset);
          tg.offEvent('contentSafeAreaChanged', applyTopInset);
        }
      };
    }
  }, []);

  // 🛡️ SESSION GUARD — 5+ წუთი background-ში = cache clear (ახალი ციკლი)
  useEffect(() => {
    const cleanup = initSessionGuard();
    return cleanup;
  }, []);

  useEffect(() => {
    if (splashFinished && userReady) {
      if (user?.onboarding_completed) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('welcome');
      }
    }
  }, [splashFinished, userReady, user]);

  useEffect(() => {
    if (!user) return;
    
    const updateLastActive = async () => {
      try { 
        await updateUserLastActive(user.id); 
      } catch (error) { 
        logger.error('❌ [LastActive] Error:', error); 
      }
    };
    
    updateLastActive();
    const interval = setInterval(updateLastActive, 5 * 60 * 1000);
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateLastActive();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => { 
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  useEffect(() => {
    if (currentScreen === 'home') {
      document.body.classList.add('home-locked');
    } else {
      document.body.classList.remove('home-locked');
    }
  }, [currentScreen]);

  const goTo = (screen: Screen) => setCurrentScreen(screen);
  const handleTabChange = (tab: string) => { 
    setActiveTab(tab); 
    goTo(tab as Screen); 
  };
  
  const handleHoroscopeNavigate = (screen: string) => {
    if (screen === 'horoscope') {
      if (!user?.sun_sign) { 
        goTo('sign-selection'); 
        return; 
      }
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
      if (user && user.is_admin === true) {
        goTo(screen as Screen);
      } else {
        logger.warn('⛔ Unauthorized admin access attempt by user:', user?.id);
        goTo('home');
      }
    } else if (screen === 'journal-stats') {
      goTo('journal-stats');
    } else {
      goTo(screen as Screen);
    }
  };

  const handleUserReady = () => setUserReady(true);
  
  const handleSplashFinish = () => {
    setSplashFinished(true);
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
      
      {/* 🎯 ONBOARDING SCREENS - Conditional (one-time use) */}
      {currentScreen === 'splash' && <SplashScreen onFinish={handleSplashFinish} />}
      {currentScreen === 'welcome' && <OnboardingWelcome onFinish={() => goTo('zodiac')} />}
      {currentScreen === 'zodiac' && <OnboardingZodiac onFinish={() => goTo('first-reading')} />}
      {currentScreen === 'first-reading' && <OnboardingFirstReading onFinish={handleOnboardingComplete} />}
      
      {/* 🎯 MAIN SCREENS WRAPPER */}
      <div className="screen-wrapper">
        <ErrorBoundary>
          
          {/* ✅ KEEP-ALIVE TABS */}
          <div style={{ display: currentScreen === 'home' ? 'block' : 'none' }}>
            <HomeScreen onNavigate={handleNavigate} />
          </div>
          <div style={{ display: currentScreen === 'cards' ? 'block' : 'none' }}>
            <CardsScreen onNavigate={handleNavigate} />
          </div>
          <div style={{ display: currentScreen === 'astro' ? 'block' : 'none' }}>
            <AstroScreen onNavigate={handleNavigate} />
          </div>
          <div style={{ display: currentScreen === 'profile' ? 'block' : 'none' }}>
            <ProfileScreen onNavigate={handleNavigate} />
          </div>

          {/* ⚡ CONDITIONAL SCREENS */}
          {currentScreen === 'reading' && <ReadingScreen onNavigate={handleNavigate} />}
          {currentScreen === 'horoscope' && <HoroscopeScreen onNavigate={handleNavigate} />}
          {currentScreen === 'sign-selection' && <SignSelectionScreen onNavigate={handleNavigate} />}
          {currentScreen === 'card-fan' && <CardFanScreen onNavigate={handleNavigate} />}
          {currentScreen === 'card-detail' && selectedCardId !== null && (
            <CardDetailScreen cardId={selectedCardId} onNavigate={handleNavigate} />
          )}
          {currentScreen === 'daily-card' && <DailyCardScreen onNavigate={handleNavigate} />}
          {currentScreen === 'three-card-reading' && <ThreeCardReadingScreen onNavigate={handleNavigate} />}
          {currentScreen === 'reading-history' && <ReadingHistoryScreen onNavigate={handleNavigate} />}
          {currentScreen === 'celtic-cross' && <CelticCrossReadingScreen onNavigate={handleNavigate} />}
          {currentScreen === 'horseshoe' && <HorseshoeReadingScreen onNavigate={handleNavigate} />}
          {currentScreen === 'relationship' && <RelationshipReadingScreen onNavigate={handleNavigate} />}
          {currentScreen === 'journal-stats' && <JournalStatsScreen onNavigate={handleNavigate} />}
          {currentScreen === 'admin' && <AdminScreen onNavigate={handleNavigate} />}
          {currentScreen === 'user-analytics' && <UserAnalytics onNavigate={handleNavigate} />}
          {currentScreen === 'ai-management' && <AdminAIManagement onNavigate={handleNavigate} />}
          {currentScreen === 'subscription' && <SubscriptionScreen onNavigate={handleNavigate} />}
          {currentScreen === 'services' && <ServicesScreen onNavigate={handleNavigate} />}
          
        </ErrorBoundary>
      </div>
      
      {['home', 'cards', 'reading', 'astro', 'horoscope', 'profile'].includes(currentScreen) && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <SettingsProvider>
          <TranslationProvider>
            <AppContent />
          </TranslationProvider>
        </SettingsProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;