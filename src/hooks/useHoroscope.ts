import { useState, useEffect } from 'react';

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
}

export interface UseHoroscopeResult {
  horoscope: Horoscope | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHoroscope(userId: string, date?: string): UseHoroscopeResult {
  const [horoscope, setHoroscope] = useState<Horoscope | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHoroscope = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const targetDate = date || new Date().toISOString().split('T')[0];
      
      console.log(' Fetching cosmic guidance for:', { userId, date: targetDate });

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
            reading_type: 'daily',
            date: targetDate
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Cosmic connection failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✨ Cosmic guidance received:', result.data);
        setHoroscope(result.data);
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
  }, [userId, date]);

  return {
    horoscope,
    loading,
    error,
    refetch: fetchHoroscope
  };
}