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
            padding: '16px', // შემცირებულია 20px-დან
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
              maxWidth: '360px', // ოდნავ ვიწრო მობილურისთვის
              maxHeight: '85vh',
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
                padding: '24px 20px 20px 20px', // შემცირებული padding
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

              {/* Pulsing Flame Icon */}
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
                    border: '1px solid rgba(255, 107, 53, 0.6)'
                  }}
                >
                  <Flame size={22} style={{ color: '#3a1a00' }} />
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
                {currentStreak} Day{currentStreak !== 1 ? 's' : ''} Streak!
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                Consecutive days of cosmic activity
              </p>
            </div>

            {/* Progress Bar */}
            {nextMilestone && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(197, 160, 89, 0.15)', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#C5A059' }}>Next: {nextMilestone.days} days</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{currentStreak}/{nextMilestone.days}</span>
                </div>
                <div style={{ height: '5px', borderRadius: '999px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNext}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ 
                      height: '100%', 
                      borderRadius: '999px', 
                      background: 'linear-gradient(90deg, #ff6b35, #ffe566)',
                      boxShadow: '0 0 8px rgba(255, 229, 102, 0.5)'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Milestones List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: '12px',
                    background: milestone.claimed 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : (milestone.isSpecial ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(197, 160, 89, 0.05))' : 'rgba(255, 255, 255, 0.02)'),
                    border: milestone.claimed 
                      ? '1px solid rgba(16, 185, 129, 0.3)' 
                      : (milestone.isSpecial ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)'),
                    opacity: milestone.claimed ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '36px', height: '36px', borderRadius: '50%',
                        fontSize: '16px', flexShrink: 0,
                        background: milestone.claimed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(197, 160, 89, 0.15)',
                        border: `1px solid ${milestone.claimed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(197, 160, 89, 0.3)'}`
                      }}
                    >
                      {milestone.claimed ? '✅' : milestone.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {milestone.days} Days {milestone.isSpecial && <Sparkles size={10} style={{ color: '#FFD700' }} />}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {milestone.claimed ? 'Claimed' : 'Locked'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: milestone.claimed ? '#10b981' : '#ffe566', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                      <Gem size={12} />
                      {milestone.reward}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 16px 16px 16px', flexShrink: 0, borderTop: '1px solid rgba(197, 160, 89, 0.15)' }}>
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
                Keep the Streak Alive
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}