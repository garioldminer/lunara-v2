import { motion } from 'framer-motion';
import { Gift, Trophy, Crown, Infinity as InfinityIcon } from 'lucide-react';

interface ActionButtonsProps {
  currentStreak: number;
  rewardClaimed: boolean;
  isClaiming: boolean;
  activeSubscription: any;
  unclaimedMilestoneCount: number;
  onClaimReward: () => void;
  onOpenStreakModal: () => void;
  onOpenLeaderboard: () => void;
  onNavigateSubscription: () => void;
  getStreakTierIcon: () => string;
}

export function ActionButtons({
  currentStreak,
  rewardClaimed,
  isClaiming,
  activeSubscription,
  unclaimedMilestoneCount,
  onClaimReward,
  onOpenStreakModal,
  onOpenLeaderboard,
  onNavigateSubscription,
  getStreakTierIcon
}: ActionButtonsProps) {
  return (
    <div className="action-buttons-panel" style={{ flex: '0 0 calc(40% - 2px)', minWidth: 0 }}>
      <div className="action-grid-vertical">
        <button className={`action-btn-vertical ${rewardClaimed ? 'claimed' : ''}`} onClick={onClaimReward} disabled={rewardClaimed || isClaiming}>
          {isClaiming ? (
            <svg className="animate-spin" style={{ width: '20px', height: '20px', color: '#C5A059' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Gift size={22} style={{ filter: 'drop-shadow(0 0 6px #C5A059)', color: '#C5A059', width: '20px', height: '20px' }} />
          )}
          {!rewardClaimed && !isClaiming && <div className="action-badge">50</div>}
        </button>
        
        <button 
          className="action-btn-vertical streak-btn-v" 
          onClick={onOpenStreakModal}
        >
          <div style={{ fontSize: '22px', lineHeight: 1, filter: 'drop-shadow(0 0 6px #ff6b35)' }}>
            {getStreakTierIcon()}
          </div>
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
        
        <button 
          className="action-btn-vertical rank-btn-v" 
          onClick={onOpenLeaderboard}
        >
          <Trophy size={22} style={{ filter: 'drop-shadow(0 0 6px #ffd700)', color: '#ffd700', width: '20px', height: '20px' }} />
          <div className="action-badge">TOP</div>
        </button>
        
        <button className={`action-btn-vertical ${activeSubscription ? 'subscription-btn-v' : 'upgrade-btn-v'}`} onClick={onNavigateSubscription}>
          {activeSubscription ? (
            <><InfinityIcon size={22} style={{ filter: 'drop-shadow(0 0 6px #FFD700)', color: '#FFD700', width: '20px', height: '20px' }} /><div className="action-badge premium">VIP</div></>
          ) : (
            <><Crown size={22} style={{ filter: 'drop-shadow(0 0 6px #a78bfa)', color: '#a78bfa', width: '20px', height: '20px' }} /><div className="action-badge">PRO</div></>
          )}
        </button>
      </div>
    </div>
  );
}