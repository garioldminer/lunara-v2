import { supabase } from './supabase';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string | null;
  language_code?: string;
}

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
      console.warn('⚠️ Telegram SDK ან initData ვერ მოიძებნა.');
      return null;
    }

    console.log('🔄 ავტორიზაცია Supabase Edge Function-ის მეშვეობით...');
    console.log('🔍 initData length:', tg.initData.length);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      (window as any).__AUTH_ERROR = 'შეცდომა: VITE_SUPABASE_URL არ არის მითითებული';
      console.error('❌ VITE_SUPABASE_URL გარემოს ცვლადი ვერ მოიძებნა');
      return null;
    }

    const functionUrl = `${supabaseUrl}/functions/v1/telegram-auth`;
    console.log('📡 Sending request to:', functionUrl);
    console.log(' Request method: POST');
    console.log('📡 Request headers: Content-Type: application/json');

    // ვცდილობთ fetch-ს დეტალური ლოგინგით
    let response;
    try {
      response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ initData: tg.initData }),
      });
      console.log('📥 Response received, status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    } catch (fetchError: any) {
      console.error('❌ Fetch failed completely:', fetchError);
      console.error('❌ Fetch error name:', fetchError.name);
      console.error('❌ Fetch error message:', fetchError.message);
      (window as any).__AUTH_ERROR = `ქსელის შეცდომა: ${fetchError.message}. Edge Function-თან კავშირი ვერ მოხერხდა.`;
      return null;
    }

    const result = await response.json();
    console.log('📥 Edge Function response body:', result);

    if (!result.success || !result.session) {
      const errorMsg = result.error || 'Unknown Edge Function error';
      (window as any).__AUTH_ERROR = `Edge Function შეცდომა: ${errorMsg}`;
      console.error('❌ Edge Function-ის ავტორიზაცია ვერ მოხერხდა:', errorMsg);
      return null;
    }

    if (!supabase) {
      (window as any).__AUTH_ERROR = 'შეცდომა: Supabase კლიენტი არ არის ინიციალიზებული';
      console.error('❌ Supabase კლიენტი არ არის ინიციალიზებული');
      return null;
    }

    console.log('💾 Setting Supabase session...');
    const { error } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });

    if (error) {
      (window as any).__AUTH_ERROR = `სესიის შეცდომა: ${error.message}`;
      console.error('❌ Supabase სესიის დაყენება ვერ მოხერხდა:', error);
      return null;
    }

    console.log('✅ Supabase Auth სესია წარმატებით დამყარდა! auth.uid() ახლა აქტიურა.');
    (window as any).__AUTH_ERROR = null;
    
    return tg.initDataUnsafe.user as TelegramUser;

  } catch (err: any) {
    (window as any).__AUTH_ERROR = `კრიტიკული შეცდომა: ${err.message}`;
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