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
import DebugPanel from './components/DebugPanel';
import { UserProvider, useUser } from './context/UserContext';
import { getTelegramUser } from './lib/telegramAuth';
import { getOrCreateUser } from './lib/userService';
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
// Splash Screen-ზევე ტვირთავს user-ს
function UserLoader({ onReady }: { onReady: () => void }) {
  const { setUser, setLoading } = useUser();

  useEffect(() => {
    async function loadUser() {
      console.log('🔵 [UserLoader] Starting user load...');
      
      try {
        // 1. Telegram user-ის მიღება
        const tgUser = getTelegramUser();
        console.log('🔵 [UserLoader] Telegram user:', tgUser);
        
        if (!tgUser) {
          console.warn('⚠️ [UserLoader] No Telegram user found');
          setLoading(false);
          onReady();
          return;
        }

        // 2. Supabase-ში ჩაწერა/მოძიება
        console.log('🔵 [UserLoader] Loading from Supabase...');
        const user = await getOrCreateUser(tgUser);
        console.log('🔵 [UserLoader] User from Supabase:', user);
        
        if (user) {
          // 3. Context-ში შენახვა
          setUser(user);
          console.log('✅ [UserLoader] User saved to context!');
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

  return null; // არაფერს არ აჩვენებს
}

// ===== MAIN APP CONTENT =====
function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [userReady, setUserReady] = useState(false);
  const { user, loading } = useUser();

  // Telegram WebApp ინიციალიზაცია
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
      console.log('✅ Going to card-fan screen');
      goTo('card-fan');
    } else if (screen === 'pricing') {
      console.log('✅ Going to pricing screen');
      goTo('pricing');
    } else if (screen === 'home' || screen === 'cards' || screen === 'reading' || screen === 'astro' || screen === 'profile') {
      console.log('✅ Tab change to:', screen);
      handleTabChange(screen);
    } else {
      console.log('⚠️ Unknown screen:', screen);
    }
  };

  // User-ის ჩატვირთვა დასრულდა
  const handleUserReady = () => {
    console.log('✅ User loading complete!');
    setUserReady(true);
  };

  // Splash Screen დასრულდა
  const handleSplashFinish = () => {
    console.log('🎬 Splash finished');
    if (userReady) {
      console.log('✅ User ready, going to welcome...');
      goTo('welcome');
    } else {
      console.log('⏳ Waiting for user to load...');
      // დაველოდოთ user-ს
      const checkInterval = setInterval(() => {
        if (userReady) {
          clearInterval(checkInterval);
          console.log('✅ User loaded, going to welcome...');
          goTo('welcome');
        }
      }, 100);
    }
  };

  console.log('📱 Current screen:', currentScreen);
  console.log('👤 User loaded:', user ? user.display_name : 'null');
  console.log('⏳ Loading:', loading);
  console.log('✅ User ready:', userReady);

  return (
    <div className="app-container">
      {/* 🔍 DEBUG PANEL */}
      <DebugPanel />

      {/* 👤 USER LOADER - Splash Screen-ზევე ტვირთავს */}
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
        <OnboardingFirstReading onFinish={() => goTo('home')} />
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