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
  // 🔧 FIX: სამუშაო "flag", რომ Splash-ის დასრულება reactive გზით დავიჭიროთ
  // (setInterval-ის ნაცვლად, რომელიც stale closure-ის გამო ჩამოეკიდებოდა ხოლმე)
  const [splashFinished, setSplashFinished] = useState(false);
  const { user, setUser } = useUser();

  // 🔧 FIX: Telegram-ის ready()/expand()/setHeaderColor() ინიციალიზაცია
  // ახლა მთლიანად main.tsx-ში ხდება (platform.ts-ის initTelegramApp()-ის მეშვეობით).
  // აქ დუბლირებული useEffect ამოღებულია, რომ აღარ ხდებოდეს
  // header-color-ის კონფლიქტი main.tsx-სა და App.tsx-ს შორის.

  useEffect(() => {
    if (!user) return;
    const updateLastActive = async () => {
      try { 
        await updateUserLastActive(user.id); 
      } catch (error) { 
        console.error('❌ [LastActive] Error:', error); 
      }
    };
    updateLastActive();
    const interval = setInterval(updateLastActive, 5 * 60 * 1000);

    // 🔧 FIX: named handler, რომ cleanup-ში სწორად მოვხსნათ
    // (მანამდე ეს listener არასდროს იშლებოდა, memory leak-ს იწვევდა
    //  ყოველ ჯერზე, როცა user ობიექტი შეიცვლებოდა)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') updateLastActive();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  // 🔧 FIX: Splash-ის დასრულების ლოგიკა reactive useEffect-ით,
  // setInterval-ზე დაფუძნებული polling-ის ნაცვლად.
  // ძველი ვერსია სამუდამოდ "ეკიდებოდა" Splash-ზე, თუ user-მონაცემები
  // Splash-ის ანიმაციაზე უფრო ნელა იტვირთებოდა (ნელი ინტერნეტის დროს).
  useEffect(() => {
    if (splashFinished && userReady) {
      if (user?.onboarding_completed) {
        setActiveTab('home');
        setCurrentScreen('home');
      } else {
        setCurrentScreen('welcome');
      }
    }
  }, [splashFinished, userReady, user]);

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
      // ✅ ავამოწმებთ is_admin ფლაგს და არა hardcoded ID-ს
      if (user && user.is_admin === true) {
        goTo(screen as Screen);
      } else {
        console.warn('⛔ Unauthorized admin access attempt by user:', user?.id);
        goTo('home');
      }
    } else if (screen === 'journal-stats') {
      goTo('journal-stats');
    } else {
      goTo(screen as Screen);
    }
  };

  const handleUserReady = () => setUserReady(true);

  // 🔧 FIX: SplashScreen-ის onFinish უბრალოდ state-ს დებს — რეალურ
  // navigation-ს ზემოთ არსებული useEffect უზრუნველყოფს.
  const handleSplashFinish = () => setSplashFinished(true);

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
      
      {/* 🎯 ONBOARDING SCREENS - NO wrapper padding (they have their own full-screen design) */}
      {currentScreen === 'splash' && <SplashScreen onFinish={handleSplashFinish} />}
      {currentScreen === 'welcome' && <OnboardingWelcome onFinish={() => goTo('zodiac')} />}
      {currentScreen === 'zodiac' && <OnboardingZodiac onFinish={() => goTo('first-reading')} />}
      {currentScreen === 'first-reading' && <OnboardingFirstReading onFinish={handleOnboardingComplete} />}
      
      {/* 🎯 SCREEN WRAPPER - ყველა main გვერდს აქვს padding Telegram header-ისთვის */}
      {/* 🔧 FIX: ერთი ErrorBoundary ახვევს ყველა ეკრანს, არა მხოლოდ HoroscopeScreen-ს — */}
      {/* ადრე runtime error ნებისმიერ სხვა ეკრანზე მთელ აპს crash-ავდა თეთრ ეკრანზე. */}
      <div className="screen-wrapper">
        <ErrorBoundary>
          {currentScreen === 'home' && <HomeScreen onNavigate={handleNavigate} />}
          {currentScreen === 'cards' && <CardsScreen onNavigate={handleNavigate} />}
          {currentScreen === 'reading' && <ReadingScreen onNavigate={handleNavigate} />}
          {currentScreen === 'astro' && <AstroScreen onNavigate={handleNavigate} />}
          {currentScreen === 'horoscope' && <HoroscopeScreen onNavigate={handleNavigate} />}
          {currentScreen === 'sign-selection' && <SignSelectionScreen onNavigate={handleNavigate} />}
          {currentScreen === 'profile' && <ProfileScreen onNavigate={handleNavigate} />}
          {currentScreen === 'card-fan' && <CardFanScreen onNavigate={handleNavigate} />}
          {currentScreen === 'card-detail' && selectedCardId !== null && <CardDetailScreen cardId={selectedCardId} onNavigate={handleNavigate} />}
          {currentScreen === 'daily-card' && <DailyCardScreen onNavigate={handleNavigate} />}
          {currentScreen === 'three-card-reading' && <ThreeCardReadingScreen onNavigate={handleNavigate} />}
          {currentScreen === 'reading-history' && <ReadingHistoryScreen onNavigate={handleNavigate} />}
          {currentScreen === 'celtic-cross' && <CelticCrossReadingScreen onNavigate={handleNavigate} />}
          {currentScreen === 'horseshoe' && <HorseshoeReadingScreen onNavigate={handleNavigate} />}
          {currentScreen === 'relationship' && <RelationshipReadingScreen onNavigate={handleNavigate} />}

          {/* 🆕 JOURNAL STATS SCREEN */}
          {currentScreen === 'journal-stats' && <JournalStatsScreen onNavigate={handleNavigate} />}

          {/* ✅ ადმინ ეკრანები */}
          {currentScreen === 'admin' && <AdminScreen onNavigate={handleNavigate} />}
          {currentScreen === 'user-analytics' && <UserAnalytics onNavigate={handleNavigate} />}
          {currentScreen === 'ai-management' && <AdminAIManagement onNavigate={handleNavigate} />}

          {currentScreen === 'subscription' && <SubscriptionScreen onNavigate={handleNavigate} />}
          {currentScreen === 'services' && <ServicesScreen onNavigate={handleNavigate} />}
        </ErrorBoundary>
      </div>
      
      {/* 🎯 BOTTOM NAV - გარეთ wrapper-დან, რომ არ მიიღოს padding-top */}
      {['home', 'cards', 'reading', 'astro', 'horoscope', 'profile'].includes(currentScreen) && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}
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