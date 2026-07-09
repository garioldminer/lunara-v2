import { useEffect, useState } from 'react';
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
import { getTelegramUser } from './lib/telegramAuth';
import { getOrCreateUser, completeOnboarding } from './lib/userService';
import { updateUserLastActive } from './lib/adminService';
import './App.css';

// ✅ Admin user ID
const ADMIN_USER_ID = 'c9dbe3be-5c02-4034-8bfd-1d693eb02754';

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
      console.log(' [UserLoader] Starting user load...');
      
      try {
        const tgUser = getTelegramUser();
        console.log('🔵 [UserLoader] Telegram user:', tgUser);
        
        if (!tgUser) {
          console.warn('⚠️ [UserLoader] No Telegram user found');
          setLoading(false);
          onReady();
          return;
        }

        console.log('🔵 [UserLoader] Loading from Supabase...');
        const user = await getOrCreateUser(tgUser);
        console.log('🔵 [UserLoader] User from Supabase:', user);
        
        if (user) {
          setUser(user);
          console.log('✅ [UserLoader] User saved to context!');
          console.log('📊 Onboarding completed:', user.onboarding_completed);
          console.log('♏ Sun sign:', user.sun_sign);
        }
      } catch (error) {
        console.error('❌ [UserLoader] Error:', error);
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
      console.warn('️ Telegram WebApp NOT detected');
    }
  }, []);

  // 🆕 ეტაპი 1: Last Active Update
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
        console.log('️ [LastActive] Tab became visible - updating...');
        updateLastActive();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // 🆕 ეტაპი 2: Session Tracking
  useEffect(() => {
    if (!user) return;

    let sessionStartTime = Date.now();
    let totalActiveTime = 0;
    let lastActiveTime = Date.now();
    let isTabActive = true;

    const getDeviceInfo = () => {
      const ua = navigator.userAgent;
      let deviceType = 'unknown';
      let os = 'unknown';
      let browser = 'unknown';

      if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
        deviceType = /iPad/i.test(ua) ? 'tablet' : 'mobile';
      } else {
        deviceType = 'desktop';
      }

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
        device_type: deviceType,
        os: os,
        browser: browser,
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
          .insert({
            user_id: user.id,
            started_at: new Date(sessionStartTime).toISOString(),
            device_info: deviceInfo
          })
          .select()
          .single();

        if (error) {
          console.error(' [Session] Error starting session:', error);
        } else {
          console.log('✅ [Session] Started:', session.id);
          console.log(' [Session] Device:', deviceInfo);
        }
      } catch (error) {
        console.error('❌ [Session] Exception:', error);
      }
    };

    const endSession = async () => {
      if (!isTabActive) return;
      isTabActive = false;

      const sessionEndTime = Date.now();
      const duration = Math.floor((sessionEndTime - sessionStartTime) / 1000);

      if (duration < 5) {
        console.log('⚠️ [Session] Too short (< 5s), skipping:', duration, 'seconds');
        return;
      }

      try {
        const { error } = await supabase
          .from('user_sessions')
          .update({
            ended_at: new Date(sessionEndTime).toISOString(),
            duration_seconds: duration
          })
          .eq('user_id', user.id)
          .is('ended_at', null)
          .order('started_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error(' [Session] Error ending session:', error);
        } else {
          console.log('✅ [Session] Ended. Duration:', duration, 'seconds');
        }
      } catch (error) {
        console.error('❌ [Session] Exception:', error);
      }
    };

    const trackActiveTime = () => {
      if (!isTabActive) return;
      
      const now = Date.now();
      const timeSinceLastActive = now - lastActiveTime;
      
      if (timeSinceLastActive > 60000) {
        totalActiveTime += timeSinceLastActive;
        lastActiveTime = now;
        
        console.log('⏱️ [Session] Active time tracked:', Math.floor(totalActiveTime / 1000), 'seconds');
      }
    };

    startSession();

    const trackInterval = setInterval(trackActiveTime, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('👁️ [Session] Tab hidden - pausing...');
        isTabActive = false;
        const now = Date.now();
        totalActiveTime += now - lastActiveTime;
      } else if (document.visibilityState === 'visible') {
        console.log('👁️ [Session] Tab visible - resuming...');
        isTabActive = true;
        lastActiveTime = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      console.log('🚪 [Session] Page unloading - ending session...');
      endSession();
    };

    const handlePageHide = () => {
      console.log('📄 [Session] Page hidden - ending session...');
      endSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(trackInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      endSession();
    };
  }, [user]);

  const goTo = (screen: Screen) => {
    console.log('🔄 Navigating to:', screen);
    setCurrentScreen(screen);
  };

  const handleTabChange = (tab: string) => {
    console.log('📑 Tab change:', tab);
    setActiveTab(tab);
    goTo(tab as Screen);
  };

  const handleHoroscopeNavigate = (screen: string) => {
    console.log('🔮 Horoscope navigate called with:', screen);
    
    if (screen === 'horoscope') {
      if (!user?.sun_sign) {
        console.log('️ User has no sun_sign → redirecting to sign-selection');
        goTo('sign-selection');
        return;
      }
      
      console.log('✅ User has sun_sign → going to horoscope');
      goTo('horoscope');
    } else if (screen === 'sign-selection') {
      goTo('sign-selection');
    } else {
      handleNavigate(screen);
    }
  };

  const handleNavigate = (screen: string) => {
    console.log('🧭 handleNavigate called with:', screen);
    
    if (screen.startsWith('card-detail-')) {
      const cardId = parseInt(screen.split('-')[2]);
      console.log('💎 Opening card detail for ID:', cardId);
      setSelectedCardId(cardId);
      goTo('card-detail');
    }
    else if (screen === 'daily-card') {
      console.log('🌅 Opening Daily Card');
      goTo('daily-card');
    }
    else if (screen === 'three-card-reading') {
      console.log('🔮 Opening Three Card Reading');
      goTo('three-card-reading');
    }
    else if (screen === 'reading-history') {
      console.log('📚 Opening Reading History');
      goTo('reading-history');
    }
    else if (screen === 'celtic-cross') {
      console.log('✝️ Opening Celtic Cross Reading');
      goTo('celtic-cross');
    }
    else if (screen === 'horseshoe') {
      console.log('🐎 Opening Horseshoe Reading');
      goTo('horseshoe');
    }
    else if (screen === 'relationship') {
      console.log('❤️ Opening Relationship Reading');
      goTo('relationship');
    }
    else if (screen === 'horoscope') {
      console.log('🔮 Opening Horoscope Screen');
      handleHoroscopeNavigate('horoscope');
    }
    else if (screen === 'sign-selection') {
      console.log('♏ Opening Sign Selection Screen');
      goTo('sign-selection');
    }
    else if (screen === 'admin') {
      console.log('🔐 Opening Admin Panel');
      if (user && user.id === ADMIN_USER_ID) {
        goTo('admin');
      } else {
        console.warn('⛔ Unauthorized admin access attempt by user:', user?.id);
        goTo('home');
      }
    }
    else if (screen === 'user-analytics') {
      console.log('📊 Opening User Analytics');
      if (user && user.id === ADMIN_USER_ID) {
        goTo('user-analytics');
      } else {
        console.warn(' Unauthorized user analytics access attempt by user:', user?.id);
        goTo('home');
      }
    }
    else if (screen === 'ai-management') {
      console.log('🤖 Opening AI Management');
      if (user && user.id === ADMIN_USER_ID) {
        goTo('ai-management');
      } else {
        console.warn('⛔ Unauthorized AI management access attempt by user:', user?.id);
        goTo('home');
      }
    }
    else if (screen === 'subscription') {
      console.log('💎 Opening Subscription Screen');
      goTo('subscription');
    }
    else if (screen === 'services') {
      console.log('️ Opening Services Screen');
      goTo('services');
    }
    else if (screen === 'draw' || screen === 'card-fan') {
      goTo('card-fan');
    }
    else if (['home', 'cards', 'horoscope', 'astro', 'profile'].includes(screen)) {
      handleTabChange(screen);
    }
    else {
      console.log('⚠️ Unknown screen:', screen);
    }
  };

  const handleUserReady = () => {
    console.log('✅ User loading complete!');
    setUserReady(true);
  };

  const handleSplashFinish = () => {
    console.log('🎬 Splash finished');
    console.log('📊 User onboarding_completed:', user?.onboarding_completed);
    
    if (!userReady) {
      console.log('⏳ Waiting for user to load...');
      const checkInterval = setInterval(() => {
        if (userReady) {
          clearInterval(checkInterval);
          handleSplashFinish();
        }
      }, 100);
      return;
    }
    
    if (user?.onboarding_completed) {
      console.log('✅ User already completed onboarding → going to HOME');
      goTo('home');
    } else {
      console.log('🆕 New user → starting onboarding');
      goTo('welcome');
    }
  };

  const handleOnboardingComplete = async () => {
    console.log('🎉 Onboarding completed!');
    
    if (user) {
      const updatedUser = await completeOnboarding(user.id);
      if (updatedUser) {
        setUser(updatedUser);
        console.log('✅ Onboarding status updated in database');
      }
    }
    
    goTo('home');
  };

  console.log('📱 Current screen:', currentScreen);
  console.log('👤 User loaded:', user ? user.display_name : 'null');
  console.log('📊 Onboarding completed:', user?.onboarding_completed);
  console.log('♏ Sun sign:', user?.sun_sign);

  return (
    <div className="app-container">
      {!userReady && <UserLoader onReady={handleUserReady} />}

      {currentScreen === 'splash' && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}
      {currentScreen === 'welcome' && (
        <OnboardingWelcome onFinish={() => goTo('zodiac')} />
      )}
      {currentScreen === 'zodiac' && (
        <OnboardingZodiac onFinish={() => goTo('first-reading')} />
      )}
      {currentScreen === 'first-reading' && (
        <OnboardingFirstReading onFinish={handleOnboardingComplete} />
      )}
      {currentScreen === 'home' && (
        <>
          <HomeScreen onNavigate={handleNavigate} />
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
      {currentScreen === 'cards' && (
        <>
          <CardsScreen onNavigate={handleNavigate} />
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
      {currentScreen === 'reading' && (
        <>
          <ReadingScreen onNavigate={handleNavigate} />
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
      {currentScreen === 'astro' && (
        <>
          <AstroScreen onNavigate={handleNavigate} />
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
      {currentScreen === 'horoscope' && (
        <>
          <HoroscopeScreen onNavigate={handleNavigate} />
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
      {currentScreen === 'sign-selection' && (
        <SignSelectionScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'profile' && (
        <>
          <ProfileScreen onNavigate={handleNavigate} />
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
      {currentScreen === 'card-fan' && (
        <CardFanScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'card-detail' && selectedCardId && (
        <CardDetailScreen 
          cardId={selectedCardId} 
          onNavigate={handleNavigate} 
        />
      )}
      {currentScreen === 'daily-card' && (
        <DailyCardScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'three-card-reading' && (
        <ThreeCardReadingScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'reading-history' && (
        <ReadingHistoryScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'celtic-cross' && (
        <CelticCrossReadingScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'horseshoe' && (
        <HorseshoeReadingScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'relationship' && (
        <RelationshipReadingScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'admin' && (
        <AdminScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'user-analytics' && (
        <UserAnalytics onNavigate={handleNavigate} />
      )}
      {currentScreen === 'ai-management' && (
        <AdminAIManagement onNavigate={handleNavigate} />
      )}
      {currentScreen === 'subscription' && (
        <SubscriptionScreen onNavigate={handleNavigate} />
      )}
      {currentScreen === 'services' && (
        <ServicesScreen onNavigate={handleNavigate} />
      )}
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </UserProvider>
  );
}

export default App;