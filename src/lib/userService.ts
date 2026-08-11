import { supabase } from './supabase';
import { TelegramUser, createUserDataFromTelegram } from './telegramAuth';
import { logger } from './logger';

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
  onboarding_completed: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// 🛡️ HELPERS: Retry + Timeout (TypeScript-safe)
// ============================================

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelayMs: number = 500
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      
      // Don't retry business logic errors
      if (err?.code === 'PGRST116' || err?.isNotFound) {
        throw err;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        logger.warn(`⏳ Retry ${attempt + 1}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Add timeout to a real Promise
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`⏰ Timeout after ${ms}ms`)),
      ms
    );
    
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ============================================
// 🔍 USER QUERIES
// ============================================

export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  const db = supabase;
  if (!db) {
    logger.warn('⚠️ Supabase not available');
    return null;
  }
  
  try {
    const result = await retryWithBackoff(async () => {
      // ✅ Convert Supabase builder to real Promise via async IIFE
      return await withTimeout(
        (async () => {
          return await db
            .from('users')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();
        })(),
        8000
      );
    }, 2, 500);

    const { data, error } = result;

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      
      logger.error('❌ Error fetching user by telegram_id:', {
        telegramId,
        code: error.code,
        message: error.message
      });
      return null;
    }

    return data as User;
  } catch (err: any) {
    logger.error('❌ getUserByTelegramId failed after retries:', {
      telegramId,
      error: err.message
    });
    return null;
  }
}

export async function createUser(tgUser: TelegramUser, authUid: string): Promise<User | null> {
  const db = supabase;
  if (!db) {
    logger.warn('⚠️ Supabase not available');
    return null;
  }
  
  const userData = createUserDataFromTelegram(tgUser);
  const userDataWithId = { ...userData, id: authUid };
  
  try {
    const result = await retryWithBackoff(async () => {
      return await withTimeout(
        (async () => {
          return await db
            .from('users')
            .insert([userDataWithId])
            .select()
            .single();
        })(),
        8000
      );
    }, 2, 500);

    const { data, error } = result;

    if (error) {
      logger.error('❌ Error creating user:', {
        telegramId: tgUser.id,
        code: error.code,
        message: error.message
      });
      return null;
    }

    logger.log('✅ User created with correct Auth ID:', { id: data.id, telegramId: tgUser.id });
    return data as User;
  } catch (err: any) {
    logger.error('❌ createUser failed after retries:', {
      telegramId: tgUser.id,
      error: err.message
    });
    return null;
  }
}

async function fixUserIdMismatch(oldId: string, newAuthUid: string) {
  const db = supabase;
  if (!db) return;
  
  try {
    logger.log('🔧 Fixing ID mismatch: migrating from', oldId, 'to', newAuthUid);
    
    await db.from('users').update({ id: newAuthUid }).eq('id', oldId);
    await db.from('readings').update({ user_id: newAuthUid }).eq('user_id', oldId);
    await db.from('user_patterns').update({ user_id: newAuthUid }).eq('user_id', oldId);
    await db.from('streaks').update({ user_id: newAuthUid }).eq('user_id', oldId);
    await db.from('user_sessions').update({ user_id: newAuthUid }).eq('user_id', oldId);
    await db.from('user_preferences').update({ user_id: newAuthUid }).eq('user_id', oldId);
    
    logger.log('✅ Successfully migrated all user data to new Auth UID');
  } catch (err: any) {
    logger.error('❌ Failed to fix ID mismatch:', err.message);
  }
}

export async function getOrCreateUser(tgUser: TelegramUser): Promise<User | null> {
  const db = supabase;
  if (!db) {
    logger.error('❌ getOrCreateUser: Supabase not available');
    return null;
  }
  
  try {
    const { data: { user: authUser }, error: authError } = await withTimeout(
      (async () => {
        return await db.auth.getUser();
      })(),
      5000
    );

    if (authError || !authUser) {
      logger.error('❌ No authenticated user found. Edge Function might have failed.');
      return null;
    }

    const authUid = authUser.id;
    logger.log('🔑 Authenticated User ID (Auth UID):', authUid);

    let user = await getUserByTelegramId(tgUser.id);
    
    if (user) {
      logger.log('✅ Existing user found:', { userId: user.id });
      
      if (user.id !== authUid) {
        logger.warn('⚠️ ID Mismatch detected! Auto-fixing...');
        await fixUserIdMismatch(user.id, authUid);
        user = await getUserByTelegramId(tgUser.id);
      }
      
      return user;
    }

    logger.log('🆕 Creating new user with Auth UID:', authUid);
    user = await createUser(tgUser, authUid);
    
    if (!user) {
      logger.error('❌ Failed to create user - aborting to prevent data loss');
      return null;
    }
    
    return user;

  } catch (err: any) {
    logger.error('❌ Exception in getOrCreateUser:', err.message);
    return null;
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const db = supabase;
  if (!db) {
    logger.warn('⚠️ Supabase not available');
    return null;
  }
  
  try {
    const result = await retryWithBackoff(async () => {
      return await withTimeout(
        (async () => {
          return await db
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();
        })(),
        6000
      );
    }, 1, 300);

    const { data, error } = result;

    if (error) {
      logger.error('Error updating user:', {
        userId,
        code: error.code,
        message: error.message
      });
      return null;
    }

    logger.log('✅ User updated:', { userId, fields: Object.keys(updates) });
    return data as User;
  } catch (err: any) {
    logger.error('❌ updateUser failed:', {
      userId,
      error: err.message
    });
    return null;
  }
}

export async function completeOnboarding(userId: string): Promise<User | null> {
  logger.log('✅ Completing onboarding for user:', userId);
  return updateUser(userId, { onboarding_completed: true });
}

export async function resetZodiacSign(userId: string): Promise<User | null> {
  logger.log('🔄 Resetting zodiac sign for user:', userId);
  return updateUser(userId, { 
    sun_sign: null,
    birth_date: null,
    birth_time: null,
    birth_place: null
  });
}