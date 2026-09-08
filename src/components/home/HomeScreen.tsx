import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useUser } from '../../context/UserContext';
import { useTranslation } from '../../i18n/TranslationContext';
import { getActiveSubscription } from '../../lib/subscriptionService';
import { Shield, Bug, Ruler } from 'lucide-react';

import { useEconomy } from './hooks/useEconomy';
import { useQuests } from './hooks/useQuests';
import { useStreak } from './hooks/useStreak';
import { useDailyCard } from './hooks/useDailyCard';

import { ToastNotification } from './components/ToastNotification';
import { LevelUpModal } from './components/LevelUpModal';
import { StreakBanner } from './components/StreakBanner';
import { UserHeader } from './components/UserHeader';
import { QuestsPanel, QuestModal } from './components/QuestsPanel';
import { ActionButtons } from './components/ActionButtons';
import { DailyCardBanner } from './components/DailyCardBanner';
import { QuickActions } from './components/QuickActions';

import DebugPanel from '../DebugPanel';
import DiamondShopModal from '../DiamondShopModal';
import StreakModal from '../StreakModal';
import LeaderboardModal from '../LeaderboardModal';
import HomeLayoutDebugger from '../HomeLayoutDebugger';
import './HomeScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function HomeScreen({ onNavigate }: Props) {
  const { t } = useTranslation();
  const { user } = useUser();
  
  // State
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [isClaimingQuest, setIsClaimingQuest] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [leveledUpTo, setLeveledUpTo] = useState<number>(1);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showLayoutDebug, setShowLayoutDebug] = useState(false);

  const screenRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const {
    economy,
    reloadFromDatabase,
    checkAndSpendEnergy,
    refillEnergy,
    updateEconomy,
    getLevelFromTotalXP
  } = useEconomy(user?.id);

  const {
    questsLoading,
    dailyQuests,
    activeDailyQuest,
    claimQuest
  } = useQuests(user?.id);

  const {
    unclaimedMilestoneCount,
    streakBannerDismissed,
    dismissBanner
  } = useStreak(user?.id, economy.current_streak);

  const { dailyCard, isDailyReversed, isDailyRevealed } = useDailyCard(user?.id);

  // Computed values
  const userLevelData = getLevelFromTotalXP(economy.xp);
  const circumference = 2 * Math.PI * 22;
  const xpPercent = Math.min((userLevelData.currentLevelXP / userLevelData.xpToNext) * 100, 100);
  const strokeDashoffset = circumference - (xpPercent / 100) * circumference;

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Admin check
  useEffect(() => {
    if (user) {
      setIsUserAdmin(user.is_admin === true);
    }
  }, [user]);

  // Subscription check
  useEffect(() => {
    if (user) {
      getActiveSubscription(user.id).then(sub => {
        setActiveSubscription(sub);
      });
    }
  }, [user]);

  // Screen height adjustment
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
    window.addEventListener('scroll', applyHeight);
    window.addEventListener('resize', applyHeight);
    return () => {
      clearInterval(interval);
      clearTimeout(stop);
      window.removeEventListener('scroll', applyHeight);
      window.removeEventListener('resize', applyHeight);
    };
  }, []);

  // Handle daily reward claim
  const handleClaimReward = async () => {
    if (rewardClaimed || isClaiming || !user?.id) return;
    setIsClaiming(true);
    try {
      const response = await fetch('https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/claim-daily-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id },
        body: JSON.stringify({})
      });
      const result = await response.json();
      if (result.success) {
        setRewardClaimed(true);
        const rewardData = result.data?.reward || result.reward;
        if (rewardData) {
          updateEconomy({
            cosmic_coins: economy.cosmic_coins + rewardData.coins,
            xp: economy.xp + rewardData.xp,
            current_streak: rewardData.streak
          });
          showToast(`Daily Reward Claimed! +${rewardData.coins} Coins, +${rewardData.xp} XP`, 'success');
        }
      } else {
        showToast(result.error || 'Failed to claim reward', 'error');
      }
    } catch (error: any) {
      showToast('Failed to connect to server', 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  // Handle quest claim
  const handleClaimQuest = async (quest: any) => {
    if (!user || isClaimingQuest) return;
    setIsClaimingQuest(true);
    try {
      const result = await claimQuest(quest);
      if (result.success && result.reward) {
        const currentTotalXP = user.xp || 0;
        const newTotalXP = currentTotalXP + result.reward.xp;
        const oldLevelData = getLevelFromTotalXP(currentTotalXP);
        const newLevelData = getLevelFromTotalXP(newTotalXP);
        
        updateEconomy({
          cosmic_coins: economy.cosmic_coins + result.reward.coins,
          xp: newTotalXP,
          level: newLevelData.level
        });

        if (newLevelData.level > oldLevelData.level) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24', '#f59e0b', '#ffffff', '#10b981'] });
          setLeveledUpTo(newLevelData.level);
          setShowLevelUpModal(true);
        } else {
          showToast(`Quest Completed! +${result.reward.coins} Coins, +${result.reward.xp} XP`, 'success');
        }
      } else {
        showToast(result.error || 'Failed to claim reward', 'error');
      }
    } catch (err: any) {
      showToast('Failed to claim quest', 'error');
    } finally {
      setIsClaimingQuest(false);
    }
  };

  // Handle energy refill
  const handleRefillEnergy = async () => {
    const result = await refillEnergy();
    if (result.success) {
      showToast('Energy refilled successfully!', 'success');
    } else {
      showToast(result.error || 'Failed to refill energy', 'error');
    }
  };

  // Handle quick action
  const handleQuickAction = async (action: string) => {
    if (action === 'Placeholder10') {
      showToast(t('home.comingSoon'), 'info');
      return;
    }

    // Premium actions with energy check
    if (action === 'CelticCross') {
      const canProceed = await checkAndSpendEnergy('celtic_cross', 6);
      if (canProceed) onNavigate?.('celtic-cross');
      else showToast(t('home.notEnoughEnergy', { required: 6, current: economy.cosmic_focus }), 'error');
      return;
    }
    if (action === 'Horseshoe') {
      const canProceed = await checkAndSpendEnergy('horseshoe', 4);
      if (canProceed) onNavigate?.('horseshoe');
      else showToast(t('home.notEnoughEnergy', { required: 4, current: economy.cosmic_focus }), 'error');
      return;
    }
    if (action === 'Relationship') {
      const canProceed = await checkAndSpendEnergy('relationship', 5);
      if (canProceed) onNavigate?.('relationship');
      else showToast(t('home.notEnoughEnergy', { required: 5, current: economy.cosmic_focus }), 'error');
      return;
    }
    if (action === '3Cards') {
      const canProceed = await checkAndSpendEnergy('three_card', 2);
      if (canProceed) onNavigate?.('three-card-reading');
      else showToast(t('home.notEnoughEnergy', { required: 2, current: economy.cosmic_focus }), 'error');
      return;
    }

    // Navigation
    const navigationMap: Record<string, string> = {
      Tarot: 'card-fan',
      Daily: 'daily-card',
      Astrology: 'astro',
      Cards: 'cards',
      History: 'reading-history',
      Horoscope: 'horoscope',
      Subscription: 'subscription',
      Services: 'services',
      Stats: 'journal-stats'
    };

    if (navigationMap[action]) {
      onNavigate?.(navigationMap[action]);
    }
  };

  return (
    <div className="home-screen" ref={screenRef}>
      <AnimatePresence>
        {toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}
        {showLevelUpModal && <LevelUpModal level={leveledUpTo} onClose={() => setShowLevelUpModal(false)} t={t} />}
        <StreakBanner
          currentStreak={economy.current_streak}
          isDailyRevealed={isDailyRevealed}
          isDismissed={streakBannerDismissed}
          onDismiss={dismissBanner}
          onNavigate={onNavigate || (() => {})}
        />
      </AnimatePresence>

      {isUserAdmin && (
        <div className="admin-buttons-container">
          <button onClick={() => onNavigate?.('admin')} className="admin-btn admin-panel-btn" title="Admin Panel">
            <Shield size={20} />
          </button>
          <button onClick={() => setShowDebug(true)} className="admin-btn debug-btn" title="Debug Panel">
            <Bug size={20} />
          </button>
          <button onClick={() => setShowLayoutDebug(true)} className="admin-btn layout-btn" title="Layout Debugger">
            <Ruler size={20} />
          </button>
        </div>
      )}

      <UserHeader
        user={user}
        economy={economy}
        activeSubscription={activeSubscription}
        userLevelData={userLevelData}
        circumference={circumference}
        strokeDashoffset={strokeDashoffset}
        onNavigate={onNavigate || (() => {})}
        onOpenShop={() => setIsShopOpen(true)}
        onRefillEnergy={handleRefillEnergy}
        isClaiming={isClaiming}
      />

      <div className="quests-and-actions-split">
        <QuestsPanel
          questsLoading={questsLoading}
          dailyQuests={dailyQuests}
          activeDailyQuest={activeDailyQuest}
          isClaimingQuest={isClaimingQuest}
          onOpenModal={() => setShowQuestModal(true)}
          onClaimQuest={handleClaimQuest}
        />

        <ActionButtons
          rewardClaimed={rewardClaimed}
          isClaiming={isClaiming}
          currentStreak={economy.current_streak}
          unclaimedMilestoneCount={unclaimedMilestoneCount}
          activeSubscription={activeSubscription}
          onClaimReward={handleClaimReward}
          onOpenStreak={() => setShowStreakModal(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onNavigate={onNavigate || (() => {})}
        />
      </div>

      <QuestModal
        isOpen={showQuestModal}
        onClose={() => setShowQuestModal(false)}
        dailyQuests={dailyQuests}
        isClaimingQuest={isClaimingQuest}
        onClaimQuest={handleClaimQuest}
      />

      <DailyCardBanner
        dailyCard={dailyCard}
        isDailyReversed={isDailyReversed}
        isDailyRevealed={isDailyRevealed}
        onNavigate={onNavigate || (() => {})}
      />

      <QuickActions
        activeSubscription={activeSubscription}
        onAction={handleQuickAction}
        showToast={showToast}
        onNavigate={onNavigate || (() => {})}
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
            reloadFromDatabase();
          }}
        />
      )}

      <StreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        currentStreak={economy.current_streak}
        onMilestoneClaimed={() => {
          showToast('Milestones claimed!', 'success');
          confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 } });
          reloadFromDatabase();
        }}
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
          dbDebugInfo={null}
          debugLogs={[]}
          dbStatus="connected"
          activeSubscription={activeSubscription}
          questsLoading={questsLoading}
          dailyQuests={dailyQuests}
          activeDailyQuest={activeDailyQuest}
          isClaimingQuest={isClaimingQuest}
          timeLeft=""
          showQuestModal={showQuestModal}
          rewardClaimed={rewardClaimed}
          isClaiming={isClaiming}
          currentStreak={economy.current_streak}
          setDebugLogs={() => {}}
          checkDatabaseStatus={() => {}}
          refreshUserDataDebug={() => {}}
          handleLogoutAndReset={() => {}}
          testAddCoins={() => {}}
          testAddXP={() => {}}
          testAddEnergy={() => {}}
          testSpendEnergy={() => {}}
          testCompleteQuest={() => {}}
          reloadFromDatabase={reloadFromDatabase}
          testAddXPWithLevel={() => {}}
          forceRecalcLevel={() => {}}
          xpTestLogs={[]}
        />
      )}

      <HomeLayoutDebugger open={showLayoutDebug} onClose={() => setShowLayoutDebug(false)} />
    </div>
  );
}