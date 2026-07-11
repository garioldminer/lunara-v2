import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface Horoscope {
  id: string;
  zodiac_sign: string;
  date: string;
  reading_type?: string;
  general_prediction: string;
  love_prediction: string;
  career_prediction: string;
  health_prediction: string;
  finance_prediction: string;
  moon_phase: string;
  moon_sign: string;
  key_transits: any[];
  lucky_color: string;
  lucky_number: number;
  lucky_time: string | null;
  affirmation: string;
  ritual_suggestion: string | null;
  ai_model_used: string;
  tokens_used: number;
  generation_time_ms: number;
  created_at: string;
  cosmic_energy_level?: string;
  love_energy_level?: string;
  career_energy_level?: string;
  lucky_crystal?: string;
  lucky_planet?: string;
  hero_description?: string;
}

export interface UseHoroscopeResult {
  horoscope: Horoscope | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHoroscope(
  userId: string, 
  sunSign: string,
  readingType: string = 'today'
): UseHoroscopeResult {
  const [horoscope, setHoroscope] = useState<Horoscope | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const hasFetched = useRef(false);

  const fetchHoroscope = async (isBackgroundRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (!sunSign) {
      setError('User sun_sign not provided');
      setLoading(false);
      return;
    }

    if (!supabase) {
      setError('Supabase client not initialized');
      setLoading(false);
      return;
    }

    try {
      if (isBackgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // 🆕 Capitalize sunSign (Virgo, Aries, etc.)
      const capitalizedSign = sunSign.charAt(0).toUpperCase() + sunSign.slice(1).toLowerCase();
      
      const today = new Date().toISOString().split('T')[0];

      console.log(`🔍 Fetching horoscope for ${capitalizedSign} on ${today}`);

      // 🆕 ვცდილობთ დღევანდელ horoscope-ს (ilike - case-insensitive)
      let { data, error: fetchError } = await supabase
        .from('daily_horoscopes')
        .select('*')
        .ilike('zodiac_sign', capitalizedSign)  // 🆕 ilike instead of eq
        .eq('date', today)
        .maybeSingle();  // 🆕 maybeSingle instead of single

      console.log(`📊 Today's query result:`, { data, error: fetchError });

      // 🆕 Fallback: თუ დღევანდელი არ არის, ვცდილობთ გუშინდელს
      if (!data) {
        console.warn(`⚠️ No horoscope for ${today}, trying yesterday...`);
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const { data: yesterdayData, error: yesterdayError } = await supabase
          .from('daily_horoscopes')
          .select('*')
          .ilike('zodiac_sign', capitalizedSign)  // 🆕 ilike
          .eq('date', yesterdayStr)
          .maybeSingle();  // 🆕 maybeSingle
        
        console.log(`📊 Yesterday's query result:`, { data: yesterdayData, error: yesterdayError });
        
        if (yesterdayError || !yesterdayData) {
          throw new Error(`Horoscope not found for ${capitalizedSign} on ${today} or ${yesterdayStr}`);
        }
        
        data = yesterdayData;
        console.log(`✅ Using yesterday's horoscope (${yesterdayStr})`);
      }

      if (!data) {
        throw new Error('No horoscope data available');
      }

      console.log(`✅ Horoscope loaded for ${capitalizedSign}`);

      const horoscopeData = {
        ...data,
        reading_type: readingType
      };

      setHoroscope(horoscopeData);
      hasFetched.current = true;

    } catch (err: any) {
      console.error('🌑 Error fetching horoscope:', err);
      setError(err.message || 'Failed to load horoscope');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!userId || !sunSign) return;
    fetchHoroscope();
  }, [userId, sunSign, readingType]);

  const refetch = () => {
    fetchHoroscope();
  };

  return {
    horoscope,
    loading,
    refreshing,
    error,
    refetch
  };
}