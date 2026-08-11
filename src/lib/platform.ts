// src/lib/platform.ts
// ============================================
// 🎯 ცენტრალური პლატფორმისა და ეკრანის იდენტიფიკაცია
// ინიციალიზდება ერთხელ, აპის გაშვებისას (Splash-ის დროს)
// იყენებს Telegram-ის ოფიციალურ API-ს (არა userAgent-ს!)
// ============================================

import { logger } from './logger';

export interface PlatformInfo {
  // ---- სად ვართ? ----
  isTelegram: boolean;          // Telegram Mini App-ია?
  isIOS: boolean;               // iPhone/iPad Telegram
  isAndroid: boolean;           // Android Telegram
  isMacOS: boolean;             // macOS Telegram
  isDesktop: boolean;           // tdesktop + macos
  isWeb: boolean;               // web.telegram.org
  isStandaloneBrowser: boolean; // ჩვეულებრივი browser (არა Telegram)

  // ---- რა ზომის ეკრანია? ----
  screenWidth: number;
  screenHeight: number;
  isCompact: boolean;           // < 380px  (SE, პატარა Android)
  isMedium: boolean;            // 380-427px (iPhone 13/14 = baseline)
  isLarge: boolean;             // 428-767px (Pro Max, Ultra)
  isTabletOrDesktop: boolean;   // >= 768px (iPad, Desktop window)

  // ---- რა შეგვიძლია? ----
  hasHaptics: boolean;          // ვიბრაცია ხელმისაწვდომია?
  safeTop: number;              // notch/status bar ზუსტი ზომა (Telegram-დან!)
  safeBottom: number;           // home indicator ზომა
  viewportStableHeight: number; // რეალური ხილული სიმაღლე
  isDarkTheme: boolean;         // Telegram-ის თემა მუქია?
}

function detectPlatform(): PlatformInfo {
  const tg = (window as any).Telegram?.WebApp;

  const platform: string = tg?.platform || 'unknown';
  const width = window.innerWidth;
  const height = window.innerHeight;

  const isTelegram = !!tg;

  return {
    isTelegram,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isMacOS: platform === 'macos',
    isDesktop: platform === 'tdesktop' || platform === 'macos',
    isWeb: platform === 'weba' || platform === 'webk',
    isStandaloneBrowser: !isTelegram,

    screenWidth: width,
    screenHeight: height,
    isCompact: width < 380,
    isMedium: width >= 380 && width < 428,
    isLarge: width >= 428 && width < 768,
    isTabletOrDesktop: width >= 768,

    hasHaptics: !!tg?.HapticFeedback,
    safeTop: tg?.safeAreaInset?.top ?? 0,
    safeBottom: tg?.safeAreaInset?.bottom ?? 0,
    viewportStableHeight: tg?.viewportStableHeight ?? height,
    isDarkTheme: tg?.colorScheme === 'dark',
  };
}

// 📦 ერთხელ გამოთვლილი ინფო (მთელი აპი იყენებს ამას)
export const platform: PlatformInfo = detectPlatform();

// ============================================
// 🎨 CSS Tokens-ების დაყენება <html>-ზე
// გამოიძახება ერთხელ, App.tsx-ში (Splash-ის დროს)
// ============================================
export function applyPlatformTokens(): void {
  const root = document.documentElement;

  // 1. პლატფორმის მონიშვნა (CSS: [data-platform="ios"] { ... })
  root.dataset.platform = platform.isIOS
    ? 'ios'
    : platform.isAndroid
    ? 'android'
    : platform.isDesktop
    ? 'desktop'
    : platform.isWeb
    ? 'web'
    : 'browser';

  // 2. ეკრანის კლასის მონიშვნა (CSS: [data-screen="large"] { ... })
  root.dataset.screen = platform.isCompact
    ? 'compact'
    : platform.isTabletOrDesktop
    ? 'expanded'
    : platform.isLarge
    ? 'large'
    : 'medium';

  // 3. Safe area tokens (Telegram გვეუბნება ზუსტად!)
  root.style.setProperty('--safe-top', `${platform.safeTop}px`);
  root.style.setProperty('--safe-bottom', `${platform.safeBottom}px`);

  // 4. Viewport token (dvh fallback-ით)
  root.style.setProperty('--app-height', `${platform.viewportStableHeight}px`);

  logger.log('🎯 Platform detected:', {
    platform: root.dataset.platform,
    screen: root.dataset.screen,
    size: `${platform.screenWidth}×${platform.screenHeight}`,
    safeTop: platform.safeTop,
    haptics: platform.hasHaptics,
  });
}