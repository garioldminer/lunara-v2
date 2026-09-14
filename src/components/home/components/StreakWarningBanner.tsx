import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, X } from 'lucide-react';
import { getStreakWarning, type StreakWarning } from '../lib/helpers';

interface StreakWarningBannerProps {
  lastActiveDate: string | null;
  onNavigate: (screen: string) => void;
  onDismiss: () => void;
}

export function StreakWarningBanner({ lastActiveDate, onNavigate, onDismiss }: StreakWarningBannerProps) {
  const warning: StreakWarning = getStreakWarning(lastActiveDate);

  return (
    <AnimatePresence>
      {warning.dangerLevel !== 'safe' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            pointerEvents: 'none'
          }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: '340px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(30, 10, 10, 0.97), rgba(20, 8, 8, 0.97))',
              border: `1.5px solid ${warning.borderColor}`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 30px ${warning.bgColor}`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {warning.dangerLevel === 'critical' && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, transparent, ${warning.color}, transparent)`
                }}
              />
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(); }}
              style={{
                position: 'absolute', top: '8px', right: '8px', zIndex: 2,
                padding: '4px', borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={12} />
            </button>

            <div
              onClick={() => onNavigate('daily-card')}
              style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            >
              <motion.div
                animate={warning.dangerLevel === 'critical' ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] } : {}}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ fontSize: '30px', flexShrink: 0 }}
              >
                {warning.icon}
              </motion.div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: warning.color, marginBottom: '3px', letterSpacing: '0.3px' }}>
                  {warning.message}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} />
                  <span>Tap to draw your daily card</span>
                </div>
              </div>

              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: warning.color,
                  color: '#0f0c08',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}
              >
                <Zap size={10} />
                DRAW
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}