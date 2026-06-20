import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import OnboardingWelcome from './components/OnboardingWelcome';
import OnboardingZodiac from './components/OnboardingZodiac';
import OnboardingFirstReading from './components/OnboardingFirstReading';
import HomeScreen from './components/HomeScreen';
import CardsScreen from './components/CardsScreen';
import ReadingScreen from './components/ReadingScreen';
import AstroScreen from './components/AstroScreen';
import ProfileScreen from './components/ProfileScreen';
import PricingScreen from './components/PricingScreen';
import CardFanScreen from './components/CardFanScreen';
import BottomNav from './components/BottomNav';
import { UserProvider, useUser } from './context/UserContext';
import { getTelegramUser } from './lib/telegramAuth';
import { getOrCreateUser, completeOnboarding } from './lib/userService';
import './App.css';

type Screen = 
  | 'splash' 
  | 'welcome' 
  | 'zodiac' 
  | 'first-reading' 
  | 'home' 
  | 'cards'
  | 'reading'
  | 'astro'
  | 'profile'
  | 'pricing'
  | 'card-fan';

// ===== USER LOADER COMPONENT =====
function UserLoader({ onReady }: { onReady: () => void }) {
  const { setUser, setLoading } = useUser();

  useEffect(() => {
    async function loadUser() {
      console.log('🔵 [UserLoader] Starting user load...');
      
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

// ===== MAIN APP CONTENT =====
function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
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

  const goTo = (screen: Screen) => {
    console.log('🔄 Navigating to:', screen);
    setCurrentScreen(screen);
  };

  const handleTabChange = (tab: string) => {
    console.log('📑 Tab change:', tab);
    setActiveTab(tab);
    goTo(tab as Screen);
  };

  const handleNavigate = (screen: string) => {
    console.log('🧭 handleNavigate called with:', screen);
    
    if (screen === 'draw' || screen === 'card-fan') {
      goTo('card-fan');
    } else if (screen === 'pricing') {
      goTo('pricing');
    } else if (['home', 'cards', 'reading', 'astro', 'profile'].includes(screen)) {
      handleTabChange(screen);
    } else {
      console.log('⚠️ Unknown screen:', screen);
    }
  };

  const handleUserReady = () => {
    console.log('✅ User loading complete!');
    setUserReady(true);
  };

  // ✅ Splash Screen დასრულდა - გადავწყვიტოთ სად წავიდეთ
  const handleSplashFinish = () => {
    console.log('🎬 Splash finished');
    console.log('📊 User onboarding_completed:', user?.onboarding_completed);
    
    if (!userReady) {
      // User ჯერ არ არის მზად - დაველოდოთ
      console.log('⏳ Waiting for user to load...');
      const checkInterval = setInterval(() => {
        if (userReady) {
          clearInterval(checkInterval);
          handleSplashFinish(); // ხელახლა გამოვიძახოთ
        }
      }, 100);
      return;
    }
    
    // User მზადაა - გადავწყვიტოთ სად წავიდეთ
    if (user?.onboarding_completed) {
      console.log('✅ User already completed onboarding → going to HOME');
      goTo('home');
    } else {
      console.log('🆕 New user → starting onboarding');
      goTo('welcome');
    }
  };

  // ✅ Onboarding დასრულდა - ბაზაში განვაახლოთ
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
      {currentScreen === 'profile' && (
        <>
          <ProfileScreen onNavigate={handleNavigate} />
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}
      {currentScreen === 'pricing' && (
        <PricingScreen onBack={() => goTo('home')} />
      )}
      {currentScreen === 'card-fan' && (
        <CardFanScreen onNavigate={handleNavigate} />
      )}
    </div>
  );
}

// ===== MAIN APP WITH PROVIDER =====
function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;