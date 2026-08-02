import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Gem, Sparkles } from 'lucide-react';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
}

export default function StreakModal({ isOpen, onClose, currentStreak }: StreakModalProps) {
  const milestones = [
    { days: 3, reward: 50, icon: '🔥', claimed: currentStreak >= 3 },
    { days: 7, reward: 200, icon: '⭐', claimed: currentStreak >= 7 },
    { days: 14, reward: 500, icon: '💫', claimed: currentStreak >= 14 },
    { days: 30, reward: 2000, icon: '👑', claimed: currentStreak >= 30, isSpecial: true },
  ];

  const nextMilestone = milestones.find(m => !m.claimed);
  const progressToNext = nextMilestone ? Math.min((currentStreak / nextMilestone.days) * 100, 100) : 100;

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
            padding: '20px',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '380px',
              maxHeight: '85vh',
              borderRadius: '24px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
              border: '1px solid rgba(197, 160, 89, 0.3)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(197, 160, 89, 0.1)'
            }}
          >
            {/* Header */}
            <div
              style={{
                position: 'relative',
                padding: '32px 24px 24px 24px',
                textAlign: 'center',
                flexShrink: 0,
                borderBottom: '1px solid rgba(197, 160, 89, 0.2)'
              }}
            >
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                  padding: '8px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.4)', color: '#94a3b8', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>

              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '0 0 16px rgba(255, 107, 53, 0.45)',
                    '0 0 28px rgba(255, 107, 53, 0.7)',
                    '0 0 16px rgba(255, 107, 53, 0.45)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '80px', height: '80px', borderRadius: '50%', marginBottom: '16px',
                  background: 'rgba(255, 107, 53, 0.18)',
                  border: '2px solid rgba(255, 107, 53, 0.5)'
                }}
              >
                <Flame size={40} style={{ color: '#ff6b35' }} />
              </motion.div>

              <h2
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#ffe566',
                  fontFamily: 'Georgia, serif',
                  textShadow: '0 0 20px rgba(255, 229, 102, 0.3)'
                }}
              >
                {currentStreak} Day{currentStreak !== 1 ? 's' : ''} Streak!
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#b3a68c' }}>
                Consecutive days of activity
              </p>
            </div>

            {/* Progress Bar */}
            {nextMilestone && (
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(197, 160, 89, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#C5A059' }}>
                    Next reward: {nextMilestone.days} days
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {currentStreak}/{nextMilestone.days}
                  </span>
                </div>
                <div style={{ height: '8px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNext}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: '999px',
                      background: 'linear-gradient(90deg, #ff6b35, #ffe566)'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Milestones List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '40vh' }}>
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px', borderRadius: '14px', border: '1px solid',
                    background: milestone.claimed
                      ? 'rgba(16, 185, 129, 0.1)'
                      : milestone.isSpecial
                        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(197, 160, 89, 0.05))'
                        : 'rgba(255, 255, 255, 0.02)',
                    borderColor: milestone.claimed
                      ? 'rgba(16, 185, 129, 0.3)'
                      : milestone.isSpecial
                        ? 'rgba(255, 215, 0, 0.3)'
                        : 'rgba(255, 255, 255, 0.06)',
                    opacity: milestone.claimed ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '40px', height: '40px', borderRadius: '50%', fontSize: '18px',
                        background: 'rgba(197, 160, 89, 0.15)',
                        border: '1px solid rgba(197, 160, 89, 0.3)'
                      }}
                    >
                      {milestone.claimed ? '✅' : milestone.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        {milestone.days} Days {milestone.isSpecial && <Sparkles size={12} style={{ color: '#FFD700' }} />}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {milestone.claimed ? 'Claimed' : 'Locked'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gem size={14} style={{ color: milestone.claimed ? '#10b981' : '#ffe566' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: milestone.claimed ? '#10b981' : '#ffe566' }}>
                      {milestone.reward}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom Button */}
            <div style={{ padding: '16px', flexShrink: 0, borderTop: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                  fontSize: '14px', fontWeight: 700, letterSpacing: '0.3px', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)',
                  color: '#0f0c08',
                  boxShadow: '0 4px 20px rgba(197, 160, 89, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              >
                Keep the Streak Alive
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}