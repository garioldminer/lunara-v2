// Telegram WebApp-ის მონაცემების ამოღება

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string | null;
  language_code?: string;
}

// Mock user ტესტირებისთვის (როცა Telegram SDK არ არის)
const MOCK_USER: TelegramUser = {
  id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'test_user',
  photo_url: undefined,
  language_code: 'en',
};

export function getTelegramUser(): TelegramUser | null {
  try {
    const tg = (window as any).Telegram?.WebApp;
    
    if (!tg) {
      console.warn('⚠️ Telegram SDK not found - using mock');
      return MOCK_USER;
    }

    const user = tg.initDataUnsafe?.user;
    
    if (!user) {
      console.warn('⚠️ No Telegram user - using mock');
      return MOCK_USER;
    }

    console.log('✅ Telegram user loaded:', user);
    return user as TelegramUser;
  } catch (err) {
    console.error('❌ Error:', err);
    return MOCK_USER;
  }
}

export function getTelegramWebApp() {
  try {
    return (window as any).Telegram?.WebApp;
  } catch {
    return null;
  }
}

// Telegram-ის მონაცემებიდან Supabase user-ის ობიექტის შექმნა
export function createUserDataFromTelegram(tgUser: TelegramUser) {
  console.log('🔍 Creating user data from Telegram:', tgUser);
  
  const userData = {
    telegram_id: tgUser.id,
    username: tgUser.username || null,
    display_name: tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''),
    avatar_url: tgUser.photo_url || null,
    bio: null,
    sun_sign: null,
    moon_sign: null,
    rising_sign: null,
    partner_sign: null,
    birth_date: null,
    birth_time: null,
    birth_place: null,
    level: 1,
    xp: 0,
    gems: 100,
    streak: 0,
    current_plan: 'FREE',
    onboarding_completed: false, // ✅ ახალი field
  };
  
  console.log('✅ User data created:', userData);
  return userData;
}