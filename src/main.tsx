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
        MainButton: any;
        themeParams: any;
      };
    };
  }
}

// ინიციალიზაცია
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
  
  console.log('✅ Telegram WebApp initialized');
} else {
  console.log('⚠️ Telegram WebApp not detected (running in browser)');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);