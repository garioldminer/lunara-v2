import { supabase } from './supabase';

export interface ReadingCard {
  id: number;
  name: string;
  is_reversed: boolean;
  position?: string;
}

export interface Reading {
  user_id: string;
  reading_type: 'daily' | 'three-card' | 'celtic-cross' | 'horseshoe' | 'relationship';
  question?: string;
  cards: ReadingCard[];
}

// ============================================
// SAVE READING - წაკითხვის შენახვა
// ============================================
export async function saveReading(reading: Reading) {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('readings')
      .insert([reading])
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving reading:', error);
      return null;
    }

    console.log('✅ Reading saved:', data);
    
    // განაახლე user patterns
    await updateUserPatterns(reading.user_id);
    
    return data;
  } catch (error) {
    console.error('❌ Error in saveReading:', error);
    return null;
  }
}

// ============================================
// GET USER READINGS - მომხმარებლის წაკითხვები
// ============================================
export async function getUserReadings(userId: string, limit: number = 50) {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching readings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getUserReadings:', error);
    return [];
  }
}

// ============================================
// GET RECENT READINGS - ბოლო X დღის წაკითხვები
// ============================================
export async function getRecentReadings(userId: string, days: number = 30) {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return [];
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching recent readings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getRecentReadings:', error);
    return [];
  }
}

// ============================================
// UPDATE USER PATTERNS - პატერნების განახლება
// ============================================
async function updateUserPatterns(userId: string) {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return;
  }

  try {
    // მიიღე ბოლო 30 დღის წაკითხვები
    const readings = await getRecentReadings(userId, 30);
    
    if (readings.length === 0) return;

    // ანალიზი
    const allCards = readings.flatMap(r => r.cards);
    
    // საყვარელი კარტები (ყველაზე ხშირი)
    const cardCounts = new Map<string, number>();
    allCards.forEach(card => {
      cardCounts.set(card.name, (cardCounts.get(card.name) || 0) + 1);
    });
    
    const favoriteCards = Array.from(cardCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // თემების ამოცნობა (კითხვებიდან)
    const topics = readings
      .filter(r => r.question)
      .map(r => extractTopic(r.question!))
      .filter((t): t is string => t !== null);

    const topicCounts = new Map<string, number>();
    topics.forEach(topic => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });

    const favoriteTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);

    // საყვარელი დრო - Map-ით (ტიპ-უსაფრთხო)
    const hourCounts = new Map<number, number>();
    readings.forEach(r => {
      const hour = new Date(r.created_at).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    let preferredTime: string | null = null;
    let maxHour = -1;
    let maxCount = 0;
    
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        maxHour = hour;
      }
    });
    
    if (maxHour >= 0) {
      preferredTime = `${maxHour.toString().padStart(2, '0')}:00:00`;
    }

    // შენახვა
    const { error } = await supabase
      .from('user_patterns')
      .upsert({
        user_id: userId,
        favorite_cards: favoriteCards,
        favorite_topics: favoriteTopics,
        reading_frequency: readings.length,
        preferred_time: preferredTime,
        updated_at: new Date()
      });

    if (error) {
      console.error('❌ Error updating patterns:', error);
    } else {
      console.log('✅ Patterns updated');
    }
  } catch (error) {
    console.error('❌ Error in updateUserPatterns:', error);
  }
}

// ============================================
// HELPER: თემის ამოცნობა
// ============================================
function extractTopic(question: string): string | null {
  const lower = question.toLowerCase();
  
  if (lower.includes('love') || lower.includes('relationship') || lower.includes('partner')) {
    return 'love';
  }
  if (lower.includes('career') || lower.includes('job') || lower.includes('work')) {
    return 'career';
  }
  if (lower.includes('health') || lower.includes('wellness')) {
    return 'health';
  }
  if (lower.includes('money') || lower.includes('finance') || lower.includes('wealth')) {
    return 'finance';
  }
  if (lower.includes('spiritual') || lower.includes('growth')) {
    return 'spiritual';
  }
  
  return 'general';
}

// ============================================
// GET USER STREAK - streak-ის მიღება
// ============================================
export async function getUserStreak(userId: string) {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return { current_streak: 0, longest_streak: 0 };
  }

  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching streak:', error);
      return { current_streak: 0, longest_streak: 0 };
    }

    return data || { current_streak: 0, longest_streak: 0 };
  } catch (error) {
    console.error('❌ Error in getUserStreak:', error);
    return { current_streak: 0, longest_streak: 0 };
  }
}

// ============================================
// GET USER PATTERNS - პატერნების მიღება
// ============================================
export async function getUserPatterns(userId: string) {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_patterns')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching patterns:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getUserPatterns:', error);
    return null;
  }
}