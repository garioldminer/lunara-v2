import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Horoscope } from './useHoroscope';
import { TabType } from '../components/horoscope/horoscopeData';
import type { UseHoroscopeResult } from './useHoroscope';

/**
 * 🌙 useHoroscopeQuery — React Query ვერსია (Self-Healing)
 *
 * ლოგიკა:
 * ─ ცდის ბოლო 7 დღეს (დღეს → გუშინ → ...)
 * ─ არცერთი არ არის? → ფონურად იძახებს generation-ს + აბრუნებს null (არა error)
 * ─ არასდროს აგდებს error-ს — გვერდი ყოველთვის იხსნება
 */

const getTodayString = (): string => new Date().toISOString().split('T')[0];

const getDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// ✅ Throttle: ფონური generation გამოიძახება მაქს. ერთხელ 5 წუთში (spam-ის თავიდან ასაცილებლად)
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

async function fetchHoroscope(
  userId: string,
  sunSign: string,
  readingType: string
): Promise<Horoscope | null> {
  if (!userId || !sunSign || !supabase) {
    return null; // ❌ აღარ ვაგდებთ error-ს
  }

  const capitalizedSign = sunSign.charAt(0).toUpperCase() + sunSign.slice(1).toLowerCase();

  console.log(`🔍 [Query] Fetching horoscope for ${capitalizedSign}`);

  // ✅ ცადე ბოლო 7 დღე (თანმიმდევრობით: დღეს → გუშინ → ...)
  for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
    const targetDate = getDateString(daysAgo);

    const { data, error } = await supabase
      .from('daily_horoscopes')
      .select('*')
      .ilike('zodiac_sign', capitalizedSign)
      .eq('date', targetDate)
      .maybeSingle();

    if (data && !error) {
      const age = daysAgo === 0 ? 'today' : `${daysAgo}d old`;
      console.log(`✅ [Query] Found: ${age} (${targetDate})`);

      return {
        ...data,
        reading_type: readingType,
        _dataAge: daysAgo // UI-სთვის: 0=დღევანდელი, 1=გუშინდელი, ...
      } as Horoscope & { _dataAge: number };
    }
  }

  // ⚡ საერთოდ არ არის 7 დღეში — გამოიძახე function ფონურად
  console.warn(`⚠️ [Query] No horoscope in last 7 days for ${capitalizedSign} → triggering generation`);
  triggerBackgroundGeneration();

  return null; // ❌ error-ის ნაცვლად — null (გვერდი მაინც იხსნება)
}

/**
 * 🎯 მთავარი hook — 100% compatible ძველ useHoroscope-თან
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
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
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