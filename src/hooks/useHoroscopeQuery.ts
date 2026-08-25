import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Horoscope } from './useHoroscope';
import { TabType } from '../components/horoscope/horoscopeData';
import type { UseHoroscopeResult } from './useHoroscope';

/**
 * 🌙 useHoroscopeQuery — ტაბის მიხედვით სხვადასხვა ცხრილი
 *
 * ტაბი → ცხრილი:
 * ─ today    → daily_horoscopes (დღეს)
 * ─ tomorrow → daily_horoscopes (ხვალ)
 * ─ weekly   → weekly_summaries (მიმდინარე კვირის ორშაბათი, fallback: ბოლო ხელმისაწვდომი)
 * ─ monthly  → monthly_summaries (მიმდინარე თვის 1-ლი, fallback: ბოლო ხელმისაწვდომი)
 */

const getTodayString = (): string => new Date().toISOString().split('T')[0];

const getTomorrowString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const getDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// კვირის ორშაბათი
const getWeekStart = (): string => {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
};

// თვის 1 რიცხვი
const getMonthStart = (): string => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
};

// ✅ Throttle: ფონური generation მაქს. ერთხელ 5 წუთში
let lastTriggerTime = 0;

async function triggerBackgroundGeneration(type: 'daily' | 'weekly' | 'monthly' = 'daily') {
  const now = Date.now();
  if (now - lastTriggerTime < 5 * 60 * 1000) {
    console.log('⏳ [Self-Heal] Already triggered recently, skipping');
    return;
  }
  lastTriggerTime = now;

  try {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
      || 'https://eutavdhcxpfhpfsyaskb.supabase.co';
    const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

    if (!supabaseAnonKey) {
      console.warn('⚠️ [Self-Heal] No anon key for background generation');
      return;
    }

    const endpoint = type === 'daily'
      ? 'generate-all-horoscopes'
      : `generate-summaries?type=${type}`;

    console.log(`⚡ [Self-Heal] Triggering ${type} generation...`);

    fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.warn(`⚠️ [Self-Heal] ${type} generation failed:`, err.message);
    });
  } catch (e) {
    console.warn('⚠️ [Self-Heal] Background generation error:', e);
  }
}

// ✅ ფუნქცია ტაბის მიხედვით query-სთვის
async function fetchHoroscope(
  userId: string,
  sunSign: string,
  readingType: TabType
): Promise<Horoscope | null> {
  if (!userId || !sunSign || !supabase) {
    return null;
  }

  const capitalizedSign = sunSign.charAt(0).toUpperCase() + sunSign.slice(1).toLowerCase();

  switch (readingType) {
    case 'tomorrow': {
      const targetDate = getTomorrowString();
      const query = supabase
        .from('daily_horoscopes')
        .select('*')
        .ilike('zodiac_sign', capitalizedSign)
        .eq('date', targetDate)
        .maybeSingle();
      
      console.log(`🔍 [Query] Tomorrow for ${capitalizedSign} (${targetDate})`);
      const { data, error } = await query;
      
      if (error) {
        console.warn(`⚠️ [Query] tomorrow error: ${error.message}`);
        return null;
      }
      
      const row: any = Array.isArray(data) ? data[0] : data;
      if (!row) {
        console.warn(`⚠️ [Query] No tomorrow data for ${capitalizedSign} → triggering generation`);
        triggerBackgroundGeneration('daily');
        return null;
      }
      
      console.log(`✅ [Query] Found tomorrow for ${capitalizedSign} (${row.date})`);
      return { ...row, reading_type: readingType, _dataAge: -1 } as Horoscope & { _dataAge: number };
    }

    case 'weekly': {
      const targetDate = getWeekStart();
      console.log(`🔍 [Query] Weekly for ${capitalizedSign}`);
      console.log(`   📅 Looking for week_start: ${targetDate}`);
      
      // ✅ Primary query: მიმდინარე კვირა
      let { data: weeklyData } = await supabase
        .from('weekly_summaries')
        .select('*')
        .ilike('zodiac_sign', capitalizedSign)
        .eq('week_start', targetDate)
        .maybeSingle();
      
      // ✅ Fallback: თუ მიმდინარე კვირა არ არის, ეძებე ბოლო ხელმისაწვდომი
      if (!weeklyData) {
        console.warn(`   ⚠️ No data for week ${targetDate}, trying fallback...`);
        
        const { data: fallbackData } = await supabase
          .from('weekly_summaries')
          .select('*')
          .ilike('zodiac_sign', capitalizedSign)
          .order('week_start', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (fallbackData) {
          console.log(`   ✅ Using fallback week: ${fallbackData.week_start}`);
          weeklyData = fallbackData;
        } else {
          console.warn(`   ❌ No weekly data at all for ${capitalizedSign}`);
        }
      }
      
      if (!weeklyData) {
        console.warn(`⚠️ [Query] No weekly data for ${capitalizedSign} → triggering generation`);
        triggerBackgroundGeneration('weekly');
        return null;
      }
      
      console.log(`✅ [Query] Found weekly for ${capitalizedSign} (week ${weeklyData.week_start})`);
      return { ...weeklyData, reading_type: readingType, _dataAge: 0 } as Horoscope & { _dataAge: number };
    }

    case 'monthly': {
      const targetDate = getMonthStart();
      console.log(`🔍 [Query] Monthly for ${capitalizedSign}`);
      console.log(`   📅 Looking for month_start: ${targetDate}`);
      
      // ✅ Primary query: მიმდინარე თვე
      let { data: monthlyData } = await supabase
        .from('monthly_summaries')
        .select('*')
        .ilike('zodiac_sign', capitalizedSign)
        .eq('month_start', targetDate)
        .maybeSingle();
      
      // ✅ Fallback: თუ მიმდინარე თვე არ არის, ეძებე ბოლო ხელმისაწვდომი
      if (!monthlyData) {
        console.warn(`   ⚠️ No data for month ${targetDate}, trying fallback...`);
        
        const { data: fallbackData } = await supabase
          .from('monthly_summaries')
          .select('*')
          .ilike('zodiac_sign', capitalizedSign)
          .order('month_start', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (fallbackData) {
          console.log(`   ✅ Using fallback month: ${fallbackData.month_start}`);
          monthlyData = fallbackData;
        } else {
          console.warn(`   ❌ No monthly data at all for ${capitalizedSign}`);
        }
      }
      
      if (!monthlyData) {
        console.warn(`⚠️ [Query] No monthly data for ${capitalizedSign} → triggering generation`);
        triggerBackgroundGeneration('monthly');
        return null;
      }
      
      console.log(`✅ [Query] Found monthly for ${capitalizedSign} (month ${monthlyData.month_start})`);
      return { ...monthlyData, reading_type: readingType, _dataAge: 0 } as Horoscope & { _dataAge: number };
    }

    case 'today':
    default: {
      const today = getTodayString();
      const weekAgo = getDateString(6);
      const query = supabase
        .from('daily_horoscopes')
        .select('*')
        .ilike('zodiac_sign', capitalizedSign)
        .gte('date', weekAgo)
        .lte('date', today)
        .order('date', { ascending: false })
        .limit(1);
      
      console.log(`🔍 [Query] Today for ${capitalizedSign} (${weekAgo} → ${today})`);
      const { data, error } = await query;
      
      if (error) {
        console.warn(`⚠️ [Query] today error: ${error.message}`);
        return null;
      }
      
      const row: any = Array.isArray(data) ? data[0] : data;
      if (!row) {
        console.warn(`⚠️ [Query] No today data for ${capitalizedSign} → triggering generation`);
        triggerBackgroundGeneration('daily');
        return null;
      }
      
      const age = Math.floor(
        (new Date(getTodayString() + 'T00:00:00').getTime() - new Date(row.date + 'T00:00:00').getTime())
        / (1000 * 60 * 60 * 24)
      );
      
      console.log(`✅ [Query] Found today for ${capitalizedSign} (${row.date}, age ${age}d)`);
      return { ...row, reading_type: readingType, _dataAge: age } as Horoscope & { _dataAge: number };
    }
  }
}

/**
 * 🎯 მთავარი hook
 */
export function useHoroscopeQuery(
  userId: string,
  sunSign: string,
  readingType: TabType = 'today'
): UseHoroscopeResult {
  const {
    data: horoscope = null,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery({
    queryKey: ['horoscope', userId, sunSign, readingType, getTodayString()],
    queryFn: () => fetchHoroscope(userId, sunSign, readingType),

    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: Boolean(userId && sunSign && supabase),
  });

  return {
    horoscope,
    loading: isLoading,
    refreshing: isFetching && !isLoading,
    error: error?.message || null,
    refetch: () => refetch()
  };
}