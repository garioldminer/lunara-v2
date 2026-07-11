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

// 🆕 დავამატეთ sunSign parameter
export function useHoroscope(
  userId: string, 
  sunSign: string,  // 🆕 ახალი parameter
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

    // 🆕 ვიყენებთ sunSign-ს რომელიც უკვე გვაქვს UserContext-დან
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

      const today = new Date().toISOString().split('T')[0];

      console.log(`🔍 Fetching horoscope for ${sunSign} on ${today}`);

      // 🆕 ვიყენებთ sunSign-ს პირდაპირ (არა profile-დან)
      const { data, error: fetchError } = await supabase
        .from('daily_horoscopes')
        .select('*')
        .eq('zodiac_sign', sunSign)  // 🆕 sunSign parameter-დან
        .eq('date', today)
        .single();

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw new Error('Horoscope not found for today. Please try again later.');
      }

      if (!data) {
        throw new Error('No horoscope data available');
      }

      console.log(`✅ Horoscope loaded for ${sunSign}`);

      // 🆕 დავამატოთ reading_type data-ში
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