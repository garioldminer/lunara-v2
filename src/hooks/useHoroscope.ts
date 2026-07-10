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
  // Energy Levels
  cosmic_energy_level?: string;
  love_energy_level?: string;
  career_energy_level?: string;
  // ახალი ველები (AI-დან)
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

// Cache duration: 1 საათი (3600000 ms)
const CACHE_DURATION = 3600000;

export function useHoroscope(userId: string, readingType: string = 'daily', date?: string): UseHoroscopeResult {
  const [horoscope, setHoroscope] = useState<Horoscope | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const hasFetched = useRef(false);
  const currentKey = useRef('');
  const previousDataRef = useRef<Horoscope | null>(null);

  const fetchHoroscope = async (forceRefresh = false, isBackgroundRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const key = `${userId}-${readingType}-${date}`;
    if (!forceRefresh && !isBackgroundRefresh && hasFetched.current && currentKey.current === key) {
      return;
    }

    try {
      // 🆕 FIX: Background refresh-ის დროს არ ჩართოს refreshing state
      if (isBackgroundRefresh) {
        // არ ჩავრთოთ refreshing state - user-მა ვერ უნდა შეამჩნიოს
        console.log('🔄 Background refresh started (silent)');
      } else {
        setRefreshing(true);
      }
      
      setLoading(false); // არ იყოს loading state background refresh-ზე
      setError(null);

      const targetDate = date || new Date().toISOString().split('T')[0];
      
      console.log('🔮 Fetching horoscope:', { userId, readingType, date: targetDate, isBackgroundRefresh });

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
        previousDataRef.current = result.data;
        hasFetched.current = true;
        currentKey.current = key;
        
        // Cache the data
        try {
          const cacheKey = `horoscope_${userId}_${readingType}_${targetDate}`;
          localStorage.setItem(cacheKey, JSON.stringify({
            data: result.data,
            timestamp: Date.now()
          }));
        } catch (cacheError) {
          console.warn('⚠️ Failed to cache horoscope:', cacheError);
        }
      } else {
        throw new Error(result.error || 'The stars are silent');
      }
    } catch (err: any) {
      console.error('🌑 Cosmic error:', err);
      setError(err.message);
      
      if (previousDataRef.current) {
        console.log('🔄 Using cached data after error');
        setHoroscope(previousDataRef.current);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const targetDate = date || new Date().toISOString().split('T')[0];
    const cacheKey = `horoscope_${userId}_${readingType}_${targetDate}`;
    
    let hasCache = false;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheAge = Date.now() - parsed.timestamp;
        
        if (cacheAge < CACHE_DURATION) {
          console.log('⚡ Using cached horoscope (age:', Math.round(cacheAge / 1000), 's)');
          setHoroscope(parsed.data);
          previousDataRef.current = parsed.data;
          hasFetched.current = true;
          currentKey.current = `${userId}-${readingType}-${date}`;
          setLoading(false);
          hasCache = true;
          
          // 🆕 FIX: Background refresh - silent, არ ჩართოს UI updates
          fetchHoroscope(false, true);
          return;
        } else {
          console.log('⏰ Cache expired (age:', Math.round(cacheAge / 1000), 's)');
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to read cache:', cacheError);
    }

    if (!hasCache) {
      fetchHoroscope();
    }
  }, [userId, readingType, date]);

  const refetch = () => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const cacheKey = `horoscope_${userId}_${readingType}_${targetDate}`;
    
    try {
      localStorage.removeItem(cacheKey);
    } catch (cacheError) {
      console.warn('⚠️ Failed to clear cache:', cacheError);
    }
    
    hasFetched.current = false;
    fetchHoroscope(true);
  };

  return {
    horoscope,
    loading,
    refreshing,
    error,
    refetch
  };
}