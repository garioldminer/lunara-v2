import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationData {
  milestones: Array<{
    name: string;
    icon: string;
    coins: number;
    xp: number;
    premium_days: number;
  }>;
  total_coins: number;
  total_xp: number;
}

interface CelebrationModalProps {
  celebration: CelebrationData | null;
  onClose: () => void;
}

export function CelebrationModal({ celebration, onClose }: CelebrationModalProps) {
  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
              onClick={onClose}
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
  );
}