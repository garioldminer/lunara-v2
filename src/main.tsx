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
        requestFullscreen?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        disableVerticalSwipes?: () => void;
        viewportHeight?: number;
        viewportStableHeight?: number;
        isFullscreen?: boolean;
        isExpanded?: boolean;
        version?: string;
        MainButton: any;
        BackButton: any;
        themeParams: any;
      };
    };
  }
}

// ინიციალიზაცია
function initTelegram() {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    
    console.log(' Telegram WebApp version:', tg.version || 'unknown');
    
    try {
      // მზადყოფნა
      tg.ready();
      console.log('✅ ready() called');
    } catch (e) {
      console.log('⚠️ ready() failed:', e);
    }
    
    try {
      // გაფართოება
      tg.expand();
      console.log('✅ expand() called');
    } catch (e) {
      console.log('⚠️ expand() failed:', e);
    }
    
    // სრული ეკრანის მოთხოვნა (მხოლოდ თუ მხარდაჭერილია)
    setTimeout(() => {
      try {
        if (tg.requestFullscreen) {
          tg.requestFullscreen();
          console.log('✅ Fullscreen requested');
        } else {
          console.log('⚠️ requestFullscreen not available in this version');
        }
      } catch (e) {
        console.log('️ requestFullscreen failed:', e);
      }
    }, 100);
    
    // ვერტიკალური swipe-ის გამორთვა
    try {
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
        console.log('✅ Vertical swipes disabled');
      } else {
        console.log('⚠️ disableVerticalSwipes not available');
      }
    } catch (e) {
      console.log('⚠️ disableVerticalSwipes failed:', e);
    }
    
    // Header-ის გამჭვირვალე გაკეთება
    try {
      if (tg.setHeaderColor) {
        tg.setHeaderColor('transparent');
        console.log('✅ Header color set to transparent');
      }
    } catch (e) {
      console.log('⚠️ setHeaderColor failed:', e);
    }
    
    // Background-ის ფერი
    try {
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#0a0600');
        console.log('✅ Background color set');
      }
    } catch (e) {
      console.log('⚠️ setBackgroundColor failed:', e);
    }
    
    // CSS variables
    if (tg.viewportHeight) {
      document.documentElement.style.setProperty(
        '--tg-viewport-height',
        tg.viewportHeight + 'px'
      );
    }
    if (tg.viewportStableHeight) {
      document.documentElement.style.setProperty(
        '--tg-viewport-stable-height',
        tg.viewportStableHeight + 'px'
      );
    }
    
    console.log('✅ Telegram WebApp initialized');
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