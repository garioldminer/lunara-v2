import { supabase } from './supabase';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string | null;
  language_code?: string;
}

// სინქრონული ფუნქცია Telegram-ის მომხმარებლის მონაცემების მისაღებად (UI-სთვის)
export function getTelegramUser(): TelegramUser | null {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initDataUnsafe?.user) {
      return tg.initDataUnsafe.user as TelegramUser;
    }
    return null;
  } catch (err) {
    console.error('❌ Error getting Telegram user:', err);
    return null;
  }
}

export async function initializeTelegramAuth(): Promise<TelegramUser | null> {
  try {
    const tg = (window as any).Telegram?.WebApp;
    
    if (!tg || !tg.initData) {
      console.warn('⚠️ Telegram SDK ან initData ვერ მოიძებნა. Edge Function ვერ შესრულდება.');
      return null;
    }

    console.log('🔄 ავტორიზაცია Supabase Edge Function-ის მეშვეობით...');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('❌ VITE_SUPABASE_URL გარემოს ცვლადი ვერ მოიძებნა');
      return null;
    }

    // 1. ვგზავნით initData-ს ჩვენს Edge Function-ში
    const response = await fetch(`${supabaseUrl}/functions/v1/telegram-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: tg.initData }),
    });

    const result = await response.json();

    if (!result.success || !result.session) {
      console.error('❌ Edge Function-ის ავტორიზაცია ვერ მოხერხდა:', result.error);
      return null;
    }

    // 2. TypeScript-ისთვის უსაფრთხოების შემოწმება
    if (!supabase) {
      console.error('❌ Supabase კლიენტი არ არის ინიციალიზებული');
      return null;
    }

    // 3. ვაყენებთ Supabase-ის ავტორიზებულ სესიას!
    const { error } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });

    if (error) {
      console.error('❌ Supabase სესიის დაყენება ვერ მოხერხდა:', error);
      return null;
    }

    console.log('✅ Supabase Auth სესია წარმატებით დამყარდა! auth.uid() ახლა აქტიურია.');
    
    return tg.initDataUnsafe.user as TelegramUser;

  } catch (err) {
    console.error('❌ შეცდომა initializeTelegramAuth-ში:', err);
    return null;
  }
}

export function getTelegramWebApp() {
  try {
    return (window as any).Telegram?.WebApp;
  } catch {
    return null;
  }
}

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
    onboarding_completed: false,
  };
}