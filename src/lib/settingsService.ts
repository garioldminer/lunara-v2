// ============================================
// SETTINGS SERVICE - მართავს ყველა settings-ს
// ============================================

export type Theme = 'dark' | 'light' | 'auto';
export type Language = 'en' | 'ka' | 'ru' | 'es';

export interface AppSettings {
  theme: Theme;
  language: Language;
  dailyReminder: boolean;
  reminderTime: string;
  horoscopeNotifs: boolean;
  moonPhaseAlerts: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
}

const SETTINGS_KEY = 'lunara_settings';

// ✅ Default settings
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'en',
  dailyReminder: true,
  reminderTime: '09:00',
  horoscopeNotifs: true,
  moonPhaseAlerts: true,
  soundEffects: true,
  hapticFeedback: true,
};

// ============================================
// GET SETTINGS
// ============================================
export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('❌ Error loading settings:', error);
  }
  return DEFAULT_SETTINGS;
}

// ============================================
// SAVE SETTINGS
// ============================================
export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    console.log('✅ Settings saved:', updated);
    
    // ✅ Apply theme immediately
    if (settings.theme) {
      applyTheme(settings.theme);
    }
    
    return updated;
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    return getSettings();
  }
}

// ============================================
// UPDATE SINGLE SETTING
// ============================================
export function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): AppSettings {
  return saveSettings({ [key]: value });
}

// ============================================
// APPLY THEME
// ============================================
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  
  let effectiveTheme: 'dark' | 'light' = 'dark';
  
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    effectiveTheme = prefersDark ? 'dark' : 'light';
  } else {
    effectiveTheme = theme;
  }
  
  root.setAttribute('data-theme', effectiveTheme);
  console.log(`🎨 Theme applied: ${effectiveTheme} (from ${theme})`);
}

// ============================================
// HAPTIC FEEDBACK
// ============================================
export function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
  const settings = getSettings();
  if (!settings.hapticFeedback) return;
  
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(style);
    }
  } catch (error) {
    console.log('⚠️ Haptic not available');
  }
}

// ============================================
// SOUND EFFECTS
// ============================================
export function playSound(sound: 'click' | 'success' | 'error' | 'notification'): void {
  const settings = getSettings();
  if (!settings.soundEffects) return;
  
  // ✅ Sound URLs (მოგვიანებით შეიძლება ჩავანაცვლოთ)
  const sounds: Record<string, string> = {
    click: '/sounds/click.mp3',
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3',
    notification: '/sounds/notification.mp3',
  };
  
  try {
    const audio = new Audio(sounds[sound]);
    audio.volume = 0.3;
    audio.play().catch(() => {
      // ✅ Silent fail - ხმა შეიძლება არ იყოს
    });
  } catch (error) {
    console.log('⚠️ Sound not available');
  }
}

// ============================================
// RESET SETTINGS
// ============================================
export function resetSettings(): AppSettings {
  localStorage.removeItem(SETTINGS_KEY);
  applyTheme(DEFAULT_SETTINGS.theme);
  console.log('🔄 Settings reset to defaults');
  return DEFAULT_SETTINGS;
}

// ============================================
// INITIALIZE SETTINGS
// ============================================
export function initializeSettings(): AppSettings {
  const settings = getSettings();
  applyTheme(settings.theme);
  console.log('⚙️ Settings initialized:', settings);
  return settings;
}