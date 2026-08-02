import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Calendar, Gem, Sparkles } from 'lucide-react';

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
  const progressToNext = nextMilestone 
    ? Math.min((currentStreak / nextMilestone.days) * 100, 100) 
    : 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
              border: '1px solid rgba(197, 160, 89, 0.4)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(255, 107, 53, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Section */}
            <div 
              className="relative pt-8 pb-6 px-6 text-center"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(197, 160, 89, 0.1) 100%)',
                borderBottom: '1px solid rgba(197, 160, 89, 0.2)'
              }}
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full transition-all hover:scale-110"
                style={{ 
                  background: 'rgba(0,0,0,0.4)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8'
                }}
              >
                <X size={18} />
              </button>

              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  filter: [
                    'drop-shadow(0 0 15px rgba(255, 107, 53, 0.6))',
                    'drop-shadow(0 0 25px rgba(255, 107, 53, 0.9))',
                    'drop-shadow(0 0 15px rgba(255, 107, 53, 0.6))'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.3), rgba(255, 165, 0, 0.2))',
                  border: '2px solid rgba(255, 107, 53, 0.5)'
                }}
              >
                <Flame size={40} style={{ color: '#ff6b35' }} />
              </motion.div>

              <h2 
                className="text-3xl font-bold mb-2 tracking-wide" 
                style={{ 
                  color: '#ffe566', 
                  fontFamily: 'Georgia, serif',
                  textShadow: '0 0 20px rgba(255, 229, 102, 0.3)'
                }}
              >
                {currentStreak} Day{currentStreak !== 1 ? 's' : ''} Streak!
              </h2>
              <p className="text-sm" style={{ color: '#b3a68c' }}>
                Consecutive days of activity
              </p>
            </div>

            {/* Progress to next reward */}
            {nextMilestone && (
              <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(197, 160, 89, 0.15)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold" style={{ color: '#C5A059' }}>
                    Next reward: {nextMilestone.days} days
                  </span>
                  <span className="text-xs" style={{ color: '#94a3b8' }}>
                    {currentStreak}/{nextMilestone.days}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNext}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ 
                      background: 'linear-gradient(90deg, #ff6b35, #ffe566)',
                      boxShadow: '0 0 10px rgba(255, 229, 102, 0.5)'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Milestones List */}
            <div className="px-4 py-4 space-y-2 max-h-[40vh] overflow-y-auto">
              {milestones.map((milestone, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{ 
                    background: milestone.claimed 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : milestone.isSpecial 
                        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(197, 160, 89, 0.05))'
                        : 'rgba(255, 255, 255, 0.02)',
                    border: milestone.claimed 
                      ? '1px solid rgba(16, 185, 129, 0.3)' 
                      : milestone.isSpecial
                        ? '1px solid rgba(255, 215, 0, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                    opacity: milestone.claimed ? 0.6 : 1
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center justify-center w-10 h-10 rounded-full text-lg"
                      style={{ 
                        background: milestone.claimed 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'rgba(197, 160, 89, 0.15)',
                        border: `1px solid ${milestone.claimed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(197, 160, 89, 0.3)'}`
                      }}
                    >
                      {milestone.claimed ? '✅' : milestone.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold flex items-center gap-1" style={{ color: '#fff' }}>
                        {milestone.days} Days
                        {milestone.isSpecial && <Sparkles size={12} style={{ color: '#FFD700' }} />}
                      </div>
                      <div className="text-xs" style={{ color: '#94a3b8' }}>
                        {milestone.claimed ? 'Claimed' : 'Locked'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Gem size={14} style={{ color: milestone.claimed ? '#10b981' : '#ffe566' }} />
                    <span className="text-sm font-bold" style={{ color: milestone.claimed ? '#10b981' : '#ffe566' }}>
                      {milestone.reward}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom Button */}
            <div className="p-4" style={{ borderTop: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <button 
                onClick={onClose}
                className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
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