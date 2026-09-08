import { motion } from 'framer-motion';
import { Lock, Sparkles, Gem, Star, Crown } from 'lucide-react';

interface StreakMilestone {
  id: number;
  days_required: number;
  name: string;
  icon_emoji: string;
  reward_coins: number;
  reward_xp: number;
  reward_premium_days: number;
  description: string;
  is_active: boolean;
  sort_order: number;
}

interface MilestonesListProps {
  milestones: StreakMilestone[];
  claimedMilestoneIds: Set<number>;
  achievedNotClaimedIds: Set<number>;
  loading: boolean;
}

export function MilestonesList({ 
  milestones, 
  claimedMilestoneIds, 
  achievedNotClaimedIds,
  loading 
}: MilestonesListProps) {
  if (milestones.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '11px' }}>
        {loading ? 'Loading milestones...' : 'No milestones available'}
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px 12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {milestones.map((milestone) => {
        const isClaimed = claimedMilestoneIds.has(milestone.id);
        const isClaimable = achievedNotClaimedIds.has(milestone.id);
        const isLocked = !isClaimed && !isClaimable;
        const isSpecial = milestone.reward_premium_days > 0;

        return (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              position: 'relative',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '10px 12px', 
              borderRadius: '12px',
              background: isClaimed 
                ? 'rgba(16, 185, 129, 0.1)' 
                : isClaimable
                ? 'rgba(251, 191, 36, 0.08)'
                : (isSpecial ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(197, 160, 89, 0.05))' : 'rgba(255, 255, 255, 0.02)'),
              border: isClaimed 
                ? '1px solid rgba(16, 185, 129, 0.3)' 
                : isClaimable
                ? '1px solid rgba(251, 191, 36, 0.4)'
                : (isSpecial ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)'),
              opacity: isClaimed ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '36px', height: '36px', borderRadius: '50%',
                  fontSize: '18px', flexShrink: 0,
                  background: isClaimed ? 'rgba(16, 185, 129, 0.2)' : isClaimable ? 'rgba(251, 191, 36, 0.2)' : 'rgba(197, 160, 89, 0.15)',
                  border: `1px solid ${isClaimed ? 'rgba(16, 185, 129, 0.4)' : isClaimable ? 'rgba(251, 191, 36, 0.5)' : 'rgba(197, 160, 89, 0.3)'}`
                }}
              >
                {isClaimed ? '✅' : isLocked ? <Lock size={14} style={{ color: '#94a3b8' }} /> : milestone.icon_emoji}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {milestone.days_required} Days • {milestone.name}
                  {isSpecial && <Sparkles size={10} style={{ color: '#FFD700' }} />}
                </div>
                <div style={{ fontSize: '10px', color: isClaimed ? '#10b981' : isClaimable ? '#fbbf24' : '#94a3b8' }}>
                  {isClaimed ? 'Claimed ✓' : isClaimable ? 'Ready to claim!' : milestone.description}
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              {milestone.reward_coins > 0 && (
                <div style={{ fontSize: '11px', fontWeight: 700, color: isClaimed ? '#10b981' : '#ffe566', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Gem size={10} />
                  {milestone.reward_coins}
                </div>
              )}
              {milestone.reward_xp > 0 && (
                <div style={{ fontSize: '10px', fontWeight: 600, color: isClaimed ? '#10b981' : '#a78bfa', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Star size={9} />
                  {milestone.reward_xp} XP
                </div>
              )}
              {milestone.reward_premium_days > 0 && (
                <div style={{ fontSize: '10px', fontWeight: 600, color: isClaimed ? '#10b981' : '#FFD700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Crown size={9} />
                  {milestone.reward_premium_days}d Premium
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}