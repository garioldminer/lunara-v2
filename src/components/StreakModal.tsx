import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Gem, Sparkles, Lock, CheckCircle, RefreshCw, Calendar as CalendarIcon, Trophy, Crown, Star, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useUser } from '../context/UserContext';
import { 
  getStreakInfo, 
  getStreakMilestones, 
  getClaimedMilestones, 
  getStreakCalendar,
  claimStreakMilestone,
  type StreakMilestone,
  type StreakInfo,
  type CalendarDay
} from '../lib/streakService';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  onMilestoneClaimed?: (data: { total_coins: number; total_xp: number; total_premium_days: number }) => void;
}

export default function StreakModal({ isOpen, onClose, currentStreak, onMilestoneClaimed }: StreakModalProps) {
  const { user } = useUser();
  
  // ============================================
  // STATE
  // ============================================
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [milestones, setMilestones] = useState<StreakMilestone[]>([]);
  const [claimedMilestoneIds, setClaimedMilestoneIds] = useState<Set<number>>(new Set());
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [celebration, setCelebration] = useState<{
    milestones: Array<{ name: string; icon: string; coins: number; xp: number; premium_days: number }>;
    total_coins: number;
    total_xp: number;
  } | null>(null);

  // ============================================
  // LOAD DATA WHEN MODAL OPENS
  // ============================================
  useEffect(() => {
    if (!isOpen || !user) return;
    
    const loadData = async () => {
      setLoading(true);
      setMessage(null);
      
      try {
        // Parallel load
        const [info, msList, claimed, cal] = await Promise.all([
          getStreakInfo(user.id),
          getStreakMilestones(),
          getClaimedMilestones(user.id),
          getStreakCalendar(user.id, 30)
        ]);
        
        setStreakInfo(info);
        setMilestones(msList);
        setClaimedMilestoneIds(new Set(claimed.map(c => c.milestone_id)));
        setCalendar(cal);
        
        // Auto-check for unclaimed milestones
        if (info && info.achieved_not_claimed.length > 0) {
          setMessage({
            type: 'success',
            text: `🎉 You have ${info.achieved_not_claimed.length} unclaimed reward${info.achieved_not_claimed.length > 1 ? 's' : ''}!`
          });
        }
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isOpen, user]);

  // ============================================
  // CLAIM ALL ACHIEVED MILESTONES
  // ============================================
  const handleClaimAll = async () => {
    if (!user || claiming) return;
    setClaiming(true);
    setMessage(null);
    
    try {
      const result = await claimStreakMilestone();
      
      if (result.success && result.data) {
        // Confetti celebration!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#10b981', '#ffe566']
        });
        
        // Show celebration modal
        setCelebration({
          milestones: result.data.milestones_claimed,
          total_coins: result.data.total_coins,
          total_xp: result.data.total_xp
        });
        
        // Update local state
        const newClaimedIds = new Set(claimedMilestoneIds);
        result.data.milestones_claimed.forEach(m => newClaimedIds.add(m.milestone_id));
        setClaimedMilestoneIds(newClaimedIds);
        
        // Refresh streak info
        const updatedInfo = await getStreakInfo(user.id);
        if (updatedInfo) setStreakInfo(updatedInfo);
        
        // Callback to parent
        onMilestoneClaimed?.({
          total_coins: result.data.total_coins,
          total_xp: result.data.total_xp,
          total_premium_days: result.data.total_premium_days
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to claim' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
    
    setClaiming(false);
  };

  // ============================================
  // PROGRESS CALCULATION
  // ============================================
  const nextMilestone = streakInfo?.next_milestone;
  const achievedCount = streakInfo?.achieved_not_claimed.length || 0;
  const streak = streakInfo?.current_streak ?? currentStreak;
  const longest = streakInfo?.longest_streak ?? 0;
  const percentToNext = streakInfo?.percent_to_next ?? 0;

  // ============================================
  // HELPER: Get current tier icon
  // ============================================
  const getCurrentTierIcon = () => {
    if (streak >= 100) return '💎';
    if (streak >= 60) return '🏆';
    if (streak >= 30) return '👑';
    if (streak >= 14) return '⭐';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '🌱';
    return '🔥';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '400px',
              maxHeight: '90vh',
              borderRadius: '20px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(180deg, #171209 0%, #0c0a06 100%)',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(197, 160, 89, 0.1)'
            }}
          >
            {/* Header */}
            <div
              style={{
                position: 'relative',
                padding: '24px 20px 20px 20px',
                textAlign: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                background: 'radial-gradient(120% 100% at 50% 0%, rgba(255, 107, 53, 0.15) 0%, rgba(15,12,8,0) 65%)',
                borderBottom: '1px solid rgba(197, 160, 89, 0.18)'
              }}
            >
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                  padding: '6px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.4)', color: '#94a3b8', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>

              {/* Pulsing Flame Icon with Tier */}
              <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 12px auto' }}>
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 10px rgba(255, 107, 53, 0.45)',
                      '0 0 20px rgba(255, 107, 53, 0.75)',
                      '0 0 10px rgba(255, 107, 53, 0.45)'
                    ]
                  }}
                  transition={{ duration: 3.2, repeat: Infinity }}
                  style={{
                    position: 'absolute', inset: 16, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'radial-gradient(circle at 35% 30%, #ffcc80, #ff6b35 55%, #b84a00)',
                    border: '1px solid rgba(255, 107, 53, 0.6)',
                    fontSize: '24px'
                  }}
                >
                  {getCurrentTierIcon()}
                </motion.div>
              </div>

              <h2
                style={{
                  margin: '0 0 6px 0',
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  color: '#ffe566',
                  fontFamily: 'Georgia, serif',
                  textShadow: '0 0 20px rgba(255, 229, 102, 0.3)'
                }}
              >
                {streak} Day{streak !== 1 ? 's' : ''} Streak!
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                Longest: {longest} days
              </p>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Progress to Next Milestone */}
              {nextMilestone && (
                <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(197, 160, 89, 0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#C5A059', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Next: {nextMilestone.icon_emoji} {nextMilestone.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{streak}/{nextMilestone.days}</span>
                  </div>
                  <div style={{ height: '5px', borderRadius: '999px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentToNext}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      style={{ 
                        height: '100%', 
                        borderRadius: '999px', 
                        background: 'linear-gradient(90deg, #ff6b35, #ffe566)',
                        boxShadow: '0 0 8px rgba(255, 229, 102, 0.5)'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                    {streakInfo?.days_to_next || 0} more days to {nextMilestone.name}
                  </div>
                </div>
              )}

              {/* Calendar Section */}
              <div style={{ padding: '16px 16px 8px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '12px', fontWeight: 600, color: '#C5A059' }}>
                  <CalendarIcon size={14} />
                  <span>Last 30 Days</span>
                </div>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '11px' }}>
                    Loading calendar...
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '4px'
                  }}>
                    {calendar.map((day, idx) => (
                      <div
                        key={idx}
                        title={day.date}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          fontWeight: day.is_today ? 700 : 500,
                          background: day.is_today
                            ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                            : day.has_reading
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : day.is_future
                            ? 'rgba(255,255,255,0.02)'
                            : 'rgba(239, 68, 68, 0.25)',
                          color: day.is_future ? '#64748b' : day.has_reading || day.is_today ? '#fff' : '#fca5a5',
                          border: day.is_today ? '1.5px solid #ffe566' : day.has_reading ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                          boxShadow: day.is_today ? '0 0 8px rgba(251, 191, 36, 0.5)' : 'none'
                        }}
                      >
                        {day.has_reading ? '✓' : day.is_today ? '★' : day.is_future ? '' : '✗'}
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '9px', color: '#94a3b8', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }} />
                    <span>Read</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444' }} />
                    <span>Missed</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#fbbf24' }} />
                    <span>Today</span>
                  </div>
                </div>
              </div>

              {/* Message Banner */}
              {message && (
                <div style={{ padding: '0 16px 8px 16px' }}>
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textAlign: 'center',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    color: message.type === 'success' ? '#10b981' : '#ef4444'
                  }}>
                    {message.text}
                  </div>
                </div>
              )}

              {/* Milestones List */}
              <div style={{ padding: '8px 16px 12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {milestones.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '11px' }}>
                    {loading ? 'Loading milestones...' : 'No milestones available'}
                  </div>
                ) : (
                  milestones.map((milestone) => {
                    const isClaimed = claimedMilestoneIds.has(milestone.id);
                    const isClaimable = streakInfo?.achieved_not_claimed.some(m => m.id === milestone.id) || false;
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
                              {milestone.days} Days • {milestone.name}
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
                  })
                )}
              </div>
            </div>

            {/* Footer - Claim Button */}
            <div style={{ padding: '12px 16px 16px 16px', flexShrink: 0, borderTop: '1px solid rgba(197, 160, 89, 0.15)' }}>
              {achievedCount > 0 ? (
                <button
                  onClick={handleClaimAll}
                  disabled={claiming}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                    fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px',
                    cursor: claiming ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                    color: '#0f0c08',
                    boxShadow: '0 4px 20px rgba(251, 191, 36, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  {claiming ? (
                    <><RefreshCw size={14} className="animate-spin" /> Claiming...</>
                  ) : (
                    <><CheckCircle size={14} /> Claim {achievedCount} Reward{achievedCount > 1 ? 's' : ''}</>
                  )}
                </button>
              ) : (
                <button
                  onClick={onClose}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                    fontSize: '13px', fontWeight: 700, letterSpacing: '0.3px', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)',
                    color: '#0f0c08',
                    boxShadow: '0 4px 15px rgba(197, 160, 89, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                  }}
                >
                  <Flame size={14} style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
                  Keep the Streak Alive
                </button>
              )}
            </div>
          </motion.div>

          {/* 🎉 CELEBRATION MODAL */}
          <AnimatePresence>
            {celebration && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCelebration(null)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 10006,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  background: 'rgba(0,0,0,0.9)',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: 50 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    maxWidth: '360px',
                    width: '100%',
                    background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
                    border: '2px solid #fbbf24',
                    borderRadius: '20px',
                    padding: '32px 24px',
                    textAlign: 'center',
                    boxShadow: '0 0 60px rgba(251, 191, 36, 0.4)'
                  }}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 0.8 }}
                    style={{ fontSize: '64px', marginBottom: '12px' }}
                  >
                    🎉
                  </motion.div>
                  
                  <h2 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '24px', 
                    fontWeight: 800, 
                    color: '#fbbf24',
                    letterSpacing: '0.5px'
                  }}>
                    Milestone Achieved!
                  </h2>
                  
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>
                    You've unlocked:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    {celebration.milestones.map((m, idx) => (
                      <div 
                        key={idx}
                        style={{
                          padding: '12px',
                          background: 'rgba(251, 191, 36, 0.1)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '24px' }}>{m.icon}</span>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{m.name}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                              +{m.coins} coins • +{m.xp} XP
                              {m.premium_days > 0 && ` • +${m.premium_days}d Premium`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(16, 185, 129, 0.2))',
                    border: '1px solid rgba(251, 191, 36, 0.5)',
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Total Rewards</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>
                      +{celebration.total_coins} 💎 • +{celebration.total_xp} ⭐
                    </div>
                  </div>

                  <button
                    onClick={() => setCelebration(null)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                      color: '#0f0c08',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(251, 191, 36, 0.5)'
                    }}
                  >
                    Awesome! 🎉
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}