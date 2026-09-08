import { motion } from 'framer-motion';
import { Gift, Trophy, Crown, Infinity as InfinityIcon, RefreshCw } from 'lucide-react';

interface ActionButtonsProps {
  rewardClaimed: boolean;
  isClaiming: boolean;
  currentStreak: number;
  unclaimedMilestoneCount: number;
  activeSubscription: any;
  onClaimReward: () => void;
  onOpenStreak: () => void;
  onOpenLeaderboard: () => void;
  onNavigate: (screen: string) => void;
}

const getStreakTierIcon = (streak: number): string => {
  if (streak >= 100) return '💎';
  if (streak >= 60) return '🏆';
  if (streak >= 30) return '👑';
  if (streak >= 14) return '⭐';
  if (streak >= 7) return '🔥';
  if (streak >= 3) return '🌱';
  return '🔥';
};

export function ActionButtons({
  rewardClaimed,
  isClaiming,
  currentStreak,
  unclaimedMilestoneCount,
  activeSubscription,
  onClaimReward,
  onOpenStreak,
  onOpenLeaderboard,
  onNavigate
}: ActionButtonsProps) {
  return (
    <div className="action-buttons-panel">
      <div className="action-grid-vertical">
        <button
          className={`action-btn-vertical ${rewardClaimed ? 'claimed' : ''}`}
          onClick={onClaimReward}
          disabled={rewardClaimed || isClaiming}
        >
          {isClaiming ? (
            <RefreshCw size={22} className="spin action-icon-v" />
          ) : (
            <Gift size={22} className="action-icon-v" />
          )}
          {!rewardClaimed && !isClaiming && <div className="action-badge">50</div>}
        </button>

        <button className="action-btn-vertical streak-btn-v" onClick={onOpenStreak}>
          <div className="streak-icon-v">{getStreakTierIcon(currentStreak)}</div>
          <div className="action-badge">{currentStreak}</div>
          
          {unclaimedMilestoneCount > 0 && (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="milestone-badge"
            >
              🎁 {unclaimedMilestoneCount}
            </motion.div>
          )}
        </button>

        <button className="action-btn-vertical rank-btn-v" onClick={onOpenLeaderboard}>
          <Trophy size={22} className="action-icon-v" />
          <div className="action-badge">TOP</div>
        </button>

        <button
          className={`action-btn-vertical ${activeSubscription ? 'subscription-btn-v' : 'upgrade-btn-v'}`}
          onClick={() => onNavigate(activeSubscription ? 'subscription' : 'pricing')}
        >
          {activeSubscription ? (
            <>
              <InfinityIcon size={22} className="action-icon-v" />
              <div className="action-badge premium">VIP</div>
            </>
          ) : (
            <>
              <Crown size={22} className="action-icon-v" />
              <div className="action-badge">PRO</div>
            </>
          )}
        </button>
      </div>
    </div>
  );
}