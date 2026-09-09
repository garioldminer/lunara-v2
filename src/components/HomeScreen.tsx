import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useUser } from '../context/UserContext';
import { useTranslation } from '../i18n/TranslationContext';
import { tarotCards, SUITS } from '../data/tarotCards';
import { getActiveSubscription } from '../lib/subscriptionService';
import { supabase } from '../lib/supabase';
import { getTodayReading } from '../lib/dailyCardService';
import { getStreakMilestones, getClaimedMilestones } from '../lib/streakService';
import { logger } from '../lib/logger';
import { 
  Sparkles, LayoutGrid, Moon, 
  Scroll, TrendingUp, Crown
} from 'lucide-react';
import DebugPanel from './DebugPanel';
import DiamondShopModal from './DiamondShopModal';
import StreakModal from './StreakModal';
import LeaderboardModal from './LeaderboardModal';
import HomeLayoutDebugger from './HomeLayoutDebugger';
import './HomeScreen.css';
import { getLevelFromTotalXP, getStreakTierIcon } from './home/lib/helpers';
import { ToastNotification, type Toast } from './home/components/ToastNotification';
import { LevelUpModal } from './home/components/LevelUpModal';
import { StreakBanner } from './home/components/StreakBanner';
import { AdminButtons } from './home/components/AdminButtons';
import { UserHeader } from './home/components/UserHeader';
import { CardOfDayBanner } from './home/components/CardOfDayBanner';
import { QuickActionsGrid } from './home/components/QuickActionsGrid';
import { QuestsPanel } from './home/components/QuestsPanel';
import { ActionButtons } from './home/components/ActionButtons';
import { useDebugTools } from './home/hooks/useDebugTools';


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

interface DailyQuestDisplay {
  id: string;
  quest_id: string;
  quest?: {
    quest_type?: string;
    action_type?: string;
    title?: string;
    description?: string;
    target_count?: number;
    reward_coins?: number;
    reward_xp?: number;
  };
  current_progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  isClaimable?: boolean;
}

export default function HomeScreen({ onNavigate }: Props) {
  const { t } = useTranslation();
  const { user, setUser } = useUser();
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  
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
  const [unclaimedMilestoneCount, setUnclaimedMilestoneCount] = useState(0);
  const [streakBannerDismissed, setStreakBannerDismissed] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showLayoutDebug, setShowLayoutDebug] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  const screenRef = useRef<HTMLDivElement>(null);

  const loadQuests = async () => {
    if (!user) return;
    setQuestsLoading(true);
    const { loadUserQuests } = await import('../lib/questService');
    const quests = await loadUserQuests(user.id);
    const dQuests = quests.filter((q: any) => q.quest?.quest_type === 'daily') as DailyQuestDisplay[];
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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const debugTools = useDebugTools({
    user,
    economy,
    setEconomy,
    setCurrentStreak,
    setUser,
    showToast,
    loadQuests
  });

  const { addDebugLog } = debugTools;

  useEffect(() => {
    const applyHeight = () => {
      const el = screenRef.current;
      if (!el) return;
      const nav = document.querySelector('.bottom-nav-container') as HTMLElement | null;
      const top = el.getBoundingClientRect().top;
      let h;
      if (nav) {
        h = nav.getBoundingClientRect().top - top - 8;
      } else {
        h = window.innerHeight - top - 100;
      }
      if (h > 0) el.style.height = `${h}px`;
    };
    applyHeight();
    const interval = setInterval(applyHeight, 500);
    const stop = setTimeout(() => clearInterval(interval), 10000);
    const onScroll = () => requestAnimationFrame(applyHeight);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onScroll);
    window.addEventListener('orientationchange', onScroll);
    return () => {
      clearInterval(interval);
      clearTimeout(stop);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('orientationchange', onScroll);
    };
  }, []);

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
    
    debugTools.reloadFromDatabase();
    setUnclaimedMilestoneCount(0);
  };

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready?.();
        tg.expand?.();
        tg.disableVerticalSwipes?.();
      }
    } catch (e) {
      // silently ignore
    }
  }, []);

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
        
        logger.log(`⚡ Energy regenerated: +${energyToRegen}, new total: ${newEnergy}`);
      }
    } catch (error) {
      logger.error('❌ Error calculating energy:', error);
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
      logger.error('❌ Error spending energy:', error);
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
    
    logger.log(`⚡ Spent ${requiredEnergy} energy on ${readingType}, remaining: ${data.new_energy}`);
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
          debugTools.addToDbDebugHistory('user_economy', 'SELECT', queryParams, null, error);
          addDebugLog('error', 'ECONOMY', '❌ Database query failed', { error: error.message, code: error.code, details: error.details });
          return;
        }
        setDbStatus('connected');
        debugTools.addToDbDebugHistory('user_economy', 'SELECT', queryParams, data);
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
    
    if (action === 'Placeholder10') {
      showToast('✨ Coming Soon! ეს ფუნქცია მალე დაემატება...', 'info');
      return;
    }
    
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
      else if (action === 'Subscription') onNavigate('subscription');
      else if (action === 'Services') onNavigate('services');
      else if (action === 'Stats') onNavigate('journal-stats');
    }
  };

  const quickActions = [
    { icon: <Sparkles size={28} />, label: t('home.quickAccess.daily'), sublabel: t('home.quickAccess.card'), color: '#C5A059', action: 'Daily' },
    { icon: <LayoutGrid size={28} />, label: t('home.quickAccess.threeCards'), sublabel: t('home.quickAccess.reading'), color: '#a78bfa', action: '3Cards' },
    { icon: <Moon size={28} />, label: t('home.quickAccess.tarot'), sublabel: t('home.quickAccess.draw'), color: '#60a5fa', action: 'Tarot' },
    { icon: <Scroll size={28} />, label: t('home.quickAccess.history'), sublabel: t('home.quickAccess.readings'), color: '#34d399', action: 'History' },
    { icon: <TrendingUp size={28} />, label: 'Stats', sublabel: 'Journal', color: '#C5A059', action: 'Stats' },
    { icon: <Crown size={28} />, label: t('home.quickAccess.celtic'), sublabel: t('home.quickAccess.cross'), color: '#C5A059', action: 'CelticCross', isPremium: true },
    { icon: <span style={{ fontSize: '28px' }}>🐎</span>, label: t('home.quickAccess.horseshoe'), sublabel: t('home.quickAccess.sevenCards'), color: '#fb923c', action: 'Horseshoe', isPremium: true },
    { icon: <span style={{ fontSize: '28px' }}>❤️</span>, label: t('home.quickAccess.love'), sublabel: t('home.quickAccess.spread'), color: '#f472b6', action: 'Relationship', isPremium: true },
    { icon: <Sparkles size={28} />, label: t('home.quickAccess.services'), sublabel: t('home.quickAccess.shop'), color: '#FFD700', action: 'Services', isServices: true },
    { icon: <span style={{ fontSize: '28px' }}>✨</span>, label: 'Coming', sublabel: 'Soon', color: '#8b5cf6', action: 'Placeholder10', isPlaceholder: true },
  ];

  const dailyCardName = dailyCard?.name || 'THE FOOL';
  const dailyCardMeaning = isDailyReversed ? (dailyCard?.reversed_keywords?.[0] || 'Reflection') : (dailyCard?.keywords?.[0] || 'New Beginnings');
  const dailyCardElement = dailyCard ? getCardMeta(dailyCard) : '';

  return (
    <div className="home-screen" ref={screenRef}>
      <AnimatePresence>
        {toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}
        {showLevelUpModal && <LevelUpModal level={leveledUpTo} onClose={() => setShowLevelUpModal(false)} t={t} />}
      </AnimatePresence>

      {isUserAdmin && (
        <AdminButtons
          onNavigate={onNavigate || (() => {})}
          onOpenDebug={() => setShowDebug(true)}
          onOpenLayoutDebug={() => setShowLayoutDebug(true)}
        />
      )}

      <AnimatePresence>
        <StreakBanner
          currentStreak={currentStreak}
          isDailyRevealed={isDailyRevealed}
          isDismissed={streakBannerDismissed}
          onDismiss={() => setStreakBannerDismissed(true)}
          onNavigate={onNavigate || (() => {})}
        />
      </AnimatePresence>

      <UserHeader
        user={user}
        economy={economy}
        activeSubscription={activeSubscription}
        onNavigate={onNavigate || (() => {})}
        onOpenShop={() => setIsShopOpen(true)}
        onRefillEnergy={handleRefillEnergy}
        isClaiming={isClaiming}
      />

      <div className="quests-and-actions-split" style={{ display: 'flex', flexDirection: 'row', gap: '2px', marginBottom: '2px', width: '100%', alignItems: 'stretch' }}>
        <QuestsPanel
          quests={dailyQuests}
          loading={questsLoading}
          activeQuest={activeDailyQuest}
          isClaiming={isClaimingQuest}
          showModal={showQuestModal}
          onOpenModal={() => setShowQuestModal(true)}
          onCloseModal={() => setShowQuestModal(false)}
          onClaim={handleClaimQuest}
          t={t}
        />

        <ActionButtons
          currentStreak={currentStreak}
          rewardClaimed={rewardClaimed}
          isClaiming={isClaiming}
          activeSubscription={activeSubscription}
          unclaimedMilestoneCount={unclaimedMilestoneCount}
          onClaimReward={handleClaimReward}
          onOpenStreakModal={() => setShowStreakModal(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onNavigateSubscription={() => onNavigate && onNavigate(activeSubscription ? 'subscription' : 'pricing')}
          getStreakTierIcon={getStreakTierIcon}
        />
      </div>

      <CardOfDayBanner
        dailyCard={dailyCard}
        dailyCardName={dailyCardName}
        dailyCardMeaning={dailyCardMeaning}
        dailyCardElement={dailyCardElement}
        isDailyReversed={isDailyReversed}
        isDailyRevealed={isDailyRevealed}
        onNavigate={onNavigate || (() => {})}
      />

      <QuickActionsGrid
        actions={quickActions}
        onAction={handleQuickAction}
      />

      {isShopOpen && user && (
        <DiamondShopModal 
          isOpen={isShopOpen} 
          onClose={() => setIsShopOpen(false)} 
          userId={user.id}
          isAdmin={isUserAdmin}
          onSuccess={() => {
            setIsShopOpen(false);
            showToast('Diamonds successfully added!', 'success');
            debugTools.reloadFromDatabase();
          }}
        />
      )}

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
          dbDebugInfo={debugTools.dbDebugInfo}
          debugLogs={debugTools.debugLogs}
          dbStatus={dbStatus}
          activeSubscription={activeSubscription}
          questsLoading={questsLoading}
          dailyQuests={dailyQuests}
          activeDailyQuest={activeDailyQuest}
          isClaimingQuest={isClaimingQuest}
          timeLeft=""
          showQuestModal={showQuestModal}
          rewardClaimed={rewardClaimed}
          isClaiming={isClaiming}
          currentStreak={currentStreak}
          setDebugLogs={debugTools.setDebugLogs}
          checkDatabaseStatus={debugTools.checkDatabaseStatus}
          refreshUserDataDebug={debugTools.refreshUserDataDebug}
          handleLogoutAndReset={debugTools.handleLogoutAndReset}
          testAddCoins={debugTools.testAddCoins}
          testAddXP={debugTools.testAddXP}
          testAddEnergy={debugTools.testAddEnergy}
          testSpendEnergy={debugTools.testSpendEnergy}
          testCompleteQuest={debugTools.testCompleteQuest}
          reloadFromDatabase={debugTools.reloadFromDatabase}
          testAddXPWithLevel={debugTools.testAddXPWithLevel}
          forceRecalcLevel={debugTools.forceRecalcLevel}
          xpTestLogs={debugTools.xpTestLogs}
        />
      )}

      <HomeLayoutDebugger open={showLayoutDebug} onClose={() => setShowLayoutDebug(false)} />
    </div>
  );
}