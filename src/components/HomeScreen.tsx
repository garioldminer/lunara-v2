import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useUser } from '../context/UserContext';
import { tarotCards, SUITS } from '../data/tarotCards';
import { isAdmin } from '../lib/adminService';
import { getActiveSubscription } from '../lib/subscriptionService';
import { supabase } from '../lib/supabase';
import { getTelegramUser } from '../lib/telegramAuth';
import { getOrCreateUser } from '../lib/userService';
import { loadUserQuests, trackQuestProgress, type QuestProgress } from '../lib/questService';
import { 
  Gem, Zap, Trophy, Flame, Bug, CheckCircle, XCircle,
  Sparkles, LayoutGrid, Moon, Hash, 
  Crown, Scroll, ChevronRight, Gift, Shield, Infinity,
  RefreshCw, Copy, LogOut, X
} from 'lucide-react';
import './HomeScreen.css';

// 🆕 ექსპონენციალური ლეველის ლოგიკა
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

// 🆕 Toast Notification Component - ახლა ცენტრშია და აქვს X ღილაკი
interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000); // 4 წამი
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10003,
        background: toast.type === 'success' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.98), rgba(5, 150, 105, 0.98))' : 
                    toast.type === 'error' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.98), rgba(220, 38, 38, 0.98))' : 
                    'linear-gradient(135deg, rgba(59, 130, 246, 0.98), rgba(37, 99, 235, 0.98))',
        color: '#fff',
        padding: '20px 28px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        fontSize: '15px',
        fontWeight: '600',
        minWidth: '320px',
        maxWidth: '90vw',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <span style={{ fontSize: '22px' }}>
        {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
      </span>
      <span style={{ flex: 1, textAlign: 'center' }}>{toast.message}</span>
      <button 
        onClick={onClose} 
        style={{ 
          background: 'rgba(255,255,255,0.15)', 
          border: 'none', 
          borderRadius: '8px', 
          width: '28px', 
          height: '28px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          transition: 'all 0.2s'
        }}
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

// 🆕 Level Up Modal Component
function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 10002,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        style={{
          background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
          border: '2px solid #fbbf24',
          borderRadius: '24px',
          padding: '32px 24px',
          textAlign: 'center',
          maxWidth: '320px',
          width: '100%',
          boxShadow: '0 0 50px rgba(251, 191, 36, 0.4)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px', filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))' }}>🎉</div>
        <h2 style={{ color: '#fbbf24', fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px' }}>LEVEL UP!</h2>
        <p style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '24px', lineHeight: '1.5' }}>
          Congratulations!<br/>
          You reached <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '20px' }}>Level {level}</span>
        </p>
        <button 
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #fbbf24, #d97706)',
            color: '#0f0c08',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            width: '100%',
            boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)'
          }}
        >
          Awesome!
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
  const { user, setUser } = useUser();
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [timeLeft, setTimeLeft] = useState('14:32:18');
  const [dailyCard, setDailyCard] = useState<typeof tarotCards[0] | null>(null);
  const [isDailyReversed, setIsDailyReversed] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  
  const [economy, setEconomy] = useState<EconomyData>({
    cosmic_coins: 0,
    xp: 0,
    level: 1,
    current_streak: 0
  });

  const [questsLoading, setQuestsLoading] = useState(true);
  
  const [dailyQuests, setDailyQuests] = useState<DailyQuestDisplay[]>([]);
  const [activeDailyQuest, setActiveDailyQuest] = useState<DailyQuestDisplay | null>(null);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [isClaimingQuest, setIsClaimingQuest] = useState(false);

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [leveledUpTo, setLeveledUpTo] = useState<number>(1);
  
  const [toast, setToast] = useState<Toast | null>(null);

  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [economyLoadStatus, setEconomyLoadStatus] = useState<'pending' | 'loading' | 'success' | 'error'>('pending');
  const [lastDbQuery, setLastDbQuery] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [dbDebugInfo, setDbDebugInfo] = useState<DatabaseDebugInfo>({
    lastQuery: null,
    lastResponse: null,
    economyData: null,
    queryHistory: []
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const addDebugLog = (type: DebugLog['type'], category: string, message: string, data?: any) => {
    const log: DebugLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type,
      category,
      message,
      data
    };
    setDebugLogs(prev => [log, ...prev].slice(0, 50));
  };

  const addToDbDebugHistory = (table: string, operation: string, params: any, result: any, error?: any) => {
    const historyEntry = {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      table,
      operation,
      params,
      result,
      error
    };
    setDbDebugInfo(prev => ({
      ...prev,
      lastQuery: { table, operation, params },
      lastResponse: result || error,
      queryHistory: [historyEntry, ...prev.queryHistory].slice(0, 20)
    }));
  };

  const copyAllDebugInfo = async () => {
    const debugText = `
🔧 LUNARA DEBUG REPORT
📅 ${new Date().toLocaleString()}

👤 USER INFO:
   ID: ${user?.id || 'N/A'}
   Name: ${user?.display_name || 'N/A'}

💰 ECONOMY STATE:
   Coins: ${economy.cosmic_coins}
   XP: ${economy.xp}
   Level: ${economy.level}
   Streak: ${currentStreak}

📊 STATUS:
   Database: ${dbStatus.toUpperCase()}
   Economy Load: ${economyLoadStatus.toUpperCase()}

🗄️ LAST DB QUERY:
   Table: ${lastDbQuery?.table || 'N/A'}
   User ID: ${lastDbQuery?.userId || 'N/A'}

📝 LOGS (${debugLogs.length} total):
${debugLogs.slice(0, 20).map(log => `
[${log.timestamp}] ${log.category.toUpperCase()} (${log.type})
   ${log.message}
   ${log.data ? JSON.stringify(log.data, null, 2) : ''}
`).join('\n')}

---
End of Debug Report
`.trim();

    try {
      await navigator.clipboard.writeText(debugText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const checkDatabaseStatus = async () => {
    addDebugLog('info', 'DB_CHECK', '🔍 Starting database status check...');
    if (!user || !supabase) {
      addDebugLog('error', 'DB_CHECK', '❌ No user or supabase client available');
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, display_name, telegram_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        addDebugLog('error', 'DB_CHECK', `❌ Error fetching user: ${userError.message}`);
      } else {
        addDebugLog('success', 'DB_CHECK', '✅ User found in database', userData);
      }

      const { data: economyData, error: economyError } = await supabase
        .from('user_economy')
        .select('cosmic_coins, xp, level')
        .eq('user_id', user.id)
        .single();

      if (economyError) {
        addDebugLog('error', 'DB_CHECK', `❌ Error fetching economy: ${economyError.message}`);
      } else {
        addDebugLog('success', 'DB_CHECK', '✅ Economy record found', economyData);
      }

      const { data: questsData, error: questsError } = await supabase
        .rpc('get_user_quests', { p_user_id: user.id });

      if (questsError) {
        addDebugLog('error', 'DB_CHECK', `❌ Error calling get_user_quests RPC: ${questsError.message}`);
      } else {
        addDebugLog('success', 'DB_CHECK', `✅ get_user_quests RPC works. Found ${questsData?.length || 0} quests.`);
      }

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
      setEconomy({ cosmic_coins: 0, xp: 0, level: 1, current_streak: 0 });
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

  const testEconomyInitialization = async () => {
    if (!user || !supabase) {
      addDebugLog('error', 'TEST', 'No user or supabase available for test');
      return;
    }
    addDebugLog('info', 'TEST', 'Starting manual economy initialization test...');
    try {
      await supabase.from('user_economy').delete().eq('user_id', user.id);
      addDebugLog('info', 'TEST', 'Existing record deleted for testing.');

      const { error: fetchError } = await supabase.from('user_economy').select('user_id').eq('user_id', user.id).single();

      if (fetchError && fetchError.code === 'PGRST116') {
        addDebugLog('warning', 'TEST', 'No record found (PGRST116). Creating new one...');
        const { error: insertError } = await supabase.from('user_economy').insert({
          user_id: user.id, cosmic_coins: 0, xp: 0, level: 1, cosmic_focus: 3, max_focus: 3,
          current_streak: 0, longest_streak: 0, last_active_date: new Date().toISOString().split('T')[0], last_daily_claim: null
        });

        if (insertError) throw new Error(insertError.message);
        addDebugLog('success', 'TEST', '✅ SUCCESS: New economy record created automatically!');
        setEconomy({ cosmic_coins: 0, xp: 0, level: 1, current_streak: 0 });
        setDbStatus('connected');
        setEconomyLoadStatus('success');
      }
    } catch (err: any) {
      addDebugLog('error', 'TEST', `❌ FAILED: ${err.message}`);
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
    setEconomyLoadStatus('pending');
    if (user && supabase) {
      const { data, error } = await supabase.from('user_economy').select('cosmic_coins, xp, level, current_streak, cosmic_focus, max_focus').eq('user_id', user.id).single();
      if (!error && data) {
        const levelData = getLevelFromTotalXP(data.xp || 0);
        setEconomy({ 
          cosmic_coins: data.cosmic_coins || 0, 
          xp: data.xp || 0, 
          level: levelData.level, 
          current_streak: data.current_streak || 0 
        });
        setCurrentStreak(data.current_streak || 0);
        setDbDebugInfo(prev => ({ ...prev, economyData: data }));
        addDebugLog('success', 'DB', '✅ Data reloaded successfully');
      }
    }
    setEconomyLoadStatus('success');
  };

  const loadQuests = async () => {
    if (!user) return;
    setQuestsLoading(true);
    const quests = await loadUserQuests(user.id);
    
    const dQuests = quests.filter(q => q.quest?.quest_type === 'daily') as DailyQuestDisplay[];
    
    const processedQuests = dQuests.map(q => ({
      ...q,
      isClaimable: q.is_completed && !q.is_claimed
    }));
    
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
      const { data, error } = await supabase.rpc('claim_quest_reward', {
        p_user_id: user.id,
        p_quest_id: quest.quest_id
      });
      
      if (error || !data?.success) {
        addDebugLog('error', 'QUEST_CLAIM', `Failed: ${error?.message || data?.error}`);
        showToast(data?.error || 'Failed to claim reward', 'error');
      } else {
        addDebugLog('success', 'QUEST_CLAIM', `Claimed! +${data.reward.coins} coins, +${data.reward.xp} XP`);
        
        const currentTotalXP = user.xp || 0;
        const newTotalXP = currentTotalXP + data.reward.xp;
        
        const oldLevelData = getLevelFromTotalXP(currentTotalXP);
        const newLevelData = getLevelFromTotalXP(newTotalXP);
        
        setEconomy(prev => ({
          ...prev,
          cosmic_coins: prev.cosmic_coins + data.reward.coins,
          xp: newTotalXP,
          level: newLevelData.level
        }));

        // 🎉 LEVEL UP EFFECT
        if (newLevelData.level > oldLevelData.level) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#f59e0b', '#ffffff', '#10b981']
          });
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

  useEffect(() => {
    if (user) {
      addDebugLog('info', 'USER', 'User loaded', { userId: user.id, displayName: user.display_name });
      isAdmin(user.id).then(admin => {
        setIsUserAdmin(admin);
        addDebugLog('success', 'ADMIN', 'Admin check completed', { isAdmin: admin });
      }).catch(err => addDebugLog('error', 'ADMIN', `Admin check failed: ${err.message}`));
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
    if (user) {
      loadQuests();
    }
  }, [user]);

  useEffect(() => {
    const loadEconomy = async () => {
      if (!user) {
        addDebugLog('warning', 'ECONOMY', 'Cannot load economy - no user');
        setEconomyLoadStatus('pending');
        return;
      }
      if (!supabase) {
        addDebugLog('error', 'ECONOMY', 'Supabase client is null');
        setEconomyLoadStatus('error');
        return;
      }

      setEconomyLoadStatus('loading');
      setDbStatus('connecting');
      addDebugLog('info', 'ECONOMY', '📡 Starting economy data load', { userId: user.id });

      try {
        const queryParams = { table: 'user_economy', columns: 'cosmic_coins, xp, level, current_streak, cosmic_focus, max_focus', userId: user.id };
        setLastDbQuery(queryParams);
        addToDbDebugHistory('user_economy', 'SELECT', queryParams, 'PENDING');

        const { data, error } = await supabase.from('user_economy').select('cosmic_coins, xp, level, current_streak, cosmic_focus, max_focus').eq('user_id', user.id).single();

        if (error) {
          setDbStatus('error');
          setEconomyLoadStatus('error');
          addToDbDebugHistory('user_economy', 'SELECT', queryParams, null, error);
          addDebugLog('error', 'ECONOMY', '❌ Database query failed', { error: error.message, code: error.code, details: error.details });
          return;
        }

        setDbStatus('connected');
        setEconomyLoadStatus('success');
        addToDbDebugHistory('user_economy', 'SELECT', queryParams, data);
        setDbDebugInfo(prev => ({ ...prev, economyData: data }));
        addDebugLog('success', 'ECONOMY', '✅ Economy data loaded successfully', data);

        if (data) {
          const levelData = getLevelFromTotalXP(data.xp || 0);
          const economyData = { 
            cosmic_coins: data.cosmic_coins || 0, 
            xp: data.xp || 0, 
            level: levelData.level, 
            current_streak: data.current_streak || 0 
          };
          setEconomy(economyData);
          setCurrentStreak(economyData.current_streak);
          addDebugLog('info', 'STATE', '💰 Economy state updated', economyData);
        } else {
          addDebugLog('warning', 'ECONOMY', '⚠️ No economy data found for user');
        }
      } catch (error: any) {
        setDbStatus('error');
        setEconomyLoadStatus('error');
        addDebugLog('error', 'ECONOMY', '💥 Exception during economy load', { message: error.message, stack: error.stack });
      }
    };
    loadEconomy();
  }, [user]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('dailyCard');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        setDailyCard(parsed.card);
        setIsDailyReversed(parsed.isReversed);
        addDebugLog('info', 'DAILY_CARD', 'Loaded from localStorage', parsed);
        return;
      }
    }
    const dayOfYear = getDayOfYear(new Date());
    const cardIndex = dayOfYear % tarotCards.length;
    const card = tarotCards[cardIndex];
    const isReversed = Math.random() < 0.5;
    const newReading = { card, isReversed, date: today };
    localStorage.setItem('dailyCard', JSON.stringify(newReading));
    setDailyCard(card);
    setIsDailyReversed(isReversed);
    addDebugLog('info', 'DAILY_CARD', 'Generated new daily card', { cardName: card.name, isReversed });
  }, []);

  const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id },
        body: JSON.stringify({})
      });
      addDebugLog('info', 'REWARD', 'Edge Function response received', { status: response.status, statusText: response.statusText });
      const result = await response.json();
      addDebugLog('info', 'REWARD', 'Response parsed', result);
      
      if (result.success) {
        setRewardClaimed(true);
        const rewardData = result.data?.reward || result.reward;
        
        if (rewardData) {
          setCurrentStreak(rewardData.streak);
          const newEconomy = { 
            ...economy, 
            cosmic_coins: economy.cosmic_coins + rewardData.coins, 
            xp: economy.xp + rewardData.xp, 
            current_streak: rewardData.streak 
          };
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

  const handleQuickAction = (action: string) => {
    addDebugLog('info', 'NAVIGATION', 'Quick action clicked', { action });
    if (onNavigate) {
      if (action === 'Tarot') onNavigate('card-fan');
      else if (action === 'Daily') onNavigate('daily-card');
      else if (action === '3Cards') onNavigate('three-card-reading');
      else if (action === 'Astrology') onNavigate('astro');
      else if (action === 'Cards') onNavigate('cards');
      else if (action === 'History') onNavigate('reading-history');
      else if (action === 'CelticCross') onNavigate('celtic-cross');
      else if (action === 'Horseshoe') onNavigate('horseshoe');
      else if (action === 'Relationship') onNavigate('relationship');
      else if (action === 'Horoscope') onNavigate('horoscope');
      else if (action === 'Admin') onNavigate('admin');
      else if (action === 'Subscription') onNavigate('subscription');
      else if (action === 'Services') onNavigate('services');
    }
  };

  const quickActions = [
    { icon: <Sparkles size={28} />, label: 'Daily', sublabel: 'Card', color: '#C5A059', action: 'Daily' },
    { icon: <LayoutGrid size={28} />, label: '3 Cards', sublabel: 'Reading', color: '#a78bfa', action: '3Cards' },
    { icon: <Moon size={28} />, label: 'Tarot', sublabel: 'Draw', color: '#60a5fa', action: 'Tarot' },
    { icon: <Hash size={28} />, label: 'Cards', sublabel: 'Gallery', color: '#fbbf24', action: 'Cards' },
    { icon: <Scroll size={28} />, label: 'History', sublabel: 'Readings', color: '#34d399', action: 'History' },
    { icon: <Crown size={28} />, label: 'Celtic', sublabel: 'Cross', color: '#C5A059', action: 'CelticCross', isPremium: true },
    { icon: <span style={{ fontSize: '28px' }}>🐎</span>, label: 'Horseshoe', sublabel: '7 Cards', color: '#fb923c', action: 'Horseshoe', isPremium: true },
    { icon: <span style={{ fontSize: '28px' }}>❤️</span>, label: 'Love', sublabel: 'Spread', color: '#f472b6', action: 'Relationship', isPremium: true },
    { icon: <Sparkles size={28} />, label: 'Horoscope', sublabel: 'Daily', color: '#C5A059', action: 'Horoscope' },
    { icon: <Sparkles size={28} />, label: 'Services', sublabel: 'Shop', color: '#FFD700', action: 'Services', isServices: true },
  ];

  if (isUserAdmin) {
    quickActions.push({ icon: <Shield size={28} />, label: 'Admin', sublabel: 'Panel', color: '#ef4444', action: 'Admin' });
  }

  const dailyCardName = dailyCard?.name || 'THE FOOL';
  const dailyCardNumber = dailyCard?.number || '0';
  const dailyCardMeaning = isDailyReversed ? (dailyCard?.reversed_keywords?.[0] || 'Reflection') : (dailyCard?.keywords?.[0] || 'New Beginnings');
  const dailyCardElement = dailyCard ? getCardMeta(dailyCard) : '';

  const userLevelData = getLevelFromTotalXP(economy.xp);
  const xpPercent = Math.min((userLevelData.currentLevelXP / userLevelData.xpToNext) * 100, 100);
  const circumference = 2 * Math.PI * 22; // 🆕 განახლებული რადიუსისთვის (r=22)
  const strokeDashoffset = circumference - (xpPercent / 100) * circumference;

  const getQuestIcon = (actionType: string) => {
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
        {showLevelUpModal && <LevelUpModal level={leveledUpTo} onClose={() => setShowLevelUpModal(false)} />}
      </AnimatePresence>

      <div className="user-header">
        {/* 🆕 იდეალური გასწორება: ზედა და ქვედა კიდეები, მთლიანი ბარათი 48px სიმაღლეზე */}
        <div className="user-main-row" style={{ 
          alignItems: 'flex-start',
          height: '48px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          
          {/* ავატარი და XP წრე - 48px კონტეინერი, 44px ავატარი */}
          <div className="avatar-section clickable-avatar" onClick={() => onNavigate?.('profile')} style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
            <svg className="xp-circular-progress" width="48" height="48" viewBox="0 0 48 48" style={{ position: 'absolute', top: 0, left: 0 }}>
              <circle className="xp-circle-bg" cx="24" cy="24" r="22" fill="none" stroke="rgba(197, 160, 89, 0.15)" strokeWidth="2" />
              <circle className="xp-circle-progress" cx="24" cy="24" r="22" fill="none" stroke="url(#xpGradient)" strokeWidth="2" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} transform="rotate(-90 24 24)" />
              <defs>
                <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>
            
            <div style={{ 
              position: 'absolute',
              top: '2px',
              left: '2px',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)',
              borderRadius: '50%',
              color: '#0f0c08',
              zIndex: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              {user?.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            <div style={{
              position: 'absolute',
              bottom: '0px',
              left: '0px',
              background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              color: '#0f0c08',
              borderRadius: '6px',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              zIndex: 3,
              boxShadow: '0 2px 6px rgba(0,0,0,0.4), 0 0 0 1.5px #1a1510',
              border: '1.5px solid #1a1510'
            }}>
              {userLevelData.level}
            </div>
            
            {activeSubscription && (
              <div style={{
                position: 'absolute',
                bottom: '0px',
                right: '0px',
                background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                color: '#fff',
                borderRadius: '6px',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
                boxShadow: '0 2px 6px rgba(0,0,0,0.4), 0 0 0 1.5px #1a1510',
                border: '1.5px solid #1a1510'
              }}>
                <Crown size={10} style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))' }} />
              </div>
            )}
          </div>
          
          {/* 🆕 მომხმარებლის ინფო - ზუსტად 48px სიმაღლეზე გაწერილი */}
          <div className="user-info-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '48px', marginLeft: '12px', flex: 1, minWidth: 0 }}>
            <h2 className="username" style={{ margin: 0, fontSize: '18px', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.display_name || 'LunaraSeeker'}
            </h2>
            {activeSubscription && (
              <div className="premium-status-badge" onClick={() => onNavigate?.('subscription')} style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                <Infinity size={10} /><span>PREMIUM</span>
              </div>
            )}
          </div>
          
          {/* 🆕 ქოინები და ენერგია - ასევე 48px სიმაღლეზე გასწორებული და ლამაზი ბანერებით */}
          <div className="user-resources" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            height: '48px',
            gap: '6px',
            flexShrink: 0 
          }}>
            <div className="resource gems" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(147, 112, 219, 0.15)',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(147, 112, 219, 0.3)'
            }}>
              <Gem size={14} className="resource-icon gem-icon" style={{ color: '#9370db' }} />
              <span className="value" style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                {economy.cosmic_coins.toLocaleString()}
              </span>
              <button className="add-btn" style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'rgba(197, 160, 89, 0.3)',
                border: 'none',
                color: '#C5A059',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>+</button>
            </div>
            
            <div className="resource energy" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(251, 191, 36, 0.15)',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}>
              <Zap size={14} className="resource-icon energy-icon" style={{ color: '#fbbf24' }} />
              <span className="value" style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                18/20
              </span>
              <button className="add-btn" style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'rgba(197, 160, 89, 0.3)',
                border: 'none',
                color: '#C5A059',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>+</button>
            </div>
          </div>
        </div>
      </div>

      <div className="quests-and-actions-split" style={{ display: 'flex', flexDirection: 'row', gap: '2px', marginBottom: '2px', width: '100%', alignItems: 'stretch' }}>
        <div 
          className="daily-quests-compact" 
          style={{ flex: '0 0 60%', minWidth: 0, background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)', border: '1px solid #332a1a', borderRadius: '14px', padding: '8px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
          onClick={() => setShowQuestModal(true)}
        >
          <div className="quests-header-compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', padding: '0 2px' }}>
            <h3 style={{ margin: 0, fontSize: '9px', color: '#C5A059', letterSpacing: '1px', fontWeight: 700, textTransform: 'uppercase' }}>DAILY QUESTS</h3>
            <span style={{ fontSize: '9px', color: '#b3a68c', fontFamily: 'monospace' }}>{timeLeft}</span>
          </div>
          
          <div className="quest-list-compact" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, justifyContent: 'center' }}>
            {questsLoading ? (
              <div style={{ textAlign: 'center', color: '#b3a68c', fontSize: '9px', padding: '10px' }}>Loading...</div>
            ) : dailyQuests.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#b3a68c', fontSize: '9px', padding: '10px' }}>No quests</div>
            ) : activeDailyQuest ? (
              <div className="quest-item-compact" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 6px', background: activeDailyQuest.isClaimable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(197, 160, 89, 0.05)', borderRadius: '6px', border: `1px solid ${activeDailyQuest.isClaimable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(197, 160, 89, 0.08)'}` }}>
                <div className="quest-icon-compact" style={{ color: activeDailyQuest.isClaimable ? '#10b981' : '#C5A059', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
                  {getQuestIcon(activeDailyQuest.quest?.action_type || '')}
                </div>
                <div className="quest-info-compact" style={{ flex: 1, minWidth: 0 }}>
                  <span className="quest-name-compact" style={{ fontSize: '9px', color: '#fff', fontWeight: 500, display: 'block', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeDailyQuest.quest?.title || 'Quest'}
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
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleClaimQuest(activeDailyQuest); }}
                      disabled={isClaimingQuest}
                      style={{ background: '#10b981', border: 'none', borderRadius: '4px', color: '#fff', padding: '2px 6px', fontSize: '8px', fontWeight: 'bold', cursor: isClaimingQuest ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      {isClaimingQuest ? <RefreshCw size={10} className="spin" /> : 'CLAIM'}
                    </button>
                  ) : (
                    <><Gem size={9} /> +{activeDailyQuest.quest?.reward_coins}</>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#10b981', fontSize: '9px', padding: '10px' }}>🎉 All Complete!</div>
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

            <button className="action-btn-vertical streak-btn-v" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(197, 160, 89, 0.15)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', padding: '4px', width: '100%', height: '100%' }}>
              <Flame size={22} style={{ filter: 'drop-shadow(0 0 6px #ff6b35)', color: '#ff6b35', width: '20px', height: '20px' }} />
              <div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(197, 160, 89, 0.9)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>{currentStreak}</div>
            </button>

            <button className="action-btn-vertical rank-btn-v" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(197, 160, 89, 0.15)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', padding: '4px', width: '100%', height: '100%' }}>
              <Trophy size={22} style={{ filter: 'drop-shadow(0 0 6px #ffd700)', color: '#ffd700', width: '20px', height: '20px' }} />
              <div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(197, 160, 89, 0.9)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>TOP</div>
            </button>

            <button className={`action-btn-vertical ${activeSubscription ? 'subscription-btn-v' : 'upgrade-btn-v'}`} onClick={() => onNavigate && onNavigate(activeSubscription ? 'subscription' : 'pricing')} style={{ background: activeSubscription ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)' : 'rgba(255, 255, 255, 0.03)', border: activeSubscription ? '1px solid rgba(255, 215, 0, 0.4)' : '1px solid rgba(197, 160, 89, 0.15)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', padding: '4px', width: '100%', height: '100%' }}>
              {activeSubscription ? (
                <><Infinity size={22} style={{ filter: 'drop-shadow(0 0 6px #FFD700)', color: '#FFD700', width: '20px', height: '20px' }} /><div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>VIP</div></>
              ) : (
                <><Crown size={22} style={{ filter: 'drop-shadow(0 0 6px #a78bfa)', color: '#a78bfa', width: '20px', height: '20px' }} /><div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(197, 160, 89, 0.9)', color: '#0a0600', fontSize: '7px', fontWeight: 700, padding: '1px 3px', borderRadius: '3px' }}>PRO</div></>
              )}
            </button>
          </div>
        </div>
      </div>

      {showQuestModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setShowQuestModal(false)}>
          <div 
            style={{
              background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
              border: '1px solid #332a1a',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '400px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#C5A059', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={18} /> Daily Quests
              </h3>
              <button onClick={() => setShowQuestModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              {dailyQuests.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No quests available.</div>
              ) : (
                dailyQuests.map((q, idx) => (
                  <div key={q.id} style={{ 
                    background: q.is_claimed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${q.is_claimed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: idx < dailyQuests.length - 1 ? '12px' : '0',
                    opacity: q.is_claimed ? 0.7 : 1
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '8px', 
                          background: q.isClaimable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(197, 160, 89, 0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: q.isClaimable ? '#10b981' : '#C5A059'
                        }}>
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
                        <div style={{ 
                          width: `${Math.min((q.current_progress / (q.quest?.target_count || 1)) * 100, 100)}%`,
                          height: '100%',
                          background: q.isClaimable ? '#10b981' : 'linear-gradient(90deg, #C5A059, #ffe566)',
                          borderRadius: '2px'
                        }}></div>
                      </div>
                      <span style={{ fontSize: '11px', color: '#b3a68c', minWidth: '30px', textAlign: 'right' }}>
                        {q.current_progress}/{q.quest?.target_count}
                      </span>
                    </div>

                    {q.isClaimable && (
                      <button 
                        onClick={() => handleClaimQuest(q)}
                        disabled={isClaimingQuest}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          padding: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: isClaimingQuest ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        {isClaimingQuest ? <RefreshCw size={14} className="spin" /> : <><CheckCircle size={14} /> CLAIM REWARD</>}
                      </button>
                    )}
                    
                    {q.is_claimed && (
                      <div style={{ 
                        width: '100%', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 'bold', color: '#10b981',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}>
                        <CheckCircle size={14} /> COMPLETED & CLAIMED
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {dailyQuests.length > 0 && dailyQuests.every(q => q.is_claimed) && (
                <div style={{ 
                  textAlign: 'center', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', marginTop: '16px'
                }}>
                  <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}>🎉 All Complete!</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Come back in {timeLeft} for new quests.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card-of-day-banner clickable-card" onClick={() => onNavigate && onNavigate('daily-card')} style={{ background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)', border: '1px solid #332a1a', borderRadius: '16px', padding: '12px', marginBottom: '2px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)', position: 'relative', overflow: 'visible', cursor: 'pointer' }}>
        <div className="card-of-day-content" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0' }}>
          <div className="card-half-left" style={{ flex: '0 0 45%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
            <div className="card-image-3d-wrapper" style={{ position: 'relative', width: 'clamp(80px, 22vw, 110px)', aspectRatio: '2/3', perspective: '800px' }}>
              <div className="card-image-tilted" style={{ position: 'relative', width: '100%', height: '100%', transform: 'rotateY(-5deg) rotateX(2deg) rotate(3deg)', transition: 'transform 0.4s ease', zIndex: 2, transformStyle: 'preserve-3d' }}>
                {dailyCard?.image_url ? (
                  <img src={dailyCard.image_url} alt={dailyCardName} className="card-image-large" style={{ transform: isDailyReversed ? 'rotate(183deg)' : 'rotate(3deg)', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid #C5A059', boxShadow: '0 2px 4px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.5), 0 16px 32px rgba(0,0,0,0.6), 0 0 20px rgba(197,160,89,0.3)' }} />
                ) : (
                  <div className="card-placeholder-large" style={{ transform: 'rotate(3deg)', width: '100%', height: '100%', background: 'linear-gradient(135deg, #2a2215, #1a1510)', borderRadius: '8px', border: '2px solid #C5A059', boxShadow: '0 2px 4px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.5), 0 16px 32px rgba(0,0,0,0.6), 0 0 20px rgba(197,160,89,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#C5A059' }}>{dailyCardNumber}</span>
                    <div style={{ fontSize: '28px', filter: 'drop-shadow(0 0 10px rgba(197, 160, 89, 0.6))' }}>✦</div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#C5A059', textAlign: 'center', padding: '0 6px' }}>{dailyCardName}</span>
                  </div>
                )}
                {isDailyReversed && (
                  <div className="card-reversed-indicator-large" style={{ position: 'absolute', top: '5px', right: '5px', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900, zIndex: 3, background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', color: '#fff', border: '2px solid #fff', boxShadow: '0 0 0 2px rgba(167,139,250,0.5), 0 4px 12px rgba(167,139,250,0.8), 0 0 20px rgba(167,139,250,0.6)' }}>
                    <span>R</span>
                  </div>
                )}
              </div>
              <div className="card-3d-shadow" style={{ position: 'absolute', bottom: '-6px', left: '10%', width: '80%', height: '14px', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)', filter: 'blur(6px)', zIndex: 1, opacity: 0.7 }}></div>
            </div>
          </div>

          <div className="card-half-right" style={{ flex: '0 0 55%', paddingLeft: '12px', display: 'flex', alignItems: 'center' }}>
            <div className="card-info-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', width: '100%', minWidth: 0 }}>
              <div style={{ fontSize: '9px', color: '#C5A059', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.7, fontWeight: 600 }}>CARD OF THE DAY</div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#C5A059', letterSpacing: '0.5px', fontWeight: 700, lineHeight: 1.2 }}>{dailyCardName}</h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 1.3 }}>"{dailyCardMeaning}"</p>
              {dailyCardElement && <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>{dailyCardElement}</p>}
              <button className="read-guidance-btn" style={{ background: 'transparent', border: '1px solid #C5A059', color: '#C5A059', padding: '5px 10px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', alignSelf: 'flex-start' }}>
                READ GUIDANCE <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

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

      {isUserAdmin && user?.id === 'c9dbe3be-5c02-4034-8bfd-1d693eb02754' && (
        <div style={{ position: 'fixed', bottom: '80px', right: '16px', zIndex: 10000, maxWidth: '450px', maxHeight: '70vh', overflow: 'auto' }}>
          <button onClick={() => setShowDebug(!showDebug)} style={{ width: '56px', height: '56px', borderRadius: '50%', background: showDebug ? '#10b981' : '#ef4444', border: '3px solid rgba(255,255,255,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.6)', marginBottom: '12px' }}>
            <Bug size={28} />
          </button>

          {showDebug && (
            <div style={{ background: 'rgba(10, 6, 0, 0.98)', border: '2px solid rgba(255, 229, 102, 0.5)', borderRadius: '16px', padding: '16px', color: '#ffe566', fontFamily: 'monospace', fontSize: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid rgba(255, 229, 102, 0.3)' }}>
                <strong style={{ fontSize: '14px', color: '#ffe566' }}>🔧 DEBUG PANEL</strong>
                <button onClick={() => setShowDebug(false)} style={{ padding: '2px 6px', background: '#ef4444', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '8px' }}>✕</button>
              </div>

              <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ marginBottom: '6px', color: '#3b82f6', fontWeight: 'bold' }}>🗄️ DATABASE CONNECTION</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  {dbStatus === 'connected' ? <CheckCircle size={14} color="#10b981" /> : dbStatus === 'error' ? <XCircle size={14} color="#ef4444" /> : <RefreshCw size={14} color="#fbbf24" />}
                  <span>Status: <strong style={{ color: dbStatus === 'connected' ? '#10b981' : dbStatus === 'error' ? '#ef4444' : '#fbbf24' }}>{dbStatus.toUpperCase()}</strong></span>
                </div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>User ID: {user?.id?.slice(0, 8)}...</div>
              </div>

              <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ marginBottom: '6px', color: '#10b981', fontWeight: 'bold' }}>💰 ECONOMY (FROM DB)</div>
                {dbDebugInfo.economyData ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <div>🪙 Coins: <strong>{dbDebugInfo.economyData.cosmic_coins}</strong></div>
                    <div>⭐ XP: <strong>{dbDebugInfo.economyData.xp}</strong></div>
                    <div>🎯 Level: <strong>{dbDebugInfo.economyData.level}</strong></div>
                    <div>🔥 Streak: <strong>{dbDebugInfo.economyData.current_streak}</strong></div>
                    <div>⚡ Focus: <strong>{dbDebugInfo.economyData.cosmic_focus || 0}/{dbDebugInfo.economyData.max_focus || 0}</strong></div>
                  </div>
                ) : (
                  <div style={{ color: '#64748b' }}>No data loaded yet</div>
                )}
              </div>

              {dbDebugInfo.lastQuery && (
                <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  <div style={{ marginBottom: '6px', color: '#8b5cf6', fontWeight: 'bold' }}>📡 LAST QUERY</div>
                  <div style={{ fontSize: '9px', marginBottom: '4px' }}><strong>Table:</strong> {dbDebugInfo.lastQuery.table}</div>
                  <div style={{ fontSize: '9px', marginBottom: '4px' }}><strong>Operation:</strong> {dbDebugInfo.lastQuery.operation}</div>
                  <div style={{ fontSize: '9px', color: '#64748b', wordBreak: 'break-all' }}><strong>Params:</strong> {JSON.stringify(dbDebugInfo.lastQuery.params)}</div>
                  {dbDebugInfo.lastResponse && (
                    <div style={{ marginTop: '4px', fontSize: '9px', color: '#10b981', wordBreak: 'break-all' }}>
                      <strong>Response:</strong> {JSON.stringify(dbDebugInfo.lastResponse).slice(0, 100)}...
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div style={{ marginBottom: '6px', color: '#f59e0b', fontWeight: 'bold' }}>🧪 QUICK TESTS</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <button onClick={() => testAddCoins(10)} style={{ padding: '4px 8px', background: '#fbbf24', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>+10 Coins</button>
                  <button onClick={() => testAddCoins(50)} style={{ padding: '4px 8px', background: '#f59e0b', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>+50 Coins</button>
                  <button onClick={() => testAddCoins(100)} style={{ padding: '4px 8px', background: '#d97706', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>+100 Coins</button>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <button onClick={() => testAddXP(50)} style={{ padding: '4px 8px', background: '#a78bfa', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>+50 XP</button>
                  <button onClick={() => testAddXP(100)} style={{ padding: '4px 8px', background: '#8b5cf6', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>+100 XP</button>
                </div>
                <button onClick={reloadFromDatabase} style={{ width: '100%', padding: '6px', background: '#3b82f6', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>🔄 RELOAD FROM DB</button>
              </div>

              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <button onClick={checkDatabaseStatus} style={{ flex: '1', minWidth: '80px', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.3)', border: '1px solid #10b981', borderRadius: '6px', color: '#10b981', cursor: 'pointer', fontSize: '9px' }}>
                  🩺 CHECK DB
                </button>
                <button onClick={handleLogoutAndReset} style={{ flex: '1', minWidth: '80px', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.3)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><LogOut size={12} /> LOGOUT</button>
                <button onClick={refreshUserDataDebug} style={{ flex: '1', minWidth: '80px', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.3)', border: '1px solid #3b82f6', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer', fontSize: '9px' }}>🔄 REFRESH USER</button>
                <button onClick={testEconomyInitialization} style={{ flex: '1', minWidth: '80px', padding: '4px 8px', background: 'rgba(168, 85, 247, 0.3)', border: '1px solid #a855f7', borderRadius: '6px', color: '#a855f7', cursor: 'pointer', fontSize: '9px' }}>🔄 TEST INIT</button>
                <button onClick={testCompleteQuest} style={{ flex: '1', minWidth: '80px', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.3)', border: '1px solid #10b981', borderRadius: '6px', color: '#10b981', cursor: 'pointer', fontSize: '9px' }}>🎯 TEST QUEST</button>
              </div>

              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                <button onClick={copyAllDebugInfo} style={{ flex: 1, padding: '6px', background: copySuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(96, 165, 250, 0.3)', border: `1px solid ${copySuccess ? '#10b981' : '#60a5fa'}`, borderRadius: '6px', color: copySuccess ? '#10b981' : '#60a5fa', cursor: 'pointer', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Copy size={12} /> {copySuccess ? 'COPIED!' : 'COPY ALL'}
                </button>
                <button onClick={() => setDebugLogs([])} style={{ flex: 1, padding: '6px', background: 'rgba(239, 68, 68, 0.3)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '9px' }}>🗑️ CLEAR LOGS</button>
              </div>

              {dbDebugInfo.queryHistory.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ marginBottom: '6px', color: '#f472b6', fontWeight: 'bold' }}>📜 QUERY HISTORY ({dbDebugInfo.queryHistory.length})</div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {dbDebugInfo.queryHistory.slice(0, 10).map((query, idx) => (
                      <div key={idx} style={{ padding: '6px', marginBottom: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', borderLeft: query.error ? '3px solid #ef4444' : '3px solid #10b981' }}>
                        <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>{query.timestamp}</div>
                        <div style={{ fontSize: '9px' }}><strong>{query.operation}</strong> {query.table}</div>
                        {query.error && <div style={{ fontSize: '8px', color: '#ef4444', marginTop: '2px' }}>Error: {query.error.message}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ marginBottom: '6px', color: '#f472b6', fontWeight: 'bold' }}>📝 LOGS ({debugLogs.length})</div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {debugLogs.slice(0, 20).map((log) => (
                    <div key={log.id} style={{ padding: '6px', marginBottom: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', borderLeft: `3px solid ${log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : log.type === 'warning' ? '#fbbf24' : '#60a5fa'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ color: '#64748b', fontSize: '9px' }}>{log.timestamp}</span>
                        <span style={{ fontSize: '9px', color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : log.type === 'warning' ? '#fbbf24' : '#60a5fa', fontWeight: 'bold' }}>{log.category}</span>
                      </div>
                      <div style={{ color: '#fff', fontSize: '9px' }}>{log.message}</div>
                      {log.data && (
                        <div style={{ marginTop: '4px', fontSize: '8px', color: '#94a3b8', wordBreak: 'break-all' }}>
                          {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2).slice(0, 200) : log.data}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}