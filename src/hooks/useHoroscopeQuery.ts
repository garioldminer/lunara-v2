import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Horoscope } from './useHoroscope';
import { TabType } from '../components/horoscope/horoscopeData';
import type { UseHoroscopeResult } from './useHoroscope';

/**
 * 🌙 useHoroscopeQuery — ოპტიმიზებული ვერსია
 *
 * რა გაუმჯობესდა:
 * ─ 1 query (7 sequential-ის ნაცვლად) → ~200ms, ეგრევე იხსნება
 * ─ 2-წუთიანი cache → ტაბებზე გადასვლა = 0ms
 * ─ ფონური განახლება → ლაივ მონაცემები
 * ─ 7-დღიანი fallback → გვერდი ყოველთვის იხსნება
 * ─ არასდროს აგდებს error-ს
 */

const getTodayString = (): string => new Date().toISOString().split('T')[0];

const getDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// ✅ Throttle: ფონური generation მაქს. ერთხელ 5 წუთში
let lastTriggerTime = 0;

async function triggerBackgroundGeneration() {
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

    console.log('⚡ [Self-Heal] Triggering background horoscope generation...');

    // fire-and-forget: არ ველოდებით პასუხს
    fetch(`${supabaseUrl}/functions/v1/generate-all-horoscopes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.warn('⚠️ [Self-Heal] Background generation failed (non-critical):', err.message);
    });
  } catch (e) {
    console.warn('⚠️ [Self-Heal] Background generation error:', e);
  }
}

// ✅ 1 query: ბოლო 7 დღიდან უახლესი (7 sequential-ის ნაცვლად)
async function fetchHoroscope(
  userId: string,
  sunSign: string,
  readingType: string
): Promise<Horoscope | null> {
  if (!userId || !sunSign || !supabase) {
    return null;
  }

  const capitalizedSign = sunSign.charAt(0).toUpperCase() + sunSign.slice(1).toLowerCase();
  const today = getTodayString();
  const weekAgo = getDateString(6);

  console.log(`🔍 [Query] Fetching ${capitalizedSign} (range: ${weekAgo} → ${today})`);

  // ✅ ერთი query — ბაზა ალაგებს, არა ფრონტენდი
  const { data, error } = await supabase
    .from('daily_horoscopes')
    .select('*')
    .ilike('zodiac_sign', capitalizedSign)
    .gte('date', weekAgo)
    .lte('date', today)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn(`⚠️ [Query] error: ${error.message}`);
    return null;
  }

  if (!data) {
    console.warn(`⚠️ [Query] No horoscope in last 7 days for ${capitalizedSign} → triggering generation`);
    triggerBackgroundGeneration();
    return null;
  }

  // გამოვთვალოთ age (რამდენი დღის წინანდელია)
  const age = Math.floor(
    (new Date(today + 'T00:00:00').getTime() - new Date(data.date + 'T00:00:00').getTime())
    / (1000 * 60 * 60 * 24)
  );
  
  console.log(`✅ [Query] Found: ${data.date} (age ${age}d)`);

  return {
    ...data,
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

    // ✅ 2 წუთი cache — ტაბებზე ეგრევე ჩანს, ფონში ახლდება
    staleTime: 2 * 60 * 1000,
    
    // ✅ 10 წუთი გარანტირებული memory-ში (გასვლის მერე)
    gcTime: 10 * 60 * 1000,

    // ✅ mount-ზე მხოლოდ თუ stale-ა (>2 წთ) — არა ყოველ ჯერზე
    refetchOnMount: true,

    // ❌ app-switch-ზე არ ჭედოს (cache გვაქვს)
    refetchOnWindowFocus: false,

    // ✅ 1 retry (self-healing-ია, არ გვჭირდება ბევრი)
    retry: 1,

    // ✅ ჩართული მხოლოდ როცა ყველა პარამეტრი მზადაა
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