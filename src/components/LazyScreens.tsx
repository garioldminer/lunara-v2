import { lazy } from 'react';

/* ============================================
   🚀 Lazy-loaded Screens
   ჩაიტვირთება demand-ზე (როცა მომხმარებელი შევა იქ)
   ============================================ */

// Main tabs
export const HomeScreen = lazy(() => import('./HomeScreen'));
export const CardsScreen = lazy(() => import('./CardsScreen'));
export const AstroScreen = lazy(() => import('./AstroScreen'));
export const ProfileScreen = lazy(() => import('./ProfileScreen'));

// Horoscope & readings
export const HoroscopeScreen = lazy(() => import('./HoroscopeScreen'));
export const ReadingScreen = lazy(() => import('./ReadingScreen'));
export const SignSelectionScreen = lazy(() => import('./SignSelectionScreen'));

// Tarot cards
export const CardFanScreen = lazy(() => import('./CardFanScreen'));
export const CardDetailScreen = lazy(() => import('./CardDetailScreen'));
export const DailyCardScreen = lazy(() => import('./DailyCardScreen'));
export const ThreeCardReadingScreen = lazy(() => import('./ThreeCardReadingScreen'));
export const CelticCrossReadingScreen = lazy(() => import('./CelticCrossReadingScreen'));
export const HorseshoeReadingScreen = lazy(() => import('./HorseshoeReadingScreen'));
export const RelationshipReadingScreen = lazy(() => import('./RelationshipReadingScreen'));
export const ReadingHistoryScreen = lazy(() => import('./ReadingHistoryScreen'));

// Journal (uses three.js!)
export const JournalStatsScreen = lazy(() => import('./JournalStatsScreen'));

// Admin
export const AdminScreen = lazy(() => import('./AdminScreen'));
export const AdminAIManagement = lazy(() => import('./AdminAIManagement'));
export const UserAnalytics = lazy(() => import('./UserAnalytics'));

// Commerce
export const SubscriptionScreen = lazy(() => import('./SubscriptionScreen'));
export const ServicesScreen = lazy(() => import('./ServicesScreen'));