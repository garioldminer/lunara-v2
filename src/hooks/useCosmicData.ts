// src/hooks/useCosmicData.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

        const targetDate = date || new Date().toISOString().split('T')[0];

        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }

        // ✅ 1. ვიღებთ cosmic_daily_data ცხრილიდან
        const { data: cosmicRow, error: cosmicError } = await supabase
          .from('cosmic_daily_data')
          .select('*')
          .eq('date', targetDate)
          .single();

        if (cosmicError) {
          console.error('Error fetching cosmic_daily_data:', cosmicError);
          throw new Error('Failed to fetch cosmic data');
        }

        // ✅ 2. ვიღებთ planet_positions ცხრილიდან
        const { data: planetsRows, error: planetsError } = await supabase
          .from('planet_positions')
          .select('planet_name, sign, degree, retrograde')
          .eq('date', targetDate);

        if (planetsError) {
          console.error('Error fetching planet_positions:', planetsError);
        }

        // ✅ 3. ვაგროვებთ მონაცემებს CosmicData ფორმატში
        const cosmicData: CosmicData = {
          success: true,
          date: targetDate,
          cosmic: {
            moon_phase: cosmicRow.moon_phase || 'Waxing Gibbous',
            moon_illumination: Number(cosmicRow.moon_illumination) || 98,
            moon_sign: cosmicRow.moon_sign || 'Capricorn',
            moon_degree: Number(cosmicRow.moon_degree) || 0,
            sun_sign: cosmicRow.sun_sign || 'Cancer',
            sun_degree: Number(cosmicRow.sun_degree) || 0,
            energy_level: Number(cosmicRow.energy_level) || 85,
            dominant_element: cosmicRow.dominant_element || 'Water',
            daily_theme: cosmicRow.daily_theme || 'Cosmic Flow',
            key_advice: cosmicRow.key_advice || 'Trust the cosmic flow today.',
            best_ritual: cosmicRow.best_ritual || 'Meditation',
            lucky_color: cosmicRow.lucky_color || 'Blue',
            lucky_number: Number(cosmicRow.lucky_number) || 7,
          },
          planets: (planetsRows || []).map((p: any) => ({
            name: p.planet_name,
            sign: p.sign,
            degree: Number(p.degree),
            retrograde: Boolean(p.retrograde),
          })),
          aspects: [], // ჯერ ცარიელი - aspects ცხრილი მოგვიანებით
        };

        setData(cosmicData);
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