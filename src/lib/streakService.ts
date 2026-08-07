import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================
export interface StreakMilestone {
  id: number;
  days_required: number;
  name: string;
  icon_emoji: string;
  reward_coins: number;
  reward_xp: number;
  reward_premium_days: number;
  description: string;
  is_active: boolean;
  sort_order: number;
}

export interface ClaimedMilestone {
  id: string;
  user_id: string;
  milestone_id: number;
  claimed_at: string;
  streak_at_claim: number;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  last_daily_claim: string | null;
  next_milestone: StreakMilestone | null;
  achieved_not_claimed: StreakMilestone[];
  days_to_next: number;
  percent_to_next: number;
}

export interface CalendarDay {
  date: string;
  has_reading: boolean;
  reading_id?: string;
  card_name?: string;
  is_reversed?: boolean;
  is_today: boolean;
  is_future: boolean;
}

export interface ClaimMilestoneResult {
  success: boolean;
  error?: string;
  data?: {
    current_streak: number;
    milestones_claimed: Array<{
      milestone_id: number;
      name: string;
      icon: string;
      coins: number;
      xp: number;
      premium_days: number;
    }>;
    total_coins: number;
    total_xp: number;
    total_premium_days: number;
  };
}

// ============================================
// GET ALL MILESTONES (Config)
// ============================================
export async function getStreakMilestones(): Promise<StreakMilestone[]> {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('streak_milestones')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching milestones:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Error in getStreakMilestones:', error);
    return [];
  }
}

// ============================================
// GET CLAIMED MILESTONES (User Progress)
// ============================================
export async function getClaimedMilestones(userId: string): Promise<ClaimedMilestone[]> {
  if (!supabase || !userId) return [];
  
  try {
    const { data, error } = await supabase
      .from('user_claimed_milestones')
      .select('*')
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching claimed milestones:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Error in getClaimedMilestones:', error);
    return [];
  }
}

// ============================================
// GET STREAK INFO (Current + Next Milestone)
// ============================================
export async function getStreakInfo(userId: string): Promise<StreakInfo | null> {
  if (!supabase || !userId) return null;
  
  try {
    // 1. Get current streak from user_economy
    const { data: economy, error: economyError } = await supabase
      .from('user_economy')
      .select('current_streak, longest_streak, last_active_date, last_daily_claim')
      .eq('user_id', userId)
      .single();
    
    if (economyError || !economy) {
      console.error('❌ Error fetching economy:', economyError);
      return null;
    }
    
    // 2. Get all milestones
    const milestones = await getStreakMilestones();
    
    // 3. Get claimed milestones
    const claimed = await getClaimedMilestones(userId);
    const claimedIds = new Set(claimed.map(c => c.milestone_id));
    
    // 4. Find achieved but not claimed
    const achievedNotClaimed = milestones.filter(
      m => economy.current_streak >= m.days_required && !claimedIds.has(m.id)
    );
    
    // 5. Find next milestone
    const nextMilestone = milestones.find(
      m => economy.current_streak < m.days_required
    ) || null;
    
    // 6. Calculate progress
    const prevMilestoneDays = nextMilestone 
      ? (milestones.find(m => m.sort_order === nextMilestone.sort_order - 1)?.days_required || 0)
      : (milestones[milestones.length - 1]?.days_required || 0);
    
    const daysToNext = nextMilestone 
      ? nextMilestone.days_required - economy.current_streak
      : 0;
    
    const progressRange = nextMilestone 
      ? nextMilestone.days_required - prevMilestoneDays
      : 1;
    
    const currentProgress = economy.current_streak - prevMilestoneDays;
    const percentToNext = progressRange > 0 
      ? Math.min((currentProgress / progressRange) * 100, 100) 
      : 100;
    
    return {
      current_streak: economy.current_streak || 0,
      longest_streak: economy.longest_streak || 0,
      last_active_date: economy.last_active_date,
      last_daily_claim: economy.last_daily_claim,
      next_milestone: nextMilestone,
      achieved_not_claimed: achievedNotClaimed,
      days_to_next: daysToNext,
      percent_to_next: percentToNext
    };
  } catch (error) {
    console.error('❌ Error in getStreakInfo:', error);
    return null;
  }
}

// ============================================
// CLAIM STREAK MILESTONE (Edge Function)
// ============================================
export async function claimStreakMilestone(): Promise<ClaimMilestoneResult> {
  if (!supabase) {
    return { success: false, error: 'Supabase not initialized' };
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const response = await fetch(
      'https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/claim-streak-milestone',
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
        error: result.error || 'Failed to claim milestone' 
      };
    }
    
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('❌ Error in claimStreakMilestone:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// GET STREAK CALENDAR (ბოლო N დღე)
// ============================================
export async function getStreakCalendar(
  userId: string, 
  days: number = 30
): Promise<CalendarDay[]> {
  if (!supabase || !userId) return [];
  
  try {
    // Calculate date range
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - (days - 1));
    const startDateStr = startDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    // Get all readings in range
    const { data: readings, error } = await supabase
      .from('readings')
      .select('id, reading_date, cards')
      .eq('user_id', userId)
      .eq('reading_type', 'daily')
      .gte('reading_date', startDateStr)
      .lte('reading_date', todayStr)
      .order('reading_date', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching calendar readings:', error);
      return [];
    }
    
    // Create map for quick lookup
    const readingsByDate = new Map<string, any>();
    (readings || []).forEach(r => {
      readingsByDate.set(r.reading_date, r);
    });
    
    // Build calendar
    const calendar: CalendarDay[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(today.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      const reading = readingsByDate.get(dateStr);
      const isToday = dateStr === todayStr;
      const isFuture = date > today;
      
      calendar.push({
        date: dateStr,
        has_reading: !!reading,
        reading_id: reading?.id,
        card_name: reading?.cards?.[0]?.name,
        is_reversed: reading?.cards?.[0]?.is_reversed,
        is_today: isToday,
        is_future: isFuture
      });
    }
    
    return calendar;
  } catch (error) {
    console.error('❌ Error in getStreakCalendar:', error);
    return [];
  }
}

// ============================================
// GET CURRENT MILESTONE TIER
// ============================================
export function getCurrentMilestoneTier(
  streak: number, 
  milestones: StreakMilestone[]
): StreakMilestone | null {
  const achieved = milestones
    .filter(m => streak >= m.days_required)
    .sort((a, b) => b.days_required - a.days_required);
  
  return achieved[0] || null;
}