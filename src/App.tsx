import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import OnboardingWelcome from './components/OnboardingWelcome';
import OnboardingZodiac from './components/OnboardingZodiac';
import OnboardingFirstReading from './components/OnboardingFirstReading';
import HomeScreen from './components/HomeScreen';
import PricingScreen from './components/PricingScreen';
import './App.css';

type Screen = 
  | 'splash' 
  | 'welcome' 
  | 'zodiac' 
  | 'first-reading' 
  | 'home' 
  | 'pricing';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');

  // Telegram Header-ის ფერის დაყენება
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
        <HomeScreen onNavigate={(screen) => goTo(screen as Screen)} />
      )}
      {currentScreen === 'pricing' && (
        <PricingScreen onBack={() => goTo('home')} />
      )}
    </div>
  );
}

export default App;