import { supabase } from './supabase';
import { TelegramUser, createUserDataFromTelegram } from './telegramAuth';

export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  partner_sign: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  level: number;
  xp: number;
  gems: number;
  streak: number;
  current_plan: string;
  created_at: string;
  updated_at: string;
}

// მომხმარებლის მოძიება Telegram ID-ით
export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data as User;
}

// ახალი მომხმარებლის შექმნა
export async function createUser(tgUser: TelegramUser): Promise<User | null> {
  const userData = createUserDataFromTelegram(tgUser);
  
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }

  console.log('✅ User created:', data);
  return data as User;
}

// მომხმარებლის მიღება ან შექმნა (upsert)
export async function getOrCreateUser(tgUser: TelegramUser): Promise<User | null> {
  // ჯერ ვცადოთ მოძიება
  let user = await getUserByTelegramId(tgUser.id);
  
  if (user) {
    console.log('✅ Existing user found:', user);
    return user;
  }

  // თუ არ არსებობს, შევქმნათ
  console.log('🆕 Creating new user...');
  user = await createUser(tgUser);
  return user;
}

// მომხმარებლის განახლება
export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }

  console.log('✅ User updated:', data);
  return data as User;
}