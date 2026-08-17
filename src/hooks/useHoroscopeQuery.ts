import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Horoscope } from './useHoroscope';
import { TabType } from '../components/horoscope/horoscopeData';
import type { UseHoroscopeResult } from './useHoroscope';

/**
 * 🌙 useHoroscopeQuery — React Query ვერსია
 *
 * უპირატესობები ძველ useHoroscope-ზე:
 * ─ Memory cache: სესიაში ტაბზე დაბრუნება = 0ms (არ რეფეტჩავს)
 * ─ ლაივ მონაცემები: ყოველ მონტაჟზე fresh შემოწმება (staleTime: 0)
 * ─ ავტომატური რეფეტჩი: დღის ცვლილება → ახალი fetch
 * ─ 100% compatible: იგივე return interface
 */

// Helper: დღევანდელი თარიღი YYYY-MM-DD ფორმატში
const getTodayString = (): string => new Date().toISOString().split('T')[0];

// Helper: გუშინდელი თარიღი
const getYesterdayString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

// Fetch ფუნქცია — იგივე ლოგიკა რაც ძველ hook-ში
async function fetchHoroscope(
  userId: string,
  sunSign: string,
  readingType: string
): Promise<Horoscope | null> {
  if (!userId || !sunSign || !supabase) {
    throw new Error('Missing userId, sunSign or supabase');
  }

  const capitalizedSign = sunSign.charAt(0).toUpperCase() + sunSign.slice(1).toLowerCase();
  const today = getTodayString();

  console.log(`🔍 [Query] Fetching horoscope for ${capitalizedSign} on ${today}`);

  // 1. ვცდილობთ დღევანდელს
  let { data, error: fetchError } = await supabase
    .from('daily_horoscopes')
    .select('*')
    .ilike('zodiac_sign', capitalizedSign)
    .eq('date', today)
    .maybeSingle();

  console.log(`📊 [Query] Today's result:`, { data: !!data, error: fetchError?.message });

  // 2. Fallback: გუშინდელი
  if (!data) {
    console.warn(`⚠️ [Query] No horoscope for ${today}, trying yesterday...`);
    const yesterday = getYesterdayString();

    const { data: yesterdayData, error: yesterdayError } = await supabase
      .from('daily_horoscopes')
      .select('*')
      .ilike('zodiac_sign', capitalizedSign)
      .eq('date', yesterday)
      .maybeSingle();

    console.log(`📊 [Query] Yesterday's result:`, {
      data: !!yesterdayData,
      error: yesterdayError?.message
    });

    if (yesterdayError || !yesterdayData) {
      throw new Error(`Horoscope not found for ${capitalizedSign} on ${today} or ${yesterday}`);
    }

    data = yesterdayData;
    console.log(`✅ [Query] Using yesterday's horoscope (${yesterday})`);
  }

  if (!data) {
    throw new Error('No horoscope data available');
  }

  console.log(`✅ [Query] Horoscope loaded for ${capitalizedSign}`);

  return {
    ...data,
    reading_type: readingType
  } as Horoscope;
}

/**
 * 🎯 მთავარი hook — 100% compatible ძველ useHoroscope-თან
 */
export function useHoroscopeQuery(
  userId: string,
  sunSign: string,
  readingType: TabType = 'today'
): UseHoroscopeResult {
  const queryClient = useQueryClient();

  const {
    data: horoscope = null,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery({
    // Query key: ყველა პარამეტრი + დღევანდელი თარიღი
    // დღის ცვლილებაზე ავტომატურად ახალი fetch
    queryKey: ['horoscope', userId, sunSign, readingType, getTodayString()],

    queryFn: () => fetchHoroscope(userId, sunSign, readingType),

    // ✅ ლაივ მონაცემები — არ არის stale time
    staleTime: 0,

    // ✅ Cache 10 წუთი (სესიაში ტაბზე დაბრუნება = 0ms)
    gcTime: 10 * 60 * 1000,

    // ✅ ეკრანზე დაბრუნებისას fresh მონაცემები (ფონში)
    refetchOnMount: 'always',

    // ❌ app-switch-ზე არ ჭედოს (cache გვაქვს)
    refetchOnWindowFocus: false,

    // ✅ შეცდომისას 2-ჯერ სცადოს
    retry: 2,

    // ✅ ჩართული მხოლოდ როცა ყველა პარამეტრი მზადაა
    enabled: Boolean(userId && sunSign && supabase),
  });

  // 🔄 refetch wrapper — აბრუნებს Promise-ს (ძველის მსგავსად void-ად ვაქცევთ)
  const handleRefetch = () => {
    refetch();
  };

  return {
    horoscope,
    loading: isLoading,
    refreshing: isFetching && !isLoading, // მხოლოდ ფონური refetch
    error: error?.message || null,
    refetch: handleRefetch
  };
}

/**
 * 🛠️ Manual invalidation (თუ საჭიროა)
 * გამოყენება: useHoroscopeQuery.invalidate(userId, sunSign)
 */
useHoroscopeQuery.invalidate = (userId: string, sunSign: string) => {
  import('@tanstack/react-query').then(({ QueryClient }) => {
    // ეს არის static helper — საჭიროების შემთხვევაში
    console.warn('[Query] Manual invalidation — use queryClient.invalidateQueries instead');
  });
};