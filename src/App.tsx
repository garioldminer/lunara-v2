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

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      if (typeof tg.setHeaderColor === 'function') {
        tg.setHeaderColor('#0a0600');
      }
      if (typeof tg.setBackgroundColor === 'function') {
        tg.setBackgroundColor('#0a0600');
      }
    }
  }, []);

  const goTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    goTo(tab as Screen);
  };

  const handleNavigate = (screen: string) => {
    if (screen === 'pricing') {
      goTo('pricing');
    } else if (screen === 'card-fan') {
      goTo('card-fan');
    } else {
      handleTabChange(screen);
    }
  };

  return (
    <div className="app-container">
      {currentScreen === 'splash' && (
        <SplashScreen onFinish={() => goTo('welcome')} />
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
        <CardFanScreen onBack={() => goTo('home')} />
      )}
    </div>
  );
}

export default App;