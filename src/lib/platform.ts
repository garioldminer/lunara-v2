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
// 🚀 TELEGRAM SDK ინიციალიზაცია — ერთადერთი ადგილი
// (მანამდე გაბნეული იყო index.html + main.tsx + App.tsx-ში,
//  ერთმანეთთან კონფლიქტური მნიშვნელობებით)
//
// ეს ფუნქცია გამოიძახება ერთხელ, main.tsx-დან,
// React-ის render-ის წინ.
// ============================================
const APP_BG_COLOR = '#0a0600'; // ერთი, კონსისტენტური მნიშვნელობა მთელი აპისთვის

export function initTelegramApp(): void {
  const tg = (window as any).Telegram?.WebApp;

  if (!tg) {
    logger.log('⚠️ Telegram WebApp not detected (running in browser)');
    return;
  }

  try {
    if (typeof tg.ready === 'function') tg.ready();
  } catch (e) {
    logger.log('⚠️ tg.ready() failed:', e);
  }

  try {
    if (typeof tg.expand === 'function') tg.expand();
  } catch (e) {
    logger.log('⚠️ tg.expand() failed:', e);
  }

  // 🔧 დაბრუნებულია ზუსტად ისე, როგორც ორიგინალ main.tsx-ში იყო —
  // იმავე setTimeout(100ms) დაყოვნებით და იმავე პოზიციაზე
  // (expand()-ისა და disableVerticalSwipes()-ს შორის).
  setTimeout(() => {
    try {
      if (typeof tg.requestFullscreen === 'function') {
        tg.requestFullscreen();
      }
    } catch (e) {
      logger.log('⚠️ tg.requestFullscreen() failed:', e);
    }
  }, 100);

  try {
    if (typeof tg.disableVerticalSwipes === 'function') tg.disableVerticalSwipes();
  } catch (e) {
    logger.log('⚠️ tg.disableVerticalSwipes() failed:', e);
  }

  // Header/background ფერი — ერთი, კონსისტენტური მნიშვნელობა.
  // მანამდე main.tsx აყენებდა 'transparent'-ს, App.tsx კი '#0a0600'-ს —
  // ეს კონფლიქტი აქ წყდება საბოლოოდ.
  try {
    if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor(APP_BG_COLOR);
  } catch (e) {
    logger.log('⚠️ tg.setHeaderColor() failed:', e);
  }

  try {
    if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor(APP_BG_COLOR);
  } catch (e) {
    logger.log('⚠️ tg.setBackgroundColor() failed:', e);
  }

  logger.log('✅ Telegram WebApp initialized', { version: tg.version || 'unknown' });
}

// ============================================
// 🎨 CSS Tokens-ების დაყენება <html>-ზე
// გამოიძახება ერთხელ, main.tsx-ში, initTelegramApp()-ის შემდეგ
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

  // 3. თემის მონიშვნა — index.html-ისა და index.css-ის
  // [data-theme="dark"/"light"] სისტემასთან დასაკავშირებლად
  root.setAttribute('data-theme', platform.isDarkTheme ? 'dark' : 'light');

  // 4. Safe area tokens (Telegram გვეუბნება ზუსტად — უფრო საიმედოა,
  // ვიდრე CSS-ის env(), რომელიც ზოგ Android WebView-ზე არასწორად მუშაობს)
  root.style.setProperty('--safe-top', `${platform.safeTop}px`);
  root.style.setProperty('--safe-bottom', `${platform.safeBottom}px`);

  // 5. Viewport token (dvh fallback-ით)
  root.style.setProperty('--app-height', `${platform.viewportStableHeight}px`);
  root.style.setProperty('--actual-height', `${platform.viewportStableHeight}px`);

  logger.log('🎯 Platform detected:', {
    platform: root.dataset.platform,
    screen: root.dataset.screen,
    theme: root.getAttribute('data-theme'),
    size: `${platform.screenWidth}×${platform.screenHeight}`,
    safeTop: platform.safeTop,
    haptics: platform.hasHaptics,
  });
}