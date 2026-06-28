// src/hooks/useCosmicData.ts
import { useState, useEffect } from 'react';

export interface CosmicData {
  success: boolean;
  date: string;
  cosmic: {
    moon_phase: string;
    moon_illumination: number;
    moon_sign: string;
    moon_degree: number;
    sun_sign: string;
    sun_degree: number;
    energy_level: number;
    dominant_element: string;
    daily_theme: string;
    key_advice: string;
    best_ritual: string;
    lucky_color: string;
    lucky_number: number;
  };
  planets: Array<{
    name: string;
    sign: string;
    degree: number;
    retrograde: boolean;
  }>;
  aspects: Array<{
    planet1: string;
    planet2: string;
    aspect_type: string;
    degree: number;
    orb: number;
    influence: string;
  }>;
}

export function useCosmicData(date?: string) {
  const [data, setData] = useState<CosmicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const dateParam = date || new Date().toISOString().split('T')[0];
        
        const response = await fetch(
          `https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/get-daily-data?date=${dateParam}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setData(result);
        } else {
          throw new Error(result.error || 'Failed to fetch data');
        }
      } catch (err: any) {
        console.error('Error fetching cosmic data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

  return { data, loading, error };
}