import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle, RefreshCw } from 'lucide-react';
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
import { StreakHeader } from './home/components/streak/StreakHeader';
import { StreakProgress } from './home/components/streak/StreakProgress';
import { StreakCalendar } from './home/components/streak/StreakCalendar';
import { MilestonesList } from './home/components/streak/MilestonesList';
import { CelebrationModal } from './home/components/streak/CelebrationModal';

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
  const [achievedNotClaimedIds, setAchievedNotClaimedIds] = useState<Set<number>>(new Set());
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
        const [info, msList, claimed, cal] = await Promise.all([
          getStreakInfo(user.id),
          getStreakMilestones(),
          getClaimedMilestones(user.id),
          getStreakCalendar(user.id, 30)
        ]);
        
        setStreakInfo(info);
        setMilestones(msList);
        setClaimedMilestoneIds(new Set(claimed.map(c => c.milestone_id)));
        setAchievedNotClaimedIds(new Set((info?.achieved_not_claimed || []).map(m => m.id)));
        setCalendar(cal);
        
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
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#10b981', '#ffe566']
        });
        
        setCelebration({
          milestones: result.data.milestones_claimed,
          total_coins: result.data.total_coins,
          total_xp: result.data.total_xp
        });
        
        const newClaimedIds = new Set(claimedMilestoneIds);
        result.data.milestones_claimed.forEach(m => newClaimedIds.add(m.milestone_id));
        setClaimedMilestoneIds(newClaimedIds);
        setAchievedNotClaimedIds(new Set());
        
        const updatedInfo = await getStreakInfo(user.id);
        if (updatedInfo) setStreakInfo(updatedInfo);
        
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
  const streak = streakInfo?.current_streak ?? currentStreak;
  const longest = streakInfo?.longest_streak ?? 0;
  const achievedCount = achievedNotClaimedIds.size;

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
            <StreakHeader streak={streak} longest={longest} onClose={onClose} />

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <StreakProgress
                nextMilestone={streakInfo?.next_milestone}
                streak={streak}
                percentToNext={streakInfo?.percent_to_next ?? 0}
                daysToNext={streakInfo?.days_to_next ?? 0}
              />

              <StreakCalendar calendar={calendar} loading={loading} />

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

              <MilestonesList
                milestones={milestones}
                claimedMilestoneIds={claimedMilestoneIds}
                achievedNotClaimedIds={achievedNotClaimedIds}
                loading={loading}
              />
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

          <CelebrationModal celebration={celebration} onClose={() => setCelebration(null)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}