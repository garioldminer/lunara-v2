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
 * ─ weekly   → weekly_summaries (მიმდინარე კვირის ორშაბათი)
 * ─ monthly  → monthly_summaries (მიმდინარე თვის 1-ლი)
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

  let query;
  let targetDate = '';
  let table = 'daily_horoscopes';

  switch (readingType) {
    case 'tomorrow': {
      table = 'daily_horoscopes';
      targetDate = getTomorrowString();
      query = supabase
        .from(table)
        .select('*')
        .ilike('zodiac_sign', capitalizedSign)
        .eq('date', targetDate)
        .maybeSingle();
      console.log(`🔍 [Query] Tomorrow for ${capitalizedSign} (${targetDate})`);
      break;
    }
    case 'weekly': {
      table = 'weekly_summaries';
      targetDate = getWeekStart();
      console.log(`🔍 [Query] Weekly for ${capitalizedSign}`);
      console.log(`   📅 Looking for week_start: ${targetDate}`);
      console.log(`   📊 Table: ${table}`);
      
      // ✅ Debug: შევამოწმოთ რა არის table-ში
      try {
        const { data: allWeekly, error: checkError } = await supabase
          .from(table)
          .select('week_start, zodiac_sign')
          .limit(5);
        
        if (checkError) {
          console.error(`   ❌ Cannot read ${table}:`, checkError);
        } else {
          console.log(`   📋 Sample data in ${table}:`, allWeekly);
          if (allWeekly && allWeekly.length > 0) {
            const availableWeeks = [...new Set(allWeekly.map((r: any) => r.week_start))];
            console.log(`   ✅ Available weeks:`, availableWeeks);
            if (!availableWeeks.includes(targetDate)) {
              console.warn(`   ⚠️ Requested week "${targetDate}" NOT FOUND in table!`);
              console.warn(`   💡 Most recent week in table:`, availableWeeks[0]);
            }
          } else {
            console.warn(`   ⚠️ Table ${table} is EMPTY!`);
          }
        }
      } catch (debugErr) {
        console.error(`   ❌ Debug query failed:`, debugErr);
      }
      
      query = supabase
        .from(table)
        .select('*')
        .ilike('zodiac_sign', capitalizedSign)
        .eq('week_start', targetDate)
        .maybeSingle();
      break;
    }
    case 'monthly': {
      table = 'monthly_summaries';
      targetDate = getMonthStart();
      console.log(`🔍 [Query] Monthly for ${capitalizedSign}`);
      console.log(`   📅 Looking for month_start: ${targetDate}`);
      console.log(`   📊 Table: ${table}`);
      
      // ✅ Debug: შევამოწმოთ რა არის table-ში
      try {
        const { data: allMonthly, error: checkError } = await supabase
          .from(table)
          .select('month_start, zodiac_sign')
          .limit(5);
        
        if (checkError) {
          console.error(`   ❌ Cannot read ${table}:`, checkError);
        } else {
          console.log(`   📋 Sample data in ${table}:`, allMonthly);
          if (allMonthly && allMonthly.length > 0) {
            const availableMonths = [...new Set(allMonthly.map((r: any) => r.month_start))];
            console.log(`   ✅ Available months:`, availableMonths);
            if (!availableMonths.includes(targetDate)) {
              console.warn(`   ⚠️ Requested month "${targetDate}" NOT FOUND in table!`);
              console.warn(`   💡 Most recent month in table:`, availableMonths[0]);
            }
          } else {
            console.warn(`   ⚠️ Table ${table} is EMPTY!`);
          }
        }
      } catch (debugErr) {
        console.error(`   ❌ Debug query failed:`, debugErr);
      }
      
      query = supabase
        .from(table)
        .select('*')
        .ilike('zodiac_sign', capitalizedSign)
        .eq('month_start', targetDate)
        .maybeSingle();
      break;
    }
    case 'today':
    default: {
      table = 'daily_horoscopes';
      const today = getTodayString();
      const weekAgo = getDateString(6);
      query = supabase
        .from(table)
        .select('*')
        .ilike('zodiac_sign', capitalizedSign)
        .gte('date', weekAgo)
        .lte('date', today)
        .order('date', { ascending: false })
        .limit(1);
      console.log(`🔍 [Query] Today for ${capitalizedSign} (${weekAgo} → ${today})`);
      break;
    }
  }

  const { data, error } = await query;

  if (error) {
    console.warn(`⚠️ [Query] ${readingType} error: ${error.message}`);
    return null;
  }

  // ✅ Unpack: handle both single object (maybeSingle) and array (limit(1))
  const row: any = Array.isArray(data) ? data[0] : data;

  if (!row) {
    console.warn(`⚠️ [Query] No ${readingType} data for ${capitalizedSign} → triggering generation`);
    
    // Self-heal: რომელი ტიპის გენერაცია ჩავრთოთ
    if (readingType === 'tomorrow') {
      triggerBackgroundGeneration('daily');
    } else if (readingType === 'weekly') {
      triggerBackgroundGeneration('weekly');
    } else if (readingType === 'monthly') {
      triggerBackgroundGeneration('monthly');
    } else {
      triggerBackgroundGeneration('daily');
    }
    return null;
  }

  // age გამოთვლა (დღეებში)
  let age = 0;
  if (readingType === 'today' && row.date) {
    age = Math.floor(
      (new Date(getTodayString() + 'T00:00:00').getTime() - new Date(row.date + 'T00:00:00').getTime())
      / (1000 * 60 * 60 * 24)
    );
  } else if (readingType === 'tomorrow') {
    age = -1; // ხვალინდელი
  }
  // weekly/monthly age არ გვჭირდება

  console.log(`✅ [Query] Found ${readingType} for ${capitalizedSign} (${row.date || row.week_start || row.month_start})`);

  return {
    ...row,
    reading_type: readingType,
    _dataAge: age
  } as Horoscope & { _dataAge: number };
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