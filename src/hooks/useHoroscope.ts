import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface Horoscope {
  id: string;
  zodiac_sign: string;
  date: string;
  reading_type?: string;  // 🆕 დამატებულია (optional)
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

export function useHoroscope(userId: string, readingType: string = 'today'): UseHoroscopeResult {
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

    // 🆕 Null check
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

      // Get user's sun_sign
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('sun_sign')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.sun_sign) {
        throw new Error('User sun_sign not found');
      }

      const today = new Date().toISOString().split('T')[0];

      // 🆕 Fetch from daily_horoscopes (pre-generated)
      const { data, error: fetchError } = await supabase
        .from('daily_horoscopes')
        .select('*')
        .eq('zodiac_sign', profile.sun_sign)
        .eq('date', today)
        .single();

      if (fetchError) {
        throw new Error('Horoscope not found for today. Please try again later.');
      }

      // 🆕 Add reading_type to data
      const horoscopeData = {
        ...data,
        reading_type: readingType
      };

      setHoroscope(horoscopeData);
      hasFetched.current = true;

      console.log(`✅ Horoscope loaded for ${profile.sun_sign} (${today})`);

    } catch (err: any) {
      console.error('🌑 Error fetching horoscope:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchHoroscope();
  }, [userId, readingType]);

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