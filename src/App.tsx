import { useState, useEffect } from 'react';
import './App.css';
import SplashScreen from './components/SplashScreen';
import OnboardingWelcome from './components/OnboardingWelcome';
import OnboardingZodiac from './components/OnboardingZodiac';
import OnboardingFirstReading from './components/OnboardingFirstReading';
import HomeScreen from './components/HomeScreen';

type Screen = 'splash' | 'welcome' | 'zodiac' | 'first-reading' | 'home';

function App() {
  const [screen, setScreen] = useState<Screen>('splash');

  useEffect(() => {
    console.log('🎯 Current screen:', screen);
  }, [screen]);

  return (
    <div className="app">
      {screen === 'splash' && (
        <SplashScreen onFinish={() => setScreen('welcome')} />
      )}
      
      {screen === 'welcome' && (
        <OnboardingWelcome onFinish={() => setScreen('zodiac')} />
      )}
      
      {screen === 'zodiac' && (
        <OnboardingZodiac onFinish={() => setScreen('first-reading')} />
      )}
      
      {screen === 'first-reading' && (
        <OnboardingFirstReading onFinish={() => setScreen('home')} />
      )}
      
      {screen === 'home' && <HomeScreen />}
    </div>
  );
}

export default App;