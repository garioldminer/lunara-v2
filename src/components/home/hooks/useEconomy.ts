import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../lib/logger';

interface EconomyData {
  cosmic_coins: number;
  xp: number;
  level: number;
  current_streak: number;
  cosmic_focus: number;
  max_focus: number;
}

const getXPToNextLevel = (level: number): number => {
  if (level === 1) return 100;
  if (level === 2) return 250;
  if (level === 3) return 500;
  if (level === 4) return 1000;
  if (level === 5) return 2000;
  return Math.floor(2000 * Math.pow(1.8, level - 5));
};

const getLevelFromTotalXP = (totalXP: number) => {
  let level = 1;
  let xpRequiredForNext = getXPToNextLevel(level);
  let currentLevelXP = totalXP;
  
  while (currentLevelXP >= xpRequiredForNext) {
    currentLevelXP -= xpRequiredForNext;
    level++;
    xpRequiredForNext = getXPToNextLevel(level);
  }
  
  return { level, currentLevelXP, xpToNext: xpRequiredForNext };
};

export const useEconomy = (userId: string | undefined) => {
  const [economy, setEconomy] = useState<EconomyData>({
    cosmic_coins: 0,
    xp: 0,
    level: 1,
    current_streak: 0,
    cosmic_focus: 20,
    max_focus: 20
  });
  const [loading, setLoading] = useState(true);

  // Load economy data
  useEffect(() => {
    const loadEconomy = async () => {
      if (!userId || !supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_economy')
          .select('cosmic_coins, xp, level, current_streak, cosmic_focus, max_focus')
          .eq('user_id', userId)
          .single();

        if (error) {
          logger.error('Failed to load economy:', error);
          return;
        }

        if (data) {
          const levelData = getLevelFromTotalXP(data.xp || 0);
          setEconomy({
            cosmic_coins: data.cosmic_coins || 0,
            xp: data.xp || 0,
            level: levelData.level,
            current_streak: data.current_streak || 0,
            cosmic_focus: data.cosmic_focus || 20,
            max_focus: data.max_focus || 20
          });
        }
      } catch (error) {
        logger.error('Error loading economy:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEconomy();
  }, [userId]);

  // Auto-regenerate energy
  useEffect(() => {
    if (!userId || !supabase) return;

    const calculateRealEnergy = async () => {
      if (!supabase) return;
      
      try {
        const { data: economyData } = await supabase
          .from('user_economy')
          .select('cosmic_focus, max_focus, last_energy_update, energy_boost_multiplier')
          .eq('user_id', userId)
          .single();

        if (!economyData) return;

        const now = new Date();
        const lastUpdate = new Date(economyData.last_energy_update);
        const minutesPassed = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;

        const boostMultiplier = economyData.energy_boost_multiplier || 1.0;
        const regenRate = 30 / boostMultiplier;
        const energyToRegen = Math.floor(minutesPassed / regenRate);

        if (energyToRegen > 0) {
          const newEnergy = Math.min(
            economyData.cosmic_focus + energyToRegen,
            economyData.max_focus
          );

          await supabase
            .from('user_economy')
            .update({
              cosmic_focus: newEnergy,
              last_energy_update: now.toISOString()
            })
            .eq('user_id', userId);

          setEconomy(prev => ({ ...prev, cosmic_focus: newEnergy }));
        }
      } catch (error) {
        logger.error('Error calculating energy:', error);
      }
    };

    calculateRealEnergy();
    const interval = setInterval(calculateRealEnergy, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Reload from database
  const reloadFromDatabase = async () => {
    if (!userId || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('user_economy')
        .select('cosmic_coins, xp, level, current_streak, cosmic_focus, max_focus')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        const levelData = getLevelFromTotalXP(data.xp || 0);
        setEconomy({
          cosmic_coins: data.cosmic_coins || 0,
          xp: data.xp || 0,
          level: levelData.level,
          current_streak: data.current_streak || 0,
          cosmic_focus: data.cosmic_focus || 20,
          max_focus: data.max_focus || 20
        });
      }
    } catch (error) {
      logger.error('Error reloading economy:', error);
    }
  };

  // Check and spend energy
  const checkAndSpendEnergy = async (readingType: string, requiredEnergy: number): Promise<boolean> => {
    if (!userId || !supabase) return false;

    if (economy.cosmic_focus < requiredEnergy) {
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('spend_energy', {
        user_uuid: userId,
        amount: requiredEnergy,
        reading_type: readingType
      });

      if (error || !data?.success) {
        return false;
      }

      setEconomy(prev => ({ ...prev, cosmic_focus: data.new_energy }));
      return true;
    } catch (error) {
      logger.error('Error spending energy:', error);
      return false;
    }
  };

  // Refill energy
  const refillEnergy = async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !supabase) return { success: false, error: 'No user' };

    const maxEnergy = economy.max_focus || 20;
    const currentEnergy = economy.cosmic_focus || 0;
    const energyNeeded = maxEnergy - currentEnergy;

    if (energyNeeded <= 0) {
      return { success: false, error: 'Energy already full' };
    }

    const energyToAdd = Math.min(10, energyNeeded);
    const cost = energyToAdd * 5;

    if (economy.cosmic_coins < cost) {
      return { success: false, error: `Not enough diamonds! Need ${cost} 💎` };
    }

    try {
      const { data, error } = await supabase.rpc('refill_energy_with_coins', {
        p_user_id: userId,
        p_coin_cost: cost,
        p_energy_gain: energyToAdd
      });

      if (error || !data?.success) {
        return { success: false, error: error?.message || 'Refill failed' };
      }

      setEconomy(prev => ({
        ...prev,
        cosmic_coins: data.new_coins,
        cosmic_focus: data.new_energy
      }));

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Update economy locally
  const updateEconomy = (updates: Partial<EconomyData>) => {
    setEconomy(prev => ({ ...prev, ...updates }));
  };

  return {
    economy,
    loading,
    reloadFromDatabase,
    checkAndSpendEnergy,
    refillEnergy,
    updateEconomy,
    getLevelFromTotalXP
  };
};