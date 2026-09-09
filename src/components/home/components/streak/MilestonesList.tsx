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
      <div style={{ textAlign: 'center', padding: '12px', color: '#94a3b8', fontSize: '10px' }}>
        {loading ? 'Loading...' : 'No milestones'}
      </div>
    );
  }

  return (
    <div style={{ padding: '6px 12px 10px 12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {milestones.map((milestone) => {
        const isClaimed = claimedMilestoneIds.has(milestone.id);
        const isClaimable = achievedNotClaimedIds.has(milestone.id);
        const isLocked = !isClaimed && !isClaimable;
        const isSpecial = milestone.reward_premium_days > 0;

        return (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '8px 10px', 
              borderRadius: '10px',
              background: isClaimed 
                ? 'rgba(16, 185, 129, 0.08)' 
                : isClaimable
                ? 'rgba(251, 191, 36, 0.06)'
                : (isSpecial ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.06), rgba(197, 160, 89, 0.03))' : 'rgba(255, 255, 255, 0.02)'),
              border: isClaimed 
                ? '1px solid rgba(16, 185, 129, 0.25)' 
                : isClaimable
                ? '1px solid rgba(251, 191, 36, 0.35)'
                : (isSpecial ? '1px solid rgba(255, 215, 0, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)'),
              opacity: isClaimed ? 0.5 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '28px', height: '28px', borderRadius: '50%',
                  fontSize: '14px', flexShrink: 0,
                  background: isClaimed ? 'rgba(16, 185, 129, 0.15)' : isClaimable ? 'rgba(251, 191, 36, 0.15)' : 'rgba(197, 160, 89, 0.1)',
                  border: `1px solid ${isClaimed ? 'rgba(16, 185, 129, 0.3)' : isClaimable ? 'rgba(251, 191, 36, 0.4)' : 'rgba(197, 160, 89, 0.2)'}`
                }}
              >
                {isClaimed ? '✅' : isLocked ? <Lock size={11} style={{ color: '#94a3b8' }} /> : milestone.icon_emoji}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {milestone.days_required} Days • {milestone.name}
                  {isSpecial && <Sparkles size={9} style={{ color: '#FFD700' }} />}
                </div>
                <div style={{ fontSize: '9px', color: isClaimed ? '#10b981' : isClaimable ? '#fbbf24' : '#94a3b8' }}>
                  {isClaimed ? 'Claimed ✓' : isClaimable ? 'Ready!' : milestone.description}
                </div>
              </div>
            </div>

            {/* Compact Rewards */}
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              {milestone.reward_coins > 0 && (
                <div style={{ fontSize: '9px', fontWeight: 600, color: isClaimed ? '#10b981' : '#ffe566', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Gem size={8} />
                  {milestone.reward_coins}
                </div>
              )}
              {milestone.reward_xp > 0 && (
                <div style={{ fontSize: '9px', fontWeight: 600, color: isClaimed ? '#10b981' : '#a78bfa', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Star size={8} />
                  {milestone.reward_xp}
                </div>
              )}
              {milestone.reward_premium_days > 0 && (
                <div style={{ fontSize: '9px', fontWeight: 600, color: isClaimed ? '#10b981' : '#FFD700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Crown size={8} />
                  {milestone.reward_premium_days}d
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}