import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useUser } from '../context/UserContext';
import { useTranslation } from '../i18n/TranslationContext';
import { tarotCards, SUITS, CARD_BACK_URL } from '../data/tarotCards';
import { getActiveSubscription } from '../lib/subscriptionService';
import { supabase } from '../lib/supabase';
import { getTelegramUser } from '../lib/telegramAuth';
import { getOrCreateUser } from '../lib/userService';
import { loadUserQuests, trackQuestProgress, type QuestProgress } from '../lib/questService';
import { getTodayReading } from '../lib/dailyCardService';
import { getStreakMilestones, getClaimedMilestones } from '../lib/streakService';
import { 
  Gem, Zap, Trophy, Flame, X, CheckCircle,
  Sparkles, LayoutGrid, Moon, Hash, 
  Crown, Scroll, ChevronRight, Gift, Shield, Infinity as InfinityIcon, RefreshCw, TrendingUp
} from 'lucide-react';
import DebugPanel from './DebugPanel';
import DiamondShopModal from './DiamondShopModal';
import StreakModal from './StreakModal';
import LeaderboardModal from './LeaderboardModal';
import './HomeScreen.css';

// ==========================================
// ✨ Zodiac helper for HomeScreen
// ==========================================
const ZODIAC_SYMBOLS: Record<string, string> = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
  leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
  sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓'
};

const getZodiacSymbol = (signName: string): string => {
  if (!signName) return '✧';
  return ZODIAC_SYMBOLS[signName.toLowerCase()] || '✧';
};

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

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: '0', left: '0', right: '0', zIndex: 10003,
      display: 'flex', justifyContent: 'center', padding: '80px 16px 0 16px', pointerEvents: 'none'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={{
          background: toast.type === 'success' 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.98), rgba(5, 150, 105, 0.98))'
            : toast.type === 'error'
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.98), rgba(220, 38, 38, 0.98))'
            : 'linear-gradient(135deg, rgba(251, 191, 36, 0.98), rgba(245, 158, 11, 0.98))',
          color: '#fff', padding: '16px 20px', borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '600',
          maxWidth: '400px', width: '100%', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'auto'
        }}
      >
        <span style={{ fontSize: '20px', flexShrink: 0 }}>
          {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
        </span>
        <span style={{ flex: 1, textAlign: 'center', paddingRight: '20px' }}>{toast.message}</span>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', width: '24px', height: '24px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: '16px', lineHeight: 1
          }}
        >
          ×
        </button>
      </motion.div>
    </div>
  );
}

function LevelUpModal({ level, onClose, t }: { level: number; onClose: () => void; t: (key: string, params?: any) => string }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 10002,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        style={{
          background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
          border: '2px solid #fbbf24', borderRadius: '24px', padding: '32px 24px', textAlign: 'center',
          maxWidth: '320px', width: '100%', boxShadow: '0 0 50px rgba(251, 191, 36, 0.4)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px', filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))' }}>🎉</div>
        <h2 style={{ color: '#fbbf24', fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px' }}>{t('home.levelUpTitle')}</h2>
        <p style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '24px', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: t('home.levelUpMessage', { level }) }} />
        <button 
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#0f0c08', border: 'none',
            borderRadius: '12px', padding: '14px 32px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
            width: '100%', boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)'
          }}
        >
          {t('home.awesome')}
        </button>
      </motion.div>
    </div>
  );
}

interface Props {
  onNavigate?: (screen: string) => void;
}

interface EconomyData {
  cosmic_coins: number;
  xp: number;
  level: number;
  current_streak: number;
  cosmic_focus: number;
  max_focus: number;
}

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

interface DailyQuestDisplay extends QuestProgress {
  isClaimable: boolean;
}

export default function HomeScreen({ onNavigate }: Props) {
  const { t } = useTranslation();
  const { user, setUser } = useUser();
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [timeLeft, setTimeLeft] = useState('14:32:18');
  const [dailyCard, setDailyCard] = useState<typeof tarotCards[0] | null>(null);
  const [isDailyReversed, setIsDailyReversed] = useState(false);
  const [isDailyRevealed, setIsDailyRevealed] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  
  const [economy, setEconomy] = useState<EconomyData>({ 
    cosmic_coins: 0, xp: 0, level: 1, current_streak: 0, cosmic_focus: 20, max_focus: 20 
  });
  const [questsLoading, setQuestsLoading] = useState(true);
  const [dailyQuests, setDailyQuests] = useState<DailyQuestDisplay[]>([]);
  const [activeDailyQuest, setActiveDailyQuest] = useState<DailyQuestDisplay | null>(null);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [isClaimingQuest, setIsClaimingQuest] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [leveledUpTo, setLeveledUpTo] = useState<number>(1);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [xpTestLogs, setXpTestLogs] = useState<string[]>([]);

  // 🆕 STREAK MILESTONES STATE
  const [unclaimedMilestoneCount, setUnclaimedMilestoneCount] = useState(0);

  // 🆕 STREAK BANNER DISMISS STATE
  const [streakBannerDismissed, setStreakBannerDismissed] = useState(false);

  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [dbDebugInfo, setDbDebugInfo] = useState<DatabaseDebugInfo>({
    lastQuery: null, lastResponse: null, economyData: null, queryHistory: []
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

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
      setEconomy(prev => ({ ...prev, cosmic_coins: newCoins }));
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
      setEconomy(prev => ({ ...prev, xp: newXP, level: newLevelData.level }));
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
      
      setEconomy(prev => ({ ...prev, cosmic_focus: data.new_energy }));
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
      
      setEconomy(prev => ({ ...prev, cosmic_focus: data.new_energy }));
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
    const q = currentQuests.find(x => x.quest?.action_type === 'draw_daily_card');
    if (q) {
      addDebugLog('info', 'QUEST_TEST', `Current State -> Progress: ${q.current_progress}/${q.quest?.target_count}, Completed: ${q.is_completed}`);
    } else {
      addDebugLog('info', 'QUEST_TEST', 'Quest not found in user progress. Will create new record via secure function...');
    }
    const reward = await trackQuestProgress(user.id, 'draw_daily_card', 1);
    if (reward) {
      addDebugLog('success', 'QUEST_TEST', `🎉 Quest Completed! Reward: ${reward.coins} coins, ${reward.xp} XP`);
      reloadFromDatabase();
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

  const loadQuests = async () => {
    if (!user) return;
    setQuestsLoading(true);
    const quests = await loadUserQuests(user.id);
    const dQuests = quests.filter(q => q.quest?.quest_type === 'daily') as DailyQuestDisplay[];
    const processedQuests = dQuests.map(q => ({ ...q, isClaimable: q.is_completed && !q.is_claimed }));
    setDailyQuests(processedQuests);
    const unclaimed = processedQuests.filter(q => !q.is_claimed);
    if (unclaimed.length > 0) {
      const randomIndex = Math.floor(Math.random() * unclaimed.length);
      setActiveDailyQuest(unclaimed[randomIndex]);
    } else {
      setActiveDailyQuest(null);
    }
    setQuestsLoading(false);
  };

  const handleClaimQuest = async (quest: DailyQuestDisplay) => {
    if (!user || !supabase || isClaimingQuest) return;
    setIsClaimingQuest(true);
    addDebugLog('info', 'QUEST_CLAIM', `Attempting to claim quest: ${quest.quest?.title}`);
    try {
      const { data, error } = await supabase.rpc('claim_quest_reward', { p_user_id: user.id, p_quest_id: quest.quest_id });
      if (error || !data?.success) {
        addDebugLog('error', 'QUEST_CLAIM', `Failed: ${error?.message || data?.error}`);
        showToast(data?.error || 'Failed to claim reward', 'error');
      } else {
        addDebugLog('success', 'QUEST_CLAIM', `Claimed! +${data.reward.coins} coins, +${data.reward.xp} XP`);
        const currentTotalXP = user.xp || 0;
        const newTotalXP = currentTotalXP + data.reward.xp;
        const oldLevelData = getLevelFromTotalXP(currentTotalXP);
        const newLevelData = getLevelFromTotalXP(newTotalXP);
        setEconomy(prev => ({ ...prev, cosmic_coins: prev.cosmic_coins + data.reward.coins, xp: newTotalXP, level: newLevelData.level }));
        if (newLevelData.level > oldLevelData.level) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24', '#f59e0b', '#ffffff', '#10b981'] });
          setLeveledUpTo(newLevelData.level);
          setShowLevelUpModal(true);
        } else {
          showToast(`Quest Completed! +${data.reward.coins} Coins, +${data.reward.xp} XP`, 'success');
        }
        await loadQuests();
      }
    } catch (err: any) {
      addDebugLog('error', 'QUEST_CLAIM', `Exception: ${err.message}`);
      showToast('Failed to claim quest', 'error');
    } finally {
      setIsClaimingQuest(false);
    }
  };

  // 🆕 HANDLE MILESTONE CLAIMED (from StreakModal)
  const handleMilestoneClaimed = (data: { total_coins: number; total_xp: number; total_premium_days: number }) => {
    addDebugLog('success', 'MILESTONE_CLAIM', `🎉 Milestones claimed!`, data);
    
    const premiumText = data.total_premium_days > 0 ? `, +${data.total_premium_days} Premium Days` : '';
    showToast(`🎉 +${data.total_coins} Coins, +${data.total_xp} XP${premiumText} claimed!`, 'success');
    
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#fbbf24', '#f59e0b', '#10b981', '#ffe566', '#a78bfa']
    });
    
    reloadFromDatabase();
    setUnclaimedMilestoneCount(0);
  };

  useEffect(() => {
    if (user) {
      addDebugLog('info', 'USER', 'User loaded', { userId: user.id, displayName: user.display_name });
      
      const adminStatus = user.is_admin === true;
      setIsUserAdmin(adminStatus);
      
      addDebugLog('success', 'ADMIN', 'Admin check completed (via Context)', { isAdmin: adminStatus });
    } else {
      addDebugLog('warning', 'USER', 'No user loaded');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getActiveSubscription(user.id).then(sub => {
        setActiveSubscription(sub);
        addDebugLog('success', 'SUBSCRIPTION', 'Subscription loaded', { hasSubscription: !!sub });
      }).catch(err => addDebugLog('error', 'SUBSCRIPTION', `Subscription load failed: ${err.message}`));
    }
  }, [user]);

  useEffect(() => {
    if (user) loadQuests();
  }, [user]);

  // 🆕 LOAD STREAK MILESTONES & CALCULATE UNCLAIMED
  useEffect(() => {
    const loadMilestones = async () => {
      if (!user) return;
      
      try {
        const [milestones, claimed] = await Promise.all([
          getStreakMilestones(),
          getClaimedMilestones(user.id)
        ]);
        
        const claimedIds = new Set(claimed.map(c => c.milestone_id));
        const unclaimed = milestones.filter(
          m => economy.current_streak >= m.days_required && !claimedIds.has(m.id)
        );
        setUnclaimedMilestoneCount(unclaimed.length);
        
        addDebugLog('info', 'MILESTONES', 'Loaded milestones', { 
          total: milestones.length, 
          claimed: claimed.length,
          unclaimed: unclaimed.length 
        });
      } catch (err: any) {
        addDebugLog('error', 'MILESTONES', `Failed to load: ${err.message}`);
      }
    };
    
    loadMilestones();
  }, [user, economy.current_streak]);

  const calculateRealEnergy = async () => {
    if (!user || !supabase) return;

    try {
      const { data: economyData } = await supabase
        .from('user_economy')
        .select('cosmic_focus, max_focus, last_energy_update, energy_boost_multiplier')
        .eq('user_id', user.id)
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
          .eq('user_id', user.id);
        
        setEconomy(prev => ({
          ...prev,
          cosmic_focus: newEnergy
        }));
        
        console.log(`⚡ Energy regenerated: +${energyToRegen}, new total: ${newEnergy}`);
      }
    } catch (error) {
      console.error('❌ Error calculating energy:', error);
    }
  };

  const checkAndSpendEnergy = async (readingType: string, requiredEnergy: number): Promise<boolean> => {
    if (!user || !supabase) return false;

    await calculateRealEnergy();
    
    if ((economy.cosmic_focus || 0) < requiredEnergy) {
      showToast(`Not enough energy! You need ${requiredEnergy}⚡, but you have ${economy.cosmic_focus}⚡. Use diamonds to refill!`, 'error');
      return false;
    }
    
    const { data, error } = await supabase.rpc('spend_energy', {
      user_uuid: user.id,
      amount: requiredEnergy,
      reading_type: readingType
    });
    
    if (error) {
      console.error('❌ Error spending energy:', error);
      showToast('Failed to spend energy. Please try again.', 'error');
      return false;
    }
    
    if (!data?.success) {
      showToast(data?.error || 'Not enough energy', 'error');
      return false;
    }
    
    setEconomy(prev => ({
      ...prev,
      cosmic_focus: data.new_energy
    }));
    
    console.log(`⚡ Spent ${requiredEnergy} energy on ${readingType}, remaining: ${data.new_energy}`);
    return true;
  };

  const handleRefillEnergy = async () => {
    if (!user || !supabase) return;
    
    const maxEnergy = economy.max_focus || 20;
    const currentEnergy = economy.cosmic_focus || 0;
    const energyNeeded = maxEnergy - currentEnergy;

    if (energyNeeded <= 0) {
      showToast('Energy is already full! No refill needed.', 'info');
      return;
    }

    const energyToAdd = Math.min(10, energyNeeded);
    const cost = energyToAdd * 5;

    addDebugLog('info', 'ENERGY_REFILL', `🔍 Step 1: Calculating refill. Needed: ${energyNeeded}⚡, Adding: ${energyToAdd}⚡, Cost: ${cost}💎`);

    if (economy.cosmic_coins < cost) {
      addDebugLog('error', 'ENERGY_REFILL', `❌ Step 1 Failed: Insufficient diamonds. Have: ${economy.cosmic_coins}, Need: ${cost}`);
      showToast(`Not enough diamonds! You need ${cost} 💎 to buy ${energyToAdd}⚡ energy.`, 'error');
      return;
    }

    setIsClaiming(true);
    addDebugLog('info', 'ENERGY_REFILL', `⏳ Step 2: Calling Supabase RPC with dynamic values (Cost: ${cost}, Gain: ${energyToAdd})...`);
    
    try {
      const { data, error } = await supabase.rpc('refill_energy_with_coins', {
        p_user_id: user.id,
        p_coin_cost: cost,
        p_energy_gain: energyToAdd
      });

      if (error) {
        addDebugLog('error', 'ENERGY_REFILL', `❌ Step 3 Failed: RPC Error`, error);
        showToast(`Refill failed: ${error.message}`, 'error');
      } else if (!data?.success) {
        addDebugLog('error', 'ENERGY_REFILL', `❌ Step 3 Failed: Function returned error`, data);
        showToast(`Refill failed: ${data?.error || 'Unknown error'}`, 'error');
      } else {
        addDebugLog('success', 'ENERGY_REFILL', `✅ Step 3 Success: Bought ${energyToAdd}⚡ for ${cost}💎`, data);
        
        setEconomy(prev => {
          const newState = { ...prev, cosmic_coins: data.new_coins, cosmic_focus: data.new_energy };
          addDebugLog('info', 'ENERGY_REFILL', `🔄 Step 4: Updating local state`, newState);
          return newState;
        });
        
        showToast(`Successfully bought +${energyToAdd}⚡ Energy for ${cost} 💎!`, 'success');
        addDebugLog('success', 'ENERGY_REFILL', `🎉 Step 5: Refill process completed successfully!`);
      }
    } catch (err: any) {
      addDebugLog('error', 'ENERGY_REFILL', `💥 Step 3 Exception: ${err.message}`, err);
      showToast(`Network error: ${err.message}`, 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    const loadEconomy = async () => {
      if (!user) {
        addDebugLog('warning', 'ECONOMY', 'Cannot load economy - no user');
        return;
      }
      if (!supabase) {
        addDebugLog('error', 'ECONOMY', 'Supabase client is null');
        return;
      }
      setDbStatus('connecting');
      addDebugLog('info', 'ECONOMY', '📡 Starting economy data load', { userId: user.id });
      try {
        const queryParams = { table: 'user_economy', columns: 'cosmic_coins, xp, level, current_streak, cosmic_focus, max_focus', userId: user.id };
        const { data, error } = await supabase.from('user_economy').select('cosmic_coins, xp, level, current_streak, cosmic_focus, max_focus').eq('user_id', user.id).single();
        if (error) {
          setDbStatus('error');
          addToDbDebugHistory('user_economy', 'SELECT', queryParams, null, error);
          addDebugLog('error', 'ECONOMY', '❌ Database query failed', { error: error.message, code: error.code, details: error.details });
          return;
        }
        setDbStatus('connected');
        addToDbDebugHistory('user_economy', 'SELECT', queryParams, data);
        setDbDebugInfo(prev => ({ ...prev, economyData: data }));
        addDebugLog('success', 'ECONOMY', '✅ Economy data loaded successfully', data);
        if (data) {
          const levelData = getLevelFromTotalXP(data.xp || 0);
          const economyData = { 
            cosmic_coins: data.cosmic_coins || 0, 
            xp: data.xp || 0, 
            level: levelData.level, 
            current_streak: data.current_streak || 0,
            cosmic_focus: data.cosmic_focus || 20,
            max_focus: data.max_focus || 20
          };
          setEconomy(economyData);
          setCurrentStreak(economyData.current_streak);
          addDebugLog('info', 'STATE', '💰 Economy state updated', economyData);
        } else {
          addDebugLog('warning', 'ECONOMY', '⚠️ No economy data found for user');
        }
      } catch (error: any) {
        setDbStatus('error');
        addDebugLog('error', 'ECONOMY', '💥 Exception during economy load', { message: error.message, stack: error.stack });
      }
    };
    loadEconomy();
  }, [user]);

  useEffect(() => {
    if (user) {
      calculateRealEnergy();
      const interval = setInterval(calculateRealEnergy, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const loadDailyCard = async () => {
      if (!user) return;
      try {
        const reading = await getTodayReading(user.id);
        if (reading) {
          const card = tarotCards.find(c => c.id === reading.cards[0]?.id);
          if (card) {
            setDailyCard(card);
            setIsDailyReversed(reading.cards[0]?.is_reversed || false);
            setIsDailyRevealed(true);
            addDebugLog('info', 'DAILY_CARD', 'Loaded from DB', { card: card.name });
          }
        } else {
          setDailyCard(null);
          setIsDailyRevealed(false);
          addDebugLog('info', 'DAILY_CARD', 'No reading today - mystery state');
        }
      } catch (err: any) {
        addDebugLog('error', 'DAILY_CARD', `Failed to load: ${err.message}`);
      }
    };
    loadDailyCard();
  }, [user]);

  const getCardMeta = (card: typeof tarotCards[0]) => {
    if (card.arcana === 'major') return 'Major Arcana';
    if (card.suit && SUITS[card.suit]) return `${SUITS[card.suit].element}`;
    return '';
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClaimReward = async () => {
    if (rewardClaimed || isClaiming) {
      showToast('Reward already claimed or claiming', 'info');
      return;
    }
    addDebugLog('info', 'REWARD', 'Starting reward claim process');
    setIsClaiming(true);
    try {
      if (!user?.id) {
        addDebugLog('error', 'REWARD', 'No user ID available');
        showToast('User ID not found', 'error');
        setIsClaiming(false);
        return;
      }
      addDebugLog('info', 'REWARD', 'Calling Edge Function', { userId: user.id, url: 'https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/claim-daily-reward' });
      const response = await fetch('https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/claim-daily-reward', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id }, body: JSON.stringify({})
      });
      addDebugLog('info', 'REWARD', 'Edge Function response received', { status: response.status, statusText: response.statusText });
      const result = await response.json();
      addDebugLog('info', 'REWARD', 'Response parsed', result);
      if (result.success) {
        setRewardClaimed(true);
        const rewardData = result.data?.reward || result.reward;
        if (rewardData) {
          setCurrentStreak(rewardData.streak);
          const newEconomy = { ...economy, cosmic_coins: economy.cosmic_coins + rewardData.coins, xp: economy.xp + rewardData.xp, current_streak: rewardData.streak };
          setEconomy(newEconomy);
          addDebugLog('success', 'REWARD', 'Reward claimed successfully', { coins: rewardData.coins, xp: rewardData.xp, streak: rewardData.streak, newEconomy });
          showToast(`Daily Reward Claimed! +${rewardData.coins} Coins, +${rewardData.xp} XP`, 'success');
        } else {
          showToast('Reward data missing in response', 'error');
        }
      } else {
        addDebugLog('warning', 'REWARD', 'Edge Function returned error', result.error);
        showToast(result.error || 'Failed to claim reward', 'error');
      }
    } catch (error: any) {
      addDebugLog('error', 'REWARD', 'Exception during reward claim', { message: error.message, stack: error.stack });
      showToast('Failed to connect to server', 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    addDebugLog('info', 'NAVIGATION', 'Quick action clicked', { action });
    
    if (action === 'CelticCross') {
      const canProceed = await checkAndSpendEnergy('celtic_cross', 6);
      if (canProceed) onNavigate?.('celtic-cross');
      return;
    }
    if (action === 'Horseshoe') {
      const canProceed = await checkAndSpendEnergy('horseshoe', 4);
      if (canProceed) onNavigate?.('horseshoe');
      return;
    }
    if (action === 'Relationship') {
      const canProceed = await checkAndSpendEnergy('relationship', 5);
      if (canProceed) onNavigate?.('relationship');
      return;
    }
    if (action === '3Cards') {
      const canProceed = await checkAndSpendEnergy('three_card', 2);
      if (canProceed) onNavigate?.('three-card-reading');
      return;
    }

    if (onNavigate) {
      if (action === 'Tarot') onNavigate('card-fan');
      else if (action === 'Daily') onNavigate('daily-card');
      else if (action === 'Astrology') onNavigate('astro');
      else if (action === 'Cards') onNavigate('cards');
      else if (action === 'History') onNavigate('reading-history');
      else if (action === 'Horoscope') onNavigate('horoscope');
      else if (action === 'Admin') onNavigate('admin');
      else if (action === 'Subscription') onNavigate('subscription');
      else if (action === 'Services') onNavigate('services');
      else if (action === 'Stats') onNavigate('journal-stats');
    }
  };

  const quickActions = [
    { icon: <Sparkles size={28} />, label: t('home.quickAccess.daily'), sublabel: t('home.quickAccess.card'), color: '#C5A059', action: 'Daily' },
    { icon: <LayoutGrid size={28} />, label: t('home.quickAccess.threeCards'), sublabel: t('home.quickAccess.reading'), color: '#a78bfa', action: '3Cards' },
    { icon: <Moon size={28} />, label: t('home.quickAccess.tarot'), sublabel: t('home.quickAccess.draw'), color: '#60a5fa', action: 'Tarot' },
    { icon: <Hash size={28} />, label: t('home.quickAccess.cards'), sublabel: t('home.quickAccess.gallery'), color: '#fbbf24', action: 'Cards' },
    { icon: <Scroll size={28} />, label: t('home.quickAccess.history'), sublabel: t('home.quickAccess.readings'), color: '#34d399', action: 'History' },
    { icon: <TrendingUp size={28} />, label: 'Stats', sublabel: 'Journal', color: '#C5A059', action: 'Stats' },
    { icon: <Crown size={28} />, label: t('home.quickAccess.celtic'), sublabel: t('home.quickAccess.cross'), color: '#C5A059', action: 'CelticCross', isPremium: true },
    { icon: <span style={{ fontSize: '28px' }}>🐎</span>, label: t('home.quickAccess.horseshoe'), sublabel: t('home.quickAccess.sevenCards'), color: '#fb923c', action: 'Horseshoe', isPremium: true },
    { icon: <span style={{ fontSize: '28px' }}>❤️</span>, label: t('home.quickAccess.love'), sublabel: t('home.quickAccess.spread'), color: '#f472b6', action: 'Relationship', isPremium: true },
    { icon: <Sparkles size={28} />, label: t('home.quickAccess.horoscope'), sublabel: t('home.quickAccess.daily'), color: '#C5A059', action: 'Horoscope' },
    { icon: <Sparkles size={28} />, label: t('home.quickAccess.services'), sublabel: t('home.quickAccess.shop'), color: '#FFD700', action: 'Services', isServices: true },
  ];

  if (isUserAdmin) {
    quickActions.push({ icon: <Shield size={28} />, label: t('home.quickAccess.admin'), sublabel: t('home.quickAccess.panel'), color: '#ef4444', action: 'Admin' });
  }

  const dailyCardName = dailyCard?.name || 'THE FOOL';
  const dailyCardMeaning = isDailyReversed ? (dailyCard?.reversed_keywords?.[0] || 'Reflection') : (dailyCard?.keywords?.[0] || 'New Beginnings');
  const dailyCardElement = dailyCard ? getCardMeta(dailyCard) : '';
  const userLevelData = getLevelFromTotalXP(economy.xp);
  const xpPercent = Math.min((userLevelData.currentLevelXP / userLevelData.xpToNext) * 100, 100);
  const circumference = 2 * Math.PI * 22; 
  const strokeDashoffset = circumference - (xpPercent / 100) * circumference;

  // 🆕 STREAK TIER ICON CALCULATION
  const getStreakTierIcon = (): string => {
    const streak = currentStreak;
    if (streak >= 100) return '💎';
    if (streak >= 60) return '🏆';
    if (streak >= 30) return '👑';
    if (streak >= 14) return '⭐';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '🌱';
    return '🔥';
  };

  const getQuestIcon = (actionType: string): React.ReactNode => {
    switch (actionType) {
      case 'draw_daily_card': return <Scroll size={16} />;
      case 'check_horoscope': return <Sparkles size={16} />;
      case 'complete_reading': return <LayoutGrid size={16} />;
      case 'discover_card': return <Gem size={16} />;
      case 'maintain_streak': return <Flame size={16} />;
      case 'view_gallery': return <LayoutGrid size={16} />;
      default: return <Scroll size={16} />;
    }
  };

  return (
    <div className="home-screen">
      <AnimatePresence>
        {toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}
        {showLevelUpModal && <LevelUpModal level={leveledUpTo} onClose={() => setShowLevelUpModal(false)} t={t} />}
      </AnimatePresence>

      {/* 🆕 STREAK DANGER BANNER - CENTERED POPUP (FIXED) */}
      <AnimatePresence>
        {currentStreak > 0 && !isDailyRevealed && !streakBannerDismissed && (
          <>
            {/* Backdrop */}
            <motion.div
              key="streak-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 9997
              }}
              onClick={() => setStreakBannerDismissed(true)}
            />

            {/* ✅ Flex wrapper - საიმედო centering (არ ეჯახება framer-motion-ს) */}
            <div
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9998,
                pointerEvents: 'none',
                padding: '24px'
              }}
            >
              {/* Banner card */}
              <motion.div
                key="streak-banner"
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 20 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                style={{
                  pointerEvents: 'auto',
                  width: '100%',
                  maxWidth: '300px',
                  padding: '18px 16px',
                  background: 'linear-gradient(135deg, rgba(69, 10, 10, 0.98) 0%, rgba(124, 45, 18, 0.98) 100%)',
                  border: '2px solid rgba(239, 68, 68, 0.6)',
                  borderRadius: '16px',
                  boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(239, 68, 68, 0.3)',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* Close button */}
                <button
                  onClick={() => setStreakBannerDismissed(true)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '5px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={12} />
                </button>

                {/* Pulsing warning icon */}
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ fontSize: '36px', marginBottom: '8px' }}
                >
                  ⚠️
                </motion.div>

                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fca5a5', marginBottom: '4px', lineHeight: 1.3 }}>
                  Your {currentStreak}-day streak is in danger!
                </div>

                <div style={{ fontSize: '11px', color: '#fdba74', marginBottom: '14px', lineHeight: 1.4 }}>
                  Draw your card today to keep it alive 🔥
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setStreakBannerDismissed(true)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Later
                  </button>
                  <button
                    onClick={() => onNavigate?.('daily-card')}
                    style={{
                      flex: 2,
                      padding: '10px',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)'
                    }}
                  >
                    🔥 DRAW NOW
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ================================================================
          ✨ REDESIGNED USER HEADER - Perfect 52px Alignment
          Layout: 24px (top row) + 4px (gap) + 24px (bottom row) = 52px
          Avatar center line (26px) passes exactly through the gap
          ================================================================ */}
      <div className="user-header">
        <div className="user-main-row" style={{ alignItems: 'center', height: '52px', display: 'flex', justifyContent: 'space-between' }}>
          
          {/* 🎭 AVATAR - 52px reference element */}
          <div className="avatar-section clickable-avatar" onClick={() => onNavigate?.('profile')} style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
            <svg className="xp-circular-progress" width="52" height="52" viewBox="0 0 52 52" style={{ position: 'absolute', top: 0, left: 0 }}>
              <circle className="xp-circle-bg" cx="26" cy="26" r="22" fill="none" stroke="#e9d5ff" strokeWidth="4" />
              <circle className="xp-circle-progress" cx="26" cy="26" r="22" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} transform="rotate(-90 26 26)" />
            </svg>
            <div style={{ position: 'absolute', top: '6px', left: '6px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)', borderRadius: '50%', color: '#0f0c08', zIndex: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              {user?.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#0f0c08', borderRadius: '6px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', zIndex: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.4), 0 0 0 1.5px #1a1510', border: '1.5px solid #1a1510' }}>
              {userLevelData.level}
            </div>
            {activeSubscription && (
              <div style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', borderRadius: '6px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.4), 0 0 0 1.5px #1a1510', border: '1.5px solid #1a1510' }}>
                <Crown size={10} style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))' }} />
              </div>
            )}
          </div>
          
          {/* 📛 LEFT COLUMN: Username (24px, top) + Zodiac badge (24px, bottom)
              space-between creates the exact 4px gap (52 - 24 - 24 = 4) */}
          <div className="user-info-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '52px', marginLeft: '12px', flex: 1, minWidth: 0 }}>
            
            {/* Username - 24px height, aligned with avatar TOP edge */}
            <h2 className="username" style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: 700,
              height: '24px', 
              lineHeight: '24px',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {user?.display_name || 'LunaraSeeker'}
            </h2>
            
            {/* Zodiac badge - 24px height, aligned with avatar BOTTOM edge, elegant "♍ Virgo" only */}
            {user?.sun_sign ? (
              <div 
                className="zodiac-sign-badge" 
                onClick={() => onNavigate?.('profile')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  height: '24px',
                  boxSizing: 'border-box',
                  alignSelf: 'flex-start',
                  padding: '0 10px',
                  background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.15), rgba(197, 160, 89, 0.08))',
                  border: '1px solid rgba(197, 160, 89, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  maxWidth: '100%'
                }}
              >
                <span style={{ fontSize: '12px', lineHeight: 1, filter: 'drop-shadow(0 0 3px rgba(197, 160, 89, 0.6))', flexShrink: 0 }}>
                  {getZodiacSymbol(user.sun_sign)}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  lineHeight: 1,
                  color: '#C5A059', 
                  fontWeight: 600, 
                  letterSpacing: '0.5px',
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {user.sun_sign}
                </span>
              </div>
            ) : (
              <div 
                className="add-sign-badge" 
                onClick={() => onNavigate?.('sign-selection')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  height: '24px',
                  boxSizing: 'border-box',
                  alignSelf: 'flex-start',
                  padding: '0 10px',
                  background: 'rgba(197, 160, 89, 0.1)',
                  border: '1px dashed rgba(197, 160, 89, 0.4)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  color: '#b3a68c',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>✨</span>
                <span>Add your sign</span>
              </div>
            )}
          </div>
          
          {/* 💎⚡ RIGHT COLUMN: Diamonds (24px, top) + Energy (24px, bottom)
              space-between creates the exact 4px gap; avatar center line (26px)
              passes exactly through the middle of this gap */}
          <div className="user-resources" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '52px', flexShrink: 0 }}>
            
            {/* Diamonds badge - 24px height, aligned with avatar TOP edge */}
            <div className="resource gems" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px', 
              background: 'rgba(147, 112, 219, 0.15)', 
              padding: '0 8px', 
              borderRadius: '12px', 
              border: '1px solid rgba(147, 112, 219, 0.3)', 
              height: '24px',
              boxSizing: 'border-box'
            }}>
              <Gem size={12} className="resource-icon gem-icon" style={{ color: '#9370db', flexShrink: 0 }} />
              <span className="value" style={{ fontSize: '12px', fontWeight: '600', color: '#fff', textAlign: 'center' }}>{economy.cosmic_coins.toLocaleString()}</span>
              <button 
                className="add-btn" 
                onClick={() => setIsShopOpen(true)}
                style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(197, 160, 89, 0.3)', border: 'none', color: '#C5A059', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}
                title="Buy Diamonds"
              >
                +
              </button>
            </div>
            
            {/* Energy badge - 24px height, aligned with avatar BOTTOM edge */}
            <div className="resource energy" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px', 
              background: 'rgba(251, 191, 36, 0.15)', 
              padding: '0 8px', 
              borderRadius: '12px', 
              border: '1px solid rgba(251, 191, 36, 0.3)', 
              height: '24px',
              boxSizing: 'border-box'
            }}>
              <Zap size={12} className="resource-icon energy-icon" style={{ color: '#fbbf24', flexShrink: 0 }} />
              <span className="value" style={{ fontSize: '12px', fontWeight: '600', color: '#fff', textAlign: 'center' }}>
                {economy.cosmic_focus || 0}/{economy.max_focus || 20}
              </span>
              
              {(() => {
                const isEnergyFull = (economy.cosmic_focus || 0) >= (economy.max_focus || 20);
                const energyNeeded = (economy.max_focus || 20) - (economy.cosmic_focus || 0);
                const energyToAdd = Math.min(10, energyNeeded);
                const cost = energyToAdd * 5;
                
                return (
                  <button 
                    className="add-btn" 
                    onClick={handleRefillEnergy}
                    disabled={isClaiming || isEnergyFull}
                    style={{ 
                      width: '18px', height: '18px', borderRadius: '50%', 
                      background: (isClaiming || isEnergyFull) ? 'rgba(150,150,150,0.3)' : 'rgba(197, 160, 89, 0.3)', 
                      border: 'none', 
                      color: (isClaiming || isEnergyFull) ? '#666' : '#C5A059', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: (isClaiming || isEnergyFull) ? 'not-allowed' : 'pointer', 
                      fontSize: '12px', fontWeight: 'bold', flexShrink: 0 
                    }}
                    title={isEnergyFull ? "Energy is already full" : `Buy ${energyToAdd}⚡ Energy for ${cost} 💎`}
                  >
                    {isClaiming ? '...' : (isEnergyFull ? '✓' : '+')}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <div className="quests-and-actions-split" style={{ display: 'flex', flexDirection: 'row', gap: '2px', marginBottom: '2px', width: '100%', alignItems: 'stretch' }}>
        <div className="daily-quests-compact" style={{ flex: '0 0 60%', minWidth: 0, background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)', border: '1px solid #332a1a', borderRadius: '14px', padding: '8px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)', display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => setShowQuestModal(true)}>
          <div className="quests-header-compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', padding: '0 2px' }}>
            <h3 style={{ margin: 0, fontSize: '9px', color: '#C5A059', letterSpacing: '1px', fontWeight: 700, textTransform: 'uppercase' }}>{t('home.dailyQuests')}</h3>
            <span style={{ fontSize: '9px', color: '#b3a68c', fontFamily: 'monospace' }}>{timeLeft}</span>
          </div>
          <div className="quest-list-compact" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, justifyContent: 'center' }}>
            {questsLoading ? (
              <div style={{ textAlign: 'center', color: '#b3a68c', fontSize: '9px', padding: '10px' }}>{t('home.loading')}</div>
            ) : dailyQuests.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#b3a68c', fontSize: '9px', padding: '10px' }}>{t('home.noQuests')}</div>
            ) : activeDailyQuest ? (
              <div className="quest-item-compact" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 6px', background: activeDailyQuest.isClaimable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(197, 160, 89, 0.05)', borderRadius: '6px', border: `1px solid ${activeDailyQuest.isClaimable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(197, 160, 89, 0.08)'}` }}>
                <div className="quest-icon-compact" style={{ color: activeDailyQuest.isClaimable ? '#10b981' : '#C5A059', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
                  {getQuestIcon(activeDailyQuest.quest?.action_type || '')}
                </div>
                <div className="quest-info-compact" style={{ flex: 1, minWidth: 0 }}>
                  <span className="quest-name-compact" style={{ fontSize: '9px', color: '#fff', fontWeight: 500, display: 'block', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeDailyQuest.quest?.title || t('home.quest')}
                  </span>
                  <div className="quest-progress-compact" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div className="progress-bar-compact" style={{ flex: 1, height: '3px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div className="progress-fill-compact" style={{ width: `${Math.min((activeDailyQuest.current_progress / (activeDailyQuest.quest?.target_count || 1)) * 100, 100)}%`, height: '100%', background: activeDailyQuest.isClaimable ? '#10b981' : 'linear-gradient(90deg, #C5A059, #ffe566)', borderRadius: '2px', boxShadow: '0 0 4px rgba(197, 160, 89, 0.5)' }}></div>
                    </div>
                    <span style={{ fontSize: '8px', color: '#b3a68c', minWidth: '18px' }}>{activeDailyQuest.current_progress}/{activeDailyQuest.quest?.target_count}</span>
                  </div>
                </div>
                <div className="quest-reward-compact" style={{ fontSize: '9px', color: activeDailyQuest.isClaimable ? '#10b981' : '#C5A059', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0 }}>
                  {activeDailyQuest.isClaimable ? (
                    <button onClick={(e) => { e.stopPropagation(); handleClaimQuest(activeDailyQuest); }} disabled={isClaimingQuest} style={{ background: '#10b981', border: 'none', borderRadius: '4px', color: '#fff', padding: '2px 6px', fontSize: '8px', fontWeight: 'bold', cursor: isClaimingQuest ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {isClaimingQuest ? <RefreshCw size={10} className="spin" /> : t('home.claim')}
                    </button>
                  ) : (
                    <><Gem size={9} /> +{activeDailyQuest.quest?.reward_coins}</>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#10b981', fontSize: '9px', padding: '10px' }}>{t('home.allComplete')}</div>
            )}
          </div>
        </div>

        <div className="action-buttons-panel" style={{ flex: '0 0 calc(40% - 2px)', minWidth: 0, background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)', border: '1px solid #332a1a', borderRadius: '14px', padding: '6px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)', display: 'flex' }}>
          <div className="action-grid-vertical" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px', width: '100%', height: '100%' }}>
            <button className={`action-btn-vertical ${rewardClaimed ? 'claimed' : ''}`} onClick={handleClaimReward} disabled={rewardClaimed || isClaiming} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(197, 160, 89, 0.15)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: (rewardClaimed || isClaiming) ? 'not-allowed' : 'pointer', position: 'relative', overflow: 'hidden', padding: '4px', width: '100%', height: '100%', opacity: (rewardClaimed || isClaiming) ? 0.7 : 1 }}>
              {isClaiming ? (
                <svg className="animate-spin" style={{ width: '20px', height: '20px', color: '#C5A059' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Gift size={22} style={{ filter: 'drop-shadow(0 0 6px #C5A059)', color: '#C5A059', width: '20px', height: '20px' }} />
              )}
              {!rewardClaimed && !isClaiming && <div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(197, 160, 89, 0.9)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>50</div>}
            </button>
            
            {/* 🆕 UPDATED STREAK BUTTON with tier icon + unclaimed badge */}
            <button 
              className="action-btn-vertical streak-btn-v" 
              onClick={() => setShowStreakModal(true)}
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: unclaimedMilestoneCount > 0 ? '1.5px solid rgba(251, 191, 36, 0.6)' : '1px solid rgba(197, 160, 89, 0.15)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'visible', padding: '4px', width: '100%', height: '100%' }}
            >
              <div style={{ fontSize: '22px', lineHeight: 1, filter: 'drop-shadow(0 0 6px #ff6b35)' }}>
                {getStreakTierIcon()}
              </div>
              <div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(197, 160, 89, 0.9)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>{currentStreak}</div>
              
              {/* Unclaimed milestone indicator */}
              {unclaimedMilestoneCount > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 5px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.6)',
                    border: '1.5px solid #1a1510',
                    zIndex: 5
                  }}
                >
                  🎁 {unclaimedMilestoneCount}
                </motion.div>
              )}
            </button>
            
            <button 
              className="action-btn-vertical rank-btn-v" 
              onClick={() => setShowLeaderboardModal(true)}
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(197, 160, 89, 0.15)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', padding: '4px', width: '100%', height: '100%' }}
            >
              <Trophy size={22} style={{ filter: 'drop-shadow(0 0 6px #ffd700)', color: '#ffd700', width: '20px', height: '20px' }} />
              <div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(197, 160, 89, 0.9)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>TOP</div>
            </button>
            
            <button className={`action-btn-vertical ${activeSubscription ? 'subscription-btn-v' : 'upgrade-btn-v'}`} onClick={() => onNavigate && onNavigate(activeSubscription ? 'subscription' : 'pricing')} style={{ background: activeSubscription ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)' : 'rgba(255, 255, 255, 0.03)', border: activeSubscription ? '1px solid rgba(255, 215, 0, 0.4)' : '1px solid rgba(197, 160, 89, 0.15)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', padding: '4px', width: '100%', height: '100%' }}>
              {activeSubscription ? (
                <><InfinityIcon size={22} style={{ filter: 'drop-shadow(0 0 6px #FFD700)', color: '#FFD700', width: '20px', height: '20px' }} /><div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>VIP</div></>
              ) : (
                <><Crown size={22} style={{ filter: 'drop-shadow(0 0 6px #a78bfa)', color: '#a78bfa', width: '20px', height: '20px' }} /><div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(197, 160, 89, 0.9)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>PRO</div></>
              )}
            </button>
          </div>
        </div>
      </div>

      {showQuestModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowQuestModal(false)}>
          <div style={{ background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)', border: '1px solid #332a1a', borderRadius: '16px', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#C5A059', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={18} /> {t('home.questModal.title')}
              </h3>
              <button onClick={() => setShowQuestModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              {dailyQuests.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>{t('home.questModal.noQuests')}</div>
              ) : (
                dailyQuests.map((q, idx) => (
                  <div key={q.id} style={{ background: q.is_claimed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${q.is_claimed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', padding: '12px', marginBottom: idx < dailyQuests.length - 1 ? '12px' : '0', opacity: q.is_claimed ? 0.7 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: q.isClaimable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(197, 160, 89, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: q.isClaimable ? '#10b981' : '#C5A059' }}>
                          {getQuestIcon(q.quest?.action_type || '')}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{q.quest?.title}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>{q.quest?.description}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Gem size={12} /> +{q.quest?.reward_coins}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min((q.current_progress / (q.quest?.target_count || 1)) * 100, 100)}%`, height: '100%', background: q.isClaimable ? '#10b981' : 'linear-gradient(90deg, #C5A059, #ffe566)', borderRadius: '2px' }}></div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#b3a68c', minWidth: '30px', textAlign: 'right' }}>{q.current_progress}/{q.quest?.target_count}</span>
                    </div>
                    {q.isClaimable && (
                      <button onClick={() => handleClaimQuest(q)} disabled={isClaimingQuest} style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '8px', color: '#fff', padding: '8px', fontSize: '12px', fontWeight: 'bold', cursor: isClaimingQuest ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {isClaimingQuest ? <RefreshCw size={14} className="spin" /> : <><CheckCircle size={14} /> {t('home.questModal.claimReward')}</>}
                      </button>
                    )}
                    {q.is_claimed && (
                      <div style={{ width: '100%', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <CheckCircle size={14} /> {t('home.questModal.completed')}
                      </div>
                    )}
                  </div>
                ))
              )}
              {dailyQuests.length > 0 && dailyQuests.every(q => q.is_claimed) && (
                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', marginTop: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}>{t('home.questModal.allCompleteTitle')}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('home.questModal.comeBack', { time: timeLeft })}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <motion.div 
        className="card-of-day-banner clickable-card" 
        onClick={() => onNavigate && onNavigate('daily-card')} 
        style={{ 
          background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)', 
          border: '1px solid #332a1a', 
          borderRadius: '16px', 
          padding: '12px', 
          marginBottom: '2px', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)', 
          position: 'relative', 
          overflow: 'visible', 
          cursor: 'pointer' 
        }}
      >
        <div className="card-of-day-content" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0' }}>
          <div className="card-half-left" style={{ flex: '0 0 45%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
            
            <motion.div 
              className="card-image-3d-wrapper" 
              animate={!isDailyRevealed ? { y: [0, -5, 0] } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: 'relative', width: 'clamp(110px, 28vw, 140px)', aspectRatio: '2/3', perspective: '800px', margin: '-16px 0' }}
            >
              <div className="card-image-tilted" style={{ position: 'relative', width: '100%', height: '100%', transform: 'rotateY(-5deg) rotateX(2deg) rotate(3deg)', transition: 'transform 0.4s ease', zIndex: 2, transformStyle: 'preserve-3d' }}>
                
                {!isDailyRevealed ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '8px', border: '2px solid #C5A059', boxShadow: '0 2px 4px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.5), 0 16px 32px rgba(0,0,0,0.6), 0 0 20px rgba(197,160,89,0.3)', overflow: 'hidden' }}>
                    <img 
                      src={CARD_BACK_URL} 
                      alt="Card Back" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                    />
                    <motion.div
                      animate={{ x: ['-150%', '150%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                      style={{
                        position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
                        transform: 'skewX(-20deg)', pointerEvents: 'none'
                      }}
                    />
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      background: 'rgba(10, 8, 20, 0.7)', backdropFilter: 'blur(4px)',
                      padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(197, 160, 89, 0.6)',
                      color: '#C5A059', fontSize: '11px', fontWeight: '700', letterSpacing: '2px',
                      textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                      TAP
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '8px', border: '2px solid #C5A059', boxShadow: '0 2px 4px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.5), 0 16px 32px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
                    <img 
                      src={dailyCard?.image_url} 
                      alt={dailyCardName} 
                      style={{ 
                        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                        filter: 'grayscale(30%) opacity(0.85)',
                        transform: isDailyReversed ? 'rotate(180deg)' : 'rotate(0deg)'
                      }} 
                    />
                  </div>
                )}
                
                {isDailyReversed && isDailyRevealed && (
                  <div className="card-reversed-indicator-large" style={{ position: 'absolute', top: '5px', right: '5px', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900, zIndex: 3, background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', color: '#fff', border: '2px solid #fff', boxShadow: '0 0 0 2px rgba(167,139,250,0.5), 0 4px 12px rgba(167,139,250,0.8), 0 0 20px rgba(167,139,250,0.6)' }}>
                    <span>R</span>
                  </div>
                )}
              </div>
              <div className="card-3d-shadow" style={{ position: 'absolute', bottom: '-6px', left: '10%', width: '80%', height: '14px', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)', filter: 'blur(6px)', zIndex: 1, opacity: 0.7 }}></div>
            </motion.div>
          </div>
          
          <div className="card-half-right" style={{ flex: '0 0 55%', paddingLeft: '12px', display: 'flex', alignItems: 'center' }}>
            <div className="card-info-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', width: '100%', minWidth: 0 }}>
              {!isDailyRevealed ? (
                <>
                  <div style={{ fontSize: '9px', color: '#C5A059', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.7, fontWeight: 600 }}>{t('home.cardOfTheDay')}</div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#C5A059', letterSpacing: '0.5px', fontWeight: 700, lineHeight: 1.2 }}>Your Card Awaits</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 1.3 }}>Tap to reveal your daily guidance</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '9px', color: '#C5A059', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.7, fontWeight: 600 }}>{t('home.cardOfTheDay')}</div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#C5A059', letterSpacing: '0.5px', fontWeight: 700, lineHeight: 1.2 }}>{dailyCardName}{isDailyReversed ? ' (R)' : ''}</h3>
                  <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 1.3 }}>"{dailyCardMeaning}"</p>
                  {dailyCardElement && <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>{dailyCardElement}</p>}
                  <button className="read-guidance-btn" onClick={(e) => { e.stopPropagation(); onNavigate?.('reading-history'); }} style={{ background: 'transparent', border: '1px solid #C5A059', color: '#C5A059', padding: '5px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', alignSelf: 'flex-start' }}>
                    View Journal <ChevronRight size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="quick-access" style={{ marginBottom: '8px', width: '100%' }}>
        <div className="quick-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {quickActions.map((action, index) => (
            <button key={index} className={`quick-item ${action.isPremium ? 'premium-item' : ''} ${action.action === 'Admin' ? 'admin-item' : ''} ${(action as any).isServices ? 'services-item' : ''}`} style={{ '--glow-color': action.color, background: action.isPremium ? 'linear-gradient(135deg, rgba(197, 160, 89, 0.15) 0%, rgba(139, 105, 20, 0.1) 100%)' : (action as any).isServices ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.08) 100%)' : '#1a1510', border: action.isPremium ? '1px solid rgba(197, 160, 89, 0.4)' : (action as any).isServices ? '1px solid rgba(255, 215, 0, 0.4)' : '1px solid #2a2215', borderRadius: '12px', padding: 'clamp(8px, 2.5vw, 12px) 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#fff', cursor: 'pointer', position: 'relative', overflow: 'hidden' } as React.CSSProperties} onClick={() => handleQuickAction(action.action)}>
              {action.isPremium && <div style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', boxShadow: '0 2px 8px rgba(197, 160, 89, 0.5)', zIndex: 10 }}>💎</div>}
              {(action as any).isServices && <div style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', boxShadow: '0 2px 8px rgba(255, 215, 0, 0.5)', zIndex: 10, animation: 'paywallPulse 2s ease-in-out infinite' }}>🛍️</div>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, filter: `drop-shadow(0 0 6px ${action.color})`, color: action.color }}>{action.icon}</div>
              <span style={{ fontSize: '10px', color: '#fff', fontWeight: 600, textAlign: 'center', lineHeight: 1.1 }}>{action.label}</span>
              {action.sublabel && <span style={{ fontSize: '9px', color: '#b3a68c', textAlign: 'center', lineHeight: 1.1 }}>{action.sublabel}</span>}
            </button>
          ))}
        </div>
      </div>

      {isShopOpen && user && (
        <DiamondShopModal 
          isOpen={isShopOpen} 
          onClose={() => setIsShopOpen(false)} 
          userId={user.id}
          isAdmin={isUserAdmin}
          onSuccess={() => {
            setIsShopOpen(false);
            showToast('Diamonds successfully added!', 'success');
            reloadFromDatabase();
          }}
        />
      )}

      {/* 🆕 UPDATED STREAK MODAL with new props */}
      <StreakModal 
        isOpen={showStreakModal} 
        onClose={() => setShowStreakModal(false)} 
        currentStreak={currentStreak}
        onMilestoneClaimed={handleMilestoneClaimed}
      />

      {user && (
        <LeaderboardModal 
          isOpen={showLeaderboardModal} 
          onClose={() => setShowLeaderboardModal(false)} 
          currentUserId={user.id}
          isAdmin={isUserAdmin}
        />
      )}

      {isUserAdmin && (
        <DebugPanel
          showDebug={showDebug}
          setShowDebug={setShowDebug}
          user={user}
          economy={economy}
          dbDebugInfo={dbDebugInfo}
          debugLogs={debugLogs}
          dbStatus={dbStatus}
          activeSubscription={activeSubscription}
          questsLoading={questsLoading}
          dailyQuests={dailyQuests}
          activeDailyQuest={activeDailyQuest}
          isClaimingQuest={isClaimingQuest}
          timeLeft={timeLeft}
          showQuestModal={showQuestModal}
          rewardClaimed={rewardClaimed}
          isClaiming={isClaiming}
          currentStreak={currentStreak}
          setDebugLogs={setDebugLogs}
          checkDatabaseStatus={checkDatabaseStatus}
          refreshUserDataDebug={refreshUserDataDebug}
          handleLogoutAndReset={handleLogoutAndReset}
          testAddCoins={testAddCoins}
          testAddXP={testAddXP}
          testAddEnergy={testAddEnergy}
          testSpendEnergy={testSpendEnergy}
          testCompleteQuest={testCompleteQuest}
          reloadFromDatabase={reloadFromDatabase}
          testAddXPWithLevel={testAddXPWithLevel}
          forceRecalcLevel={forceRecalcLevel}
          xpTestLogs={xpTestLogs}
        />
      )}
    </div>
  );
}