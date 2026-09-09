import { motion } from 'framer-motion';
import { Lock, Sparkles, Gem, Star, Crown, Check, TrendingUp } from 'lucide-react';

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
  currentStreak: number;
}

export function MilestonesList({ 
  milestones, 
  claimedMilestoneIds, 
  achievedNotClaimedIds,
  loading,
  currentStreak
}: MilestonesListProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '10px' }}>
        Loading milestones...
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '10px' }}>
        No milestones available
      </div>
    );
  }

  // Categorize milestones
  const claimedMilestones = milestones.filter(m => claimedMilestoneIds.has(m.id));
  const claimableMilestones = milestones.filter(m => achievedNotClaimedIds.has(m.id));
  const lockedMilestones = milestones.filter(m => !claimedMilestoneIds.has(m.id) && !achievedNotClaimedIds.has(m.id));
  
  // Find next locked milestone (closest to current streak)
  const nextMilestone = lockedMilestones[0]; // already sorted by sort_order

  return (
    <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      {/* ============================================ */}
      {/* SECTION 1: CLAIMABLE HERO (if any)           */}
      {/* ============================================ */}
      {claimableMilestones.length > 0 && (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginBottom: '8px',
            fontSize: '9px',
            fontWeight: 700,
            color: '#fbbf24',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            <Sparkles size={10} />
            <span>Ready to Claim</span>
            <div style={{ 
              flex: 1, 
              height: '1px', 
              background: 'linear-gradient(90deg, rgba(251, 191, 36, 0.3), transparent)'
            }} />
          </div>
          
          {claimableMilestones.map((milestone) => (
            <motion.div
              key={milestone.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                position: 'relative',
                padding: '12px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 191, 36, 0.04) 100%)',
                border: '1.5px solid rgba(251, 191, 36, 0.4)',
                boxShadow: '0 0 20px rgba(251, 191, 36, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                overflow: 'hidden'
              }}
            >
              {/* Pulsing background effect */}
              <motion.div
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-20%',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2), transparent)',
                  pointerEvents: 'none'
                }}
              />

              <div style={{ position: 'relative', display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Icon */}
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 30%, rgba(251, 191, 36, 0.4), rgba(251, 191, 36, 0.1))',
                  border: '2px solid rgba(251, 191, 36, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  flexShrink: 0,
                  boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)'
                }}>
                  {milestone.icon_emoji}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: 800, 
                    color: '#fff',
                    marginBottom: '2px'
                  }}>
                    {milestone.days_required} Days • {milestone.name}
                  </div>
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#fbbf24',
                    fontWeight: 600
                  }}>
                    {milestone.description}
                  </div>
                  
                  {/* Rewards inline */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {milestone.reward_coins > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#ffe566', fontWeight: 700 }}>
                        <Gem size={10} /> {milestone.reward_coins}
                      </div>
                    )}
                    {milestone.reward_xp > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#a78bfa', fontWeight: 700 }}>
                        <Star size={10} /> {milestone.reward_xp}
                      </div>
                    )}
                    {milestone.reward_premium_days > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#FFD700', fontWeight: 700 }}>
                        <Crown size={10} /> {milestone.reward_premium_days}d
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION 2: PAST GLORIES (Compact Badges)     */}
      {/* ============================================ */}
      {claimedMilestones.length > 0 && (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginBottom: '6px',
            fontSize: '9px',
            fontWeight: 700,
            color: '#10b981',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            <Check size={10} />
            <span>Past Glories</span>
            <div style={{ 
              flex: 1, 
              height: '1px', 
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.3), transparent)'
            }} />
          </div>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '5px'
          }}>
            {claimedMilestones.map((milestone) => (
              <div
                key={milestone.id}
                title={`${milestone.days_required} Days • ${milestone.name}`}
                style={{
                  aspectRatio: '1',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '4px'
                }}
              >
                <span style={{ fontSize: '18px' }}>{milestone.icon_emoji}</span>
                <span style={{ fontSize: '8px', color: '#10b981', fontWeight: 700 }}>
                  {milestone.days_required}d
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION 3: NEXT UP (Compact Journey)         */}
      {/* ============================================ */}
      {lockedMilestones.length > 0 && (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginBottom: '6px',
            fontSize: '9px',
            fontWeight: 700,
            color: '#94a3b8',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            <TrendingUp size={10} />
            <span>Journey Ahead</span>
            <div style={{ 
              flex: 1, 
              height: '1px', 
              background: 'linear-gradient(90deg, rgba(148, 163, 184, 0.2), transparent)'
            }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {lockedMilestones.map((milestone, idx) => {
              const isFirst = idx === 0;
              const progress = isFirst ? Math.min((currentStreak / milestone.days_required) * 100, 99) : 0;
              
              return (
                <div
                  key={milestone.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: isFirst 
                      ? 'rgba(197, 160, 89, 0.06)' 
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isFirst 
                      ? '1px solid rgba(197, 160, 89, 0.2)' 
                      : '1px solid rgba(255, 255, 255, 0.04)',
                    opacity: isFirst ? 1 : 0.6
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isFirst ? 'rgba(197, 160, 89, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                    border: isFirst ? '1px solid rgba(197, 160, 89, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative'
                  }}>
                    {isFirst ? (
                      <span style={{ fontSize: '16px' }}>{milestone.icon_emoji}</span>
                    ) : (
                      <Lock size={12} style={{ color: '#64748b' }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: isFirst ? '4px' : '0'
                    }}>
                      <div style={{ 
                        fontSize: '11px', 
                        fontWeight: 600, 
                        color: isFirst ? '#fff' : '#94a3b8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {milestone.days_required} Days • {milestone.name}
                      </div>
                      {isFirst && (
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                          {currentStreak}/{milestone.days_required}
                        </div>
                      )}
                    </div>
                    
                    {isFirst && (
                      <div style={{ 
                        height: '3px', 
                        borderRadius: '999px', 
                        background: 'rgba(255, 255, 255, 0.05)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #C5A059, #ffe566)',
                          borderRadius: '999px'
                        }} />
                      </div>
                    )}
                    
                    {!isFirst && (
                      <div style={{ 
                        fontSize: '9px', 
                        color: '#64748b',
                        display: 'flex',
                        gap: '8px',
                        marginTop: '2px'
                      }}>
                        {milestone.reward_coins > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Gem size={8} /> {milestone.reward_coins}
                          </span>
                        )}
                        {milestone.reward_premium_days > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Crown size={8} /> {milestone.reward_premium_days}d
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}