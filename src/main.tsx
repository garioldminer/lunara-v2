import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Telegram Web App ინიციალიზაცია
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        requestFullscreen: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        disableVerticalSwipes: () => void;
        enableVerticalSwipes: () => void;
        viewportHeight: number;
        viewportStableHeight: number;
        isFullscreen: boolean;
        isExpanded: boolean;
        MainButton: any;
        BackButton: any;
        themeParams: any;
        version: string;
      };
    };
  }
}

// ინიციალიზაცია
function initTelegram() {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    
    console.log('📱 Telegram WebApp version:', tg.version);
    
    // მზადყოფნა
    tg.ready();
    
    // გაფართოება
    tg.expand();
    
    // სრული ეკრანის მოთხოვნა (Bot API 8.0+)
    setTimeout(() => {
      if (tg.requestFullscreen) {
        tg.requestFullscreen();
        console.log('✅ Fullscreen requested');
      } else {
        console.log('⚠️ requestFullscreen not available');
      }
    }, 100);
    
    // ვერტიკალური swipe-ის გამორთვა (Bot API 7.7+)
    if (tg.disableVerticalSwipes) {
      tg.disableVerticalSwipes();
      console.log('✅ Vertical swipes disabled');
    } else {
      console.log('⚠️ disableVerticalSwipes not available');
    }
    
    // Header-ის გამჭვირვალე გაკეთება
    tg.setHeaderColor('transparent');
    
    // Background-ის ფერი
    tg.setBackgroundColor('#0a0600');
    
    // CSS variables
    document.documentElement.style.setProperty(
      '--tg-viewport-height',
      tg.viewportHeight + 'px'
    );
    document.documentElement.style.setProperty(
      '--tg-viewport-stable-height',
      tg.viewportStableHeight + 'px'
    );
    
    console.log('✅ Telegram WebApp initialized');
    console.log('📱 Viewport height:', tg.viewportHeight);
    console.log('🔲 Is fullscreen:', tg.isFullscreen);
    console.log('🔲 Is expanded:', tg.isExpanded);
  } else {
    console.log('⚠️ Telegram WebApp not detected (running in browser)');
  }
}

// გაშვება
initTelegram();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);