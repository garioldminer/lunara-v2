// Telegram WebApp-ის მონაცემების ამოღება

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
  }
  
  export function getTelegramUser(): TelegramUser | null {
    const tg = (window as any).Telegram?.WebApp;
    
    if (!tg) {
      console.warn('⚠️ Telegram WebApp not found');
      return null;
    }
  
    const user = tg.initDataUnsafe?.user;
    
    if (!user) {
      console.warn('⚠️ Telegram user not found in initDataUnsafe');
      return null;
    }
  
    console.log('✅ Telegram user loaded:', user);
    return user as TelegramUser;
  }
  
  export function getTelegramWebApp() {
    return (window as any).Telegram?.WebApp;
  }
  
  // Telegram-ის მონაცემებიდან Supabase user-ის ობიექტის შექმნა
  export function createUserDataFromTelegram(tgUser: TelegramUser) {
    return {
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
    };
  }