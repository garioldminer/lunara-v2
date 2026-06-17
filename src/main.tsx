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
        viewportHeight: string;
        viewportStableHeight: string;
        MainButton: any;
        themeParams: any;
      };
    };
  }
}

// ინიციალიზაცია
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand(); // სრულ ეკრანზე გაშლა
  
  // CSS variables Telegram viewport-ისთვის
  document.documentElement.style.setProperty(
    '--tg-viewport-height',
    window.Telegram.WebApp.viewportHeight + 'px'
  );
  document.documentElement.style.setProperty(
    '--tg-viewport-stable-height',
    window.Telegram.WebApp.viewportStableHeight + 'px'
  );
  
  console.log('✅ Telegram WebApp initialized');
  console.log('📱 Viewport height:', window.Telegram.WebApp.viewportHeight);
} else {
  console.log('⚠️ Telegram WebApp not detected (running in browser)');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);