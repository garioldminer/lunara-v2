import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { getTelegramUser } from '../../../lib/telegramAuth';
import { getOrCreateUser } from '../../../lib/userService';
import { loadUserQuests, trackQuestProgress } from '../../../lib/questService';
import { getLevelFromTotalXP } from '../lib/helpers';

interface DebugLog {
  id: number;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  category: string;
  message: string;
  data?: any;
}

interface DatabaseDebugInfo {
  lastQuery: any;
  lastResponse: any;
  economyData: any;
  queryHistory: Array<{
    timestamp: string;
    table: string;
    operation: string;
    params: any;
    result: any;
    error?: any;
  }>;
}

interface EconomyData {
  cosmic_coins: number;
  xp: number;
  level: number;
  current_streak: number;
  cosmic_focus: number;
  max_focus: number;
}

interface UseDebugToolsProps {
  user: any;
  economy: EconomyData;
  setEconomy: (updater: any) => void;
  setCurrentStreak: (value: number) => void;
  setUser: (user: any) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  loadQuests: () => Promise<void>;
}

export function useDebugTools({ user, economy, setEconomy, setCurrentStreak, setUser, showToast, loadQuests }: UseDebugToolsProps) {
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [dbDebugInfo, setDbDebugInfo] = useState<DatabaseDebugInfo>({
    lastQuery: null, lastResponse: null, economyData: null, queryHistory: []
  });
  const [xpTestLogs, setXpTestLogs] = useState<string[]>([]);

  const addDebugLog = (type: DebugLog['type'], category: string, message: string, data?: any) => {
    const log: DebugLog = {
      id: Date.now(), timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }), type, category, message, data
    };
    setDebugLogs(prev => [log, ...prev].slice(0, 50));
  };

  const addToDbDebugHistory = (table: string, operation: string, params: any, result: any, error?: any) => {
    const historyEntry = {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }), table, operation, params, result, error
    };
    setDbDebugInfo(prev => ({
      ...prev, lastQuery: { table, operation, params }, lastResponse: result || error,
      queryHistory: [historyEntry, ...prev.queryHistory].slice(0, 20)
    }));
  };

  const checkDatabaseStatus = async () => {
    addDebugLog('info', 'DB_CHECK', '🔍 Starting database status check...');
    if (!user || !supabase) {
      addDebugLog('error', 'DB_CHECK', '❌ No user or supabase client available');
      return;
    }
    try {
      const { data: userData, error: userError } = await supabase.from('users').select('id, display_name, telegram_id').eq('id', user.id).single();
      if (userError) addDebugLog('error', 'DB_CHECK', `❌ Error fetching user: ${userError.message}`);
      else addDebugLog('success', 'DB_CHECK', '✅ User found in database', userData);

      const { data: economyData, error: economyError } = await supabase.from('user_economy').select('cosmic_coins, xp, level, cosmic_focus, max_focus').eq('user_id', user.id).single();
      if (economyError) addDebugLog('error', 'DB_CHECK', `❌ Error fetching economy: ${economyError.message}`);
      else addDebugLog('success', 'DB_CHECK', '✅ Economy record found', economyData);

      const { data: questsData, error: questsError } = await supabase.rpc('get_user_quests', { p_user_id: user.id });
      if (questsError) addDebugLog('error', 'DB_CHECK', `❌ Error calling get_user_quests RPC: ${questsError.message}`);
      else addDebugLog('success', 'DB_CHECK', `✅ get_user_quests RPC works. Found ${questsData?.length || 0} quests.`);

      addDebugLog('success', 'DB_CHECK', '🎉 Database check completed!');
    } catch (err: any) {
      addDebugLog('error', 'DB_CHECK', `💥 Exception during DB check: ${err.message}`);
    }
  };

  const refreshUserDataDebug = async () => {
    addDebugLog('info', 'AUTH_DEBUG', '🔄 Starting manual user data refresh...');
    const tgUser = getTelegramUser();
    addDebugLog('info', 'AUTH_DEBUG', '1. Data from Telegram:', tgUser);
    if (!tgUser || !supabase) {
      addDebugLog('error', 'AUTH_DEBUG', '❌ CRITICAL: Missing Telegram user or Supabase!');
      return;
    }
    addDebugLog('info', 'AUTH_DEBUG', `2. Querying Supabase with telegram_id: ${tgUser.id}`);
    const freshUser = await getOrCreateUser(tgUser);
    addDebugLog('info', 'AUTH_DEBUG', '3. Response from getOrCreateUser:', freshUser);
    if (freshUser) {
      addDebugLog('success', 'AUTH_DEBUG', '✅ SUCCESS: Updating User Context with fresh data');
      setUser(freshUser);
      setEconomy({ cosmic_coins: 0, xp: 0, level: 1, current_streak: 0, cosmic_focus: 20, max_focus: 20 });
    } else {
      addDebugLog('error', 'AUTH_DEBUG', '❌ FAILED: getOrCreateUser returned null.');
    }
  };

  const handleLogoutAndReset = async () => {
    if (!supabase) return;
    addDebugLog('info', 'AUTH', 'Logging out and clearing local storage...');
    try {
      localStorage.clear();
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err: any) {
      addDebugLog('error', 'AUTH', `Logout failed: ${err.message}`);
    }
  };

  const testAddCoins = async (amount: number) => {
    if (!user || !supabase) return;
    addDebugLog('info', 'TEST', `🪙 Adding ${amount} coins...`);
    try {
      const currentCoins = economy.cosmic_coins;
      const newCoins = currentCoins + amount;
      const { data, error } = await supabase.from('user_economy').update({ cosmic_coins: newCoins }).eq('user_id', user.id).select().single();
      addToDbDebugHistory('user_economy', 'UPDATE', { userId: user.id, field: 'cosmic_coins', oldValue: currentCoins, newValue: newCoins }, data, error);
      if (error) throw error;
      setEconomy((prev: EconomyData) => ({ ...prev, cosmic_coins: newCoins }));
      addDebugLog('success', 'TEST', `✅ Added ${amount} coins. New balance: ${newCoins}`);
      showToast(`Added ${amount} coins!`, 'success');
    } catch (err: any) {
      addDebugLog('error', 'TEST', `❌ Failed: ${err.message}`);
      showToast('Failed to add coins', 'error');
    }
  };

  const testAddXP = async (amount: number) => {
    if (!user || !supabase) return;
    addDebugLog('info', 'TEST', `⭐ Adding ${amount} XP...`);
    try {
      const currentXP = economy.xp;
      const newXP = currentXP + amount;
      const newLevelData = getLevelFromTotalXP(newXP);
      const { data, error } = await supabase.from('user_economy').update({ xp: newXP, level: newLevelData.level }).eq('user_id', user.id).select().single();
      addToDbDebugHistory('user_economy', 'UPDATE', { userId: user.id, field: 'xp', oldValue: currentXP, newValue: newXP, newLevel: newLevelData.level }, data, error);
      if (error) throw error;
      setEconomy((prev: EconomyData) => ({ ...prev, xp: newXP, level: newLevelData.level }));
      addDebugLog('success', 'TEST', `✅ Added ${amount} XP. New: ${newXP} XP, Level ${newLevelData.level}`);
      showToast(`Added ${amount} XP!`, 'success');
    } catch (err: any) {
      addDebugLog('error', 'TEST', `❌ Failed: ${err.message}`);
      showToast('Failed to add XP', 'error');
    }
  };

  const testAddEnergy = async (amount: number) => {
    if (!user || !supabase) return;
    addDebugLog('info', 'ENERGY_TEST', `⚡ Adding ${amount} energy...`);
    try {
      const { data, error } = await supabase.rpc('add_energy', {
        user_uuid: user.id,
        amount: amount,
        transaction_type: 'debug_test',
        reference_id: 'debug_panel'
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to add energy');
      
      setEconomy((prev: EconomyData) => ({ ...prev, cosmic_focus: data.new_energy }));
      addDebugLog('success', 'ENERGY_TEST', `✅ Added ${amount} energy. New: ${data.new_energy}`);
      showToast(`Added ${amount} ⚡ Energy!`, 'success');
    } catch (err: any) {
      addDebugLog('error', 'ENERGY_TEST', `❌ Failed: ${err.message}`);
      showToast('Failed to add energy', 'error');
    }
  };

  const testSpendEnergy = async (amount: number) => {
    if (!user || !supabase) return;
    addDebugLog('info', 'ENERGY_TEST', `⚡ Spending ${amount} energy...`);
    try {
      const { data, error } = await supabase.rpc('spend_energy', {
        user_uuid: user.id,
        amount: amount,
        reading_type: 'debug_test'
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Not enough energy');
      
      setEconomy((prev: EconomyData) => ({ ...prev, cosmic_focus: data.new_energy }));
      addDebugLog('success', 'ENERGY_TEST', `✅ Spent ${amount} energy. Remaining: ${data.new_energy}`);
      showToast(`Spent ${amount} ⚡ Energy! Remaining: ${data.new_energy}`, 'success');
    } catch (err: any) {
      addDebugLog('error', 'ENERGY_TEST', `❌ Failed: ${err.message}`);
      showToast(err.message || 'Failed to spend energy', 'error');
    }
  };

  const testCompleteQuest = async () => {
    if (!user || !supabase) {
      addDebugLog('error', 'QUEST_TEST', 'No user or supabase available for test');
      return;
    }
    addDebugLog('info', 'QUEST_TEST', '🎯 Simulating quest completion: draw_daily_card');
    const currentQuests = await loadUserQuests(user.id);
    const q = currentQuests.find((x: any) => x.quest?.action_type === 'draw_daily_card');
    if (q) {
      addDebugLog('info', 'QUEST_TEST', `Current State -> Progress: ${q.current_progress}/${q.quest?.target_count}, Completed: ${q.is_completed}`);
    } else {
      addDebugLog('info', 'QUEST_TEST', 'Quest not found in user progress. Will create new record via secure function...');
    }
    const reward = await trackQuestProgress(user.id, 'draw_daily_card', 1);
    if (reward) {
      addDebugLog('success', 'QUEST_TEST', `🎉 Quest Completed! Reward: ${reward.coins} coins, ${reward.xp} XP`);
      await reloadFromDatabase();
      await loadQuests();
    } else {
      addDebugLog('info', 'QUEST_TEST', 'Progress updated. Check logs for details.');
      await loadQuests();
    }
  };

  const reloadFromDatabase = async () => {
    addDebugLog('info', 'DB', '🔄 Reloading all data from database...');
    if (user && supabase) {
      const { data, error } = await supabase.from('user_economy').select('cosmic_coins, xp, level, current_streak, cosmic_focus, max_focus, energy_boost_multiplier, last_energy_update').eq('user_id', user.id).single();
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
        setCurrentStreak(data.current_streak || 0);
        setDbDebugInfo(prev => ({ ...prev, economyData: data }));
        addDebugLog('success', 'DB', '✅ Data reloaded successfully');
      }
    }
  };

  const testAddXPWithLevel = async (amount: number) => {
    if (!user || !supabase) return;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setXpTestLogs(prev => [...prev, `[${timestamp}] Adding ${amount} XP via RPC...`]);
    addDebugLog('info', 'XP_TEST', `🧪 Adding ${amount} XP with auto-level...`);
    
    try {
      const { data, error } = await supabase.rpc('add_xp_and_recalc_level', {
        p_user_id: user.id,
        p_xp_amount: amount
      });

      if (error) {
        setXpTestLogs(prev => [...prev, `[${timestamp}] ❌ ERROR: ${error.message}`]);
        addDebugLog('error', 'XP_TEST', `❌ RPC Error: ${error.message}`);
        showToast('XP test failed', 'error');
        return;
      }

      if (data?.success) {
        const logMsg = data.leveled_up 
          ? `[${timestamp}] 🎉 LEVEL UP! ${data.old_level} → ${data.new_level} | Total XP: ${data.total_xp}`
          : `[${timestamp}] ✅ +${amount} XP | Total: ${data.total_xp} | Level: ${data.new_level} | Next: ${data.xp_to_next} XP`;
        
        setXpTestLogs(prev => [...prev, logMsg]);
        addDebugLog('success', 'XP_TEST', logMsg, data);
        
        await reloadFromDatabase();
        
        if (data.leveled_up) {
          showToast(`Level Up! You are now Level ${data.new_level}!`, 'success');
        } else {
          showToast(`+${amount} XP added successfully`, 'success');
        }
      } else {
        setXpTestLogs(prev => [...prev, `[${timestamp}] ❌ ${data?.error || 'Unknown error'}`]);
      }
    } catch (err: any) {
      setXpTestLogs(prev => [...prev, `[${timestamp}] 💥 Exception: ${err.message}`]);
      addDebugLog('error', 'XP_TEST', `💥 Exception: ${err.message}`);
    }
  };

  const forceRecalcLevel = async () => {
    if (!user || !supabase) return;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setXpTestLogs(prev => [...prev, `[${timestamp}] 🔄 Force recalculating level from DB...`]);
    addDebugLog('info', 'XP_TEST', '🔄 Force recalculating level...');
    
    try {
      const { data, error } = await supabase.rpc('add_xp_and_recalc_level', {
        p_user_id: user.id,
        p_xp_amount: 0
      });

      if (error) {
        setXpTestLogs(prev => [...prev, `[${timestamp}] ❌ ERROR: ${error.message}`]);
        return;
      }

      if (data?.success) {
        setXpTestLogs(prev => [...prev, `[${timestamp}] ✅ Level recalculated: ${data.new_level} | XP: ${data.total_xp} | Next: ${data.xp_to_next} XP`]);
        await reloadFromDatabase();
        showToast(`Level verified: ${data.new_level}`, 'info');
      }
    } catch (err: any) {
      setXpTestLogs(prev => [...prev, `[${timestamp}] 💥 Exception: ${err.message}`]);
    }
  };

  return {
    debugLogs,
    setDebugLogs,
    dbStatus,
    dbDebugInfo,
    xpTestLogs,
    addDebugLog,
    addToDbDebugHistory,
    checkDatabaseStatus,
    refreshUserDataDebug,
    handleLogoutAndReset,
    testAddCoins,
    testAddXP,
    testAddEnergy,
    testSpendEnergy,
    testCompleteQuest,
    reloadFromDatabase,
    testAddXPWithLevel,
    forceRecalcLevel
  };
}