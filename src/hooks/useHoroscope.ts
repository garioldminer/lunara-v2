import { useState, useEffect, useRef } from 'react';

export interface Horoscope {
  id: string;
  user_id: string;
  reading_type: string;
  date: string;
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
  // ✅ Energy Levels
  cosmic_energy_level?: string;
  love_energy_level?: string;
  career_energy_level?: string;
  // ✅ ახალი ველები (AI-დან)
  lucky_crystal?: string;
  lucky_planet?: string;
  hero_description?: string;
}

export interface UseHoroscopeResult {
  horoscope: Horoscope | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHoroscope(userId: string, readingType: string = 'daily', date?: string): UseHoroscopeResult {
  const [horoscope, setHoroscope] = useState<Horoscope | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Prevent double invocation in StrictMode
  const hasFetched = useRef(false);
  const currentKey = useRef('');

  const fetchHoroscope = async (forceRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // ✅ Prevent duplicate fetches for same parameters
    const key = `${userId}-${readingType}-${date}`;
    if (!forceRefresh && hasFetched.current && currentKey.current === key) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const targetDate = date || new Date().toISOString().split('T')[0];
      
      console.log('🔮 Fetching horoscope:', { userId, readingType, date: targetDate });

      const response = await fetch(
        'https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/generate-horoscope',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            user_id: userId,
            reading_type: readingType,
            date: targetDate
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Cosmic connection failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✨ Horoscope received:', result.data);
        setHoroscope(result.data);
        hasFetched.current = true;
        currentKey.current = key;
      } else {
        throw new Error(result.error || 'The stars are silent');
      }
    } catch (err: any) {
      console.error('🌑 Cosmic error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoroscope();
  }, [userId, readingType, date]);

  const refetch = () => {
    hasFetched.current = false;
    fetchHoroscope(true);
  };

  return {
    horoscope,
    loading,
    error,
    refetch
  };
}