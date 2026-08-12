import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initTelegramApp, applyPlatformTokens } from './lib/platform';
import './index.css';

// ============================================
// 🚀 ინიციალიზაცია — ერთი, ცენტრალური წყარო
// (ადრე ეს ლოგიკა ნაწილობრივ აქვე იყო დუბლირებული,
//  ახლა მთლიანად platform.ts-შია გატანილი)
// ============================================
initTelegramApp();
applyPlatformTokens();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);