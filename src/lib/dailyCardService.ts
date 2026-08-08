import { supabase } from './supabase';
import { tarotCards, TarotCard } from '../data/tarotCards';

// ============================================
// TYPES
// ============================================
export interface DailyReading {
  id: string;
  user_id: string;
  reading_type: 'daily';
  question: string | null;
  cards: Array<{
    id: number;
    name: string;
    is_reversed: boolean;
  }>;
  notes: string | null;
  is_bookmarked: boolean;
  focus_area: 'general' | 'love' | 'career' | 'custom';
  reading_date: string;
  created_at: string;
  // 🆕 MOOD TRACKING
  mood: Mood | null;
  mood_at_read: string | null;
  // 🆕 REFLECTION PROMPT
  reflection_prompt: string | null;
}

export type FocusArea = 'general' | 'love' | 'career' | 'custom';

// 🆕 MOOD TRACKING TYPES
export type Mood = 'terrible' | 'bad' | 'okay' | 'good' | 'amazing';

export const MOODS: Array<{ value: Mood; emoji: string; label: string; color: string }> = [
  { value: 'terrible', emoji: '😞', label: 'Terrible', color: '#ef4444' },
  { value: 'bad',      emoji: '😕', label: 'Bad',      color: '#f97316' },
  { value: 'okay',     emoji: '😐', label: 'Okay',     color: '#fbbf24' },
  { value: 'good',     emoji: '🙂', label: 'Good',     color: '#84cc16' },
  { value: 'amazing',  emoji: '🤩', label: 'Amazing',  color: '#10b981' },
];

// 🆕 JOURNAL STATS TYPES
export interface JournalStats {
  total_readings: number;
  total_bookmarked: number;
  bookmark_percentage: number;
  current_streak: number;
  longest_streak: number;
  
  // Mood Distribution
  mood_distribution: {
    terrible: number;
    bad: number;
    okay: number;
    good: number;
    amazing: number;
  };
  average_mood_score: number; // 1-5 scale
  most_common_mood: Mood | null;
  
  // Card Stats
  most_drawn_cards: Array<{
    id: number;
    name: string;
    count: number;
  }>;
  
  // Focus Areas
  focus_breakdown: {
    general: number;
    love: number;
    career: number;
    custom: number;
  };
  
  // Notes Stats
  total_notes_written: number;
  average_note_length: number;
  
  // Date Range
  first_reading_date: string | null;
  latest_reading_date: string | null;
  days_since_first: number;
}

// ============================================
// 🆕 REFLECTION PROMPT GENERATION (Dynamic)
// ============================================
const MAJOR_PROMPTS = [
  'What life lesson is the universe teaching you right now?',
  'What major change are you being called to embrace?',
  'What part of your journey needs your full attention today?',
  'What inner strength can you draw upon right now?',
  'What old chapter is ready to close so a new one can begin?',
  'What truth about yourself are you ready to acknowledge?'
];

const WANDS_PROMPTS = [
  'What passion is ready to ignite within you today?',
  'Where can you take bold, inspired action right now?',
  'What creative spark deserves your energy today?',
  'What goal are you ready to pursue with full confidence?'
];

const CUPS_PROMPTS = [
  'What emotion is asking to be felt and honored today?',
  'How can you deepen a meaningful connection right now?',
  'What does your heart truly need at this moment?',
  'What feeling have you been avoiding that deserves attention?'
];

const SWORDS_PROMPTS = [
  'What thought pattern is ready to be released today?',
  'Where can you bring clarity instead of confusion right now?',
  'What truth do you need to speak or hear today?',
  'What mental burden can you set down right now?'
];

const PENTACLES_PROMPTS = [
  'What practical step can you take toward your goals today?',
  'What resource or skill are you ready to cultivate right now?',
  'Where can you build more stability in your life today?',
  'What small investment now will pay off later?'
];

const REVERSED_TWIST = ' (Take a moment to look inward before answering.)';

const FOCUS_SUFFIX: Record<FocusArea, string> = {
  general: '',
  love: ' Think about your relationships and heart.',
  career: ' Think about your work and ambitions.',
  custom: ''
};

export function generateReflectionPrompt(
  card: TarotCard,
  focusArea: FocusArea,
  isReversed: boolean,
  seed: number
): string {
  let pool: string[];

  if (card.arcana === 'major') {
    pool = MAJOR_PROMPTS;
  } else {
    switch (card.suit) {
      case 'wands': pool = WANDS_PROMPTS; break;
      case 'cups': pool = CUPS_PROMPTS; break;
      case 'swords': pool = SWORDS_PROMPTS; break;
      case 'pentacles': pool = PENTACLES_PROMPTS; break;
      default: pool = MAJOR_PROMPTS;
    }
  }

  const prompt = pool[seed % pool.length];
  const twist = isReversed ? REVERSED_TWIST : '';
  const suffix = FOCUS_SUFFIX[focusArea] || '';

  return prompt + twist + suffix;
}

// ============================================
// HELPER: Hash Function (Personalized Seed)
// ============================================
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================
// GET TODAY'S READING (თუ უკვე არსებობს)
// ============================================
export async function getTodayReading(userId: string): Promise<DailyReading | null> {
  if (!supabase) return null;

  try {
    const today = getTodayDate();
    
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', userId)
      .eq('reading_type', 'daily')
      .eq('reading_date', today)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('❌ Error fetching today reading:', error);
      return null;
    }

    return data as DailyReading;
  } catch (error) {
    console.error('❌ Error in getTodayReading:', error);
    return null;
  }
}

// ============================================
// GET RECENT DAILY CARDS (განმეორების თავიდან ასაცილებლად)
// ============================================
async function getRecentDailyCards(userId: string, days: number = 30): Promise<number[]> {
  if (!supabase) return [];

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('readings')
      .select('cards')
      .eq('user_id', userId)
      .eq('reading_type', 'daily')
      .gte('reading_date', startDate.toISOString().split('T')[0])
      .order('reading_date', { ascending: false });

    if (error) {
      console.error('❌ Error fetching recent daily cards:', error);
      return [];
    }

    const recentCardIds = new Set<number>();
    data?.forEach(reading => {
      reading.cards.forEach((card: any) => {
        if (card.id) recentCardIds.add(card.id);
      });
    });

    return Array.from(recentCardIds);
  } catch (error) {
    console.error('❌ Error in getRecentDailyCards:', error);
    return [];
  }
}

// ============================================
// GET DAILY CARD (Personalized + No Repeats)
// ============================================
export async function getDailyCard(
  userId: string,
  focusArea: FocusArea = 'general',
  question?: string
): Promise<DailyReading | null> {
  if (!supabase) return null;

  try {
    const existing = await getTodayReading(userId);
    if (existing) {
      return existing;
    }

    const recentCardIds = await getRecentDailyCards(userId, 30);
    
    let availableCards = tarotCards.filter(card => !recentCardIds.includes(card.id));
    
    if (availableCards.length < 5) {
      console.warn('⚠️ Less than 5 available cards, using full deck');
      availableCards = tarotCards;
    }

    const today = getTodayDate();
    const seed = hashString(userId + today);
    const cardIndex = seed % availableCards.length;
    const card = availableCards[cardIndex];
    
    const isReversed = (seed % 100) < 50;

    // 🆕 Generate reflection prompt for this card
    const reflectionPrompt = generateReflectionPrompt(card, focusArea, isReversed, seed);

    const { data, error } = await supabase
      .from('readings')
      .insert([{
        user_id: userId,
        reading_type: 'daily',
        question: question || null,
        cards: [{
          id: card.id,
          name: card.name,
          is_reversed: isReversed
        }],
        focus_area: focusArea,
        reading_date: today,
        notes: null,
        is_bookmarked: false,
        reflection_prompt: reflectionPrompt
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating daily reading:', error);
      return null;
    }

    console.log('✅ Daily reading created:', {
      card: card.name,
      reversed: isReversed,
      focus: focusArea,
      prompt: reflectionPrompt.substring(0, 50) + '...'
    });

    return data as DailyReading;
  } catch (error) {
    console.error('❌ Error in getDailyCard:', error);
    return null;
  }
}

// ============================================
// UPDATE FOCUS AREA & QUESTION
// ============================================
export async function updateDailyFocus(
  readingId: string,
  focusArea: FocusArea,
  question?: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('readings')
      .update({
        focus_area: focusArea,
        question: question || null
      })
      .eq('id', readingId);

    if (error) {
      console.error('❌ Error updating focus:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error in updateDailyFocus:', error);
    return false;
  }
}

// ============================================
// UPDATE NOTES
// ============================================
export async function updateDailyNotes(
  readingId: string,
  notes: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('readings')
      .update({ notes })
      .eq('id', readingId);

    if (error) {
      console.error('❌ Error updating notes:', error);
      return false;
    }

    console.log('✅ Notes updated');
    return true;
  } catch (error) {
    console.error('❌ Error in updateDailyNotes:', error);
    return false;
  }
}

// ============================================
// 🆕 UPDATE MOOD (Mood Tracking)
// ============================================
export async function updateMood(readingId: string, mood: Mood): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('readings')
      .update({ 
        mood, 
        mood_at_read: new Date().toISOString() 
      })
      .eq('id', readingId);

    if (error) {
      console.error('❌ Error updating mood:', error);
      return false;
    }

    console.log('✅ Mood updated:', mood);
    return true;
  } catch (error) {
    console.error('❌ Error in updateMood:', error);
    return false;
  }
}

// ============================================
// TOGGLE BOOKMARK
// ============================================
export async function toggleBookmark(readingId: string): Promise<boolean | null> {
  if (!supabase) return null;

  try {
    const { data: current, error: fetchError } = await supabase
      .from('readings')
      .select('is_bookmarked')
      .eq('id', readingId)
      .single();

    if (fetchError || !current) {
      console.error('❌ Error fetching bookmark status:', fetchError);
      return null;
    }

    const newStatus = !current.is_bookmarked;

    const { error } = await supabase
      .from('readings')
      .update({ is_bookmarked: newStatus })
      .eq('id', readingId);

    if (error) {
      console.error('❌ Error toggling bookmark:', error);
      return null;
    }

    console.log(`✅ Bookmark ${newStatus ? 'added' : 'removed'}`);
    return newStatus;
  } catch (error) {
    console.error('❌ Error in toggleBookmark:', error);
    return null;
  }
}

// ============================================
// GET BOOKMARKED READINGS (Favorites)
// ============================================
export async function getBookmarkedReadings(
  userId: string,
  limit: number = 50
): Promise<DailyReading[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_bookmarked', true)
      .order('reading_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching bookmarked readings:', error);
      return [];
    }

    return (data || []) as DailyReading[];
  } catch (error) {
    console.error('❌ Error in getBookmarkedReadings:', error);
    return [];
  }
}

// ============================================
// GET DAILY READING HISTORY (Journal)
// ============================================
export async function getDailyReadingHistory(
  userId: string,
  limit: number = 50
): Promise<DailyReading[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', userId)
      .eq('reading_type', 'daily')
      .order('reading_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching daily history:', error);
      return [];
    }

    return (data || []) as DailyReading[];
  } catch (error) {
    console.error('❌ Error in getDailyReadingHistory:', error);
    return [];
  }
}

// ============================================
// DELETE DAILY READING
// ============================================
export async function deleteDailyReading(readingId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('readings')
      .delete()
      .eq('id', readingId);

    if (error) {
      console.error('❌ Error deleting reading:', error);
      return false;
    }

    console.log('✅ Reading deleted');
    return true;
  } catch (error) {
    console.error('❌ Error in deleteDailyReading:', error);
    return false;
  }
}

// ============================================
// 🆕 GET JOURNAL STATISTICS
// ============================================
export async function getJournalStats(userId: string): Promise<JournalStats | null> {
  if (!supabase) return null;

  try {
    // 1. Get all readings for user
    const { data: readings, error } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', userId)
      .eq('reading_type', 'daily')
      .order('reading_date', { ascending: true });

    if (error) {
      console.error('❌ Error fetching stats:', error);
      return null;
    }

    if (!readings || readings.length === 0) {
      return null;
    }

    // 2. Calculate basic stats
    const totalReadings = readings.length;
    const totalBookmarked = readings.filter(r => r.is_bookmarked).length;
    const bookmarkPercentage = Math.round((totalBookmarked / totalReadings) * 100);

    // 3. Mood distribution
    const moodDist = {
      terrible: 0,
      bad: 0,
      okay: 0,
      good: 0,
      amazing: 0
    };

    readings.forEach(r => {
      if (r.mood && r.mood in moodDist) {
        moodDist[r.mood as Mood]++;
      }
    });

    // Calculate average mood score (1=terrible, 5=amazing)
    const moodScores: Record<Mood, number> = {
      terrible: 1,
      bad: 2,
      okay: 3,
      good: 4,
      amazing: 5
    };

    let totalMoodScore = 0;
    let moodCount = 0;
    readings.forEach(r => {
      if (r.mood) {
        totalMoodScore += moodScores[r.mood as Mood];
        moodCount++;
      }
    });
    const averageMoodScore = moodCount > 0 ? Math.round((totalMoodScore / moodCount) * 10) / 10 : 0;

    // Most common mood
    let mostCommonMood: Mood | null = null;
    let maxMoodCount = 0;
    Object.entries(moodDist).forEach(([mood, count]) => {
      if (count > maxMoodCount) {
        maxMoodCount = count;
        mostCommonMood = mood as Mood;
      }
    });

    // 4. Most drawn cards
    const cardCounts: Record<number, { id: number; name: string; count: number }> = {};
    readings.forEach(r => {
      const card = r.cards[0];
      if (card) {
        if (!cardCounts[card.id]) {
          cardCounts[card.id] = { id: card.id, name: card.name, count: 0 };
        }
        cardCounts[card.id].count++;
      }
    });

    const mostDrawnCards = Object.values(cardCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5. Focus area breakdown
    const focusBreakdown = {
      general: 0,
      love: 0,
      career: 0,
      custom: 0
    };
    readings.forEach(r => {
      if (r.focus_area && r.focus_area in focusBreakdown) {
        focusBreakdown[r.focus_area as FocusArea]++;
      }
    });

    // 6. Notes stats
    const totalNotesWritten = readings.filter(r => r.notes && r.notes.trim().length > 0).length;
    const totalNoteLength = readings.reduce((sum, r) => sum + (r.notes?.length || 0), 0);
    const averageNoteLength = totalNotesWritten > 0 ? Math.round(totalNoteLength / totalNotesWritten) : 0;

    // 7. Date range
    const firstReading = readings[0];
    const latestReading = readings[readings.length - 1];
    const firstDate = firstReading?.reading_date || null;
    const latestDate = latestReading?.reading_date || null;
    
    const daysSinceFirst = firstDate 
      ? Math.floor((Date.now() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // 8. Get streak info (from user_economy)
    let currentStreak = 0;
    let longestStreak = 0;
    
    try {
      const { data: economyData } = await supabase
        .from('user_economy')
        .select('current_streak, longest_streak')
        .eq('user_id', userId)
        .single();
      
      if (economyData) {
        currentStreak = economyData.current_streak || 0;
        longestStreak = economyData.longest_streak || 0;
      }
    } catch (err) {
      console.warn('Could not fetch streak data');
    }

    return {
      total_readings: totalReadings,
      total_bookmarked: totalBookmarked,
      bookmark_percentage: bookmarkPercentage,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      mood_distribution: moodDist,
      average_mood_score: averageMoodScore,
      most_common_mood: mostCommonMood,
      most_drawn_cards: mostDrawnCards,
      focus_breakdown: focusBreakdown,
      total_notes_written: totalNotesWritten,
      average_note_length: averageNoteLength,
      first_reading_date: firstDate,
      latest_reading_date: latestDate,
      days_since_first: daysSinceFirst
    };
  } catch (error) {
    console.error('❌ Error in getJournalStats:', error);
    return null;
  }
}

// ============================================
// UPDATE STREAK ON READING (Edge Function)
// ============================================
export async function updateStreakOnReading(): Promise<{
  success: boolean;
  current_streak?: number;
  longest_streak?: number;
  streak_incremented?: boolean;
  error?: string;
}> {
  if (!supabase) {
    return { success: false, error: 'Supabase not initialized' };
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const response = await fetch(
      'https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/update-streak-on-reading',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      }
    );
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      return { 
        success: false, 
        error: result.error || 'Failed to update streak' 
      };
    }
    
    return { 
      success: true,
      current_streak: result.data.current_streak,
      longest_streak: result.data.longest_streak,
      streak_incremented: result.data.streak_incremented
    };
  } catch (error: any) {
    console.error('❌ Error in updateStreakOnReading:', error);
    return { success: false, error: error.message };
  }
}