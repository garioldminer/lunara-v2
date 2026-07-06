import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';

export interface BirthChart {
  sun_sign: string;
  moon_sign: string | null;
  rising_sign: string | null;
  mercury_sign: string | null;
  venus_sign: string | null;
  mars_sign: string | null;
  jupiter_sign: string | null;
  saturn_sign: string | null;
  houses: Record<string, string> | null;
}

export function useBirthChart() {
  const { user } = useUser();
  const [birthChart, setBirthChart] = useState<BirthChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBirthChart() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      if (!supabase) {
        console.error('Supabase client is not initialized');
        setError('Database not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // ვცდილობთ birth_charts table-დან წამოღებას
        const { data: chartData, error: chartError } = await supabase
          .from('birth_charts')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (chartError && chartError.code !== 'PGRST116') {
          console.error('Error fetching birth chart:', chartError);
        }

        if (chartData) {
          setBirthChart(chartData);
        } else {
          // თუ birth_charts table-ში არ არის, ვიღებთ users table-დან
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('sun_sign, moon_sign, rising_sign')
            .eq('id', user.id)
            .single();

          if (userError) {
            console.error('Error fetching user signs:', userError);
            setError('Failed to load birth chart');
          } else if (userData) {
            setBirthChart({
              sun_sign: userData.sun_sign || 'aries',
              moon_sign: userData.moon_sign,
              rising_sign: userData.rising_sign,
              mercury_sign: null,
              venus_sign: null,
              mars_sign: null,
              jupiter_sign: null,
              saturn_sign: null,
              houses: null,
            });
          }
        }
      } catch (err) {
        console.error('Exception in useBirthChart:', err);
        setError('Failed to load birth chart');
      } finally {
        setLoading(false);
      }
    }

    fetchBirthChart();
  }, [user?.id]);

  return { birthChart, loading, error };
}