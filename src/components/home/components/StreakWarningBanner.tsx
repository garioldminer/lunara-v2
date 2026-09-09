import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { getStreakWarning, type StreakWarning } from '../lib/helpers';

interface StreakWarningBannerProps {
  lastActiveDate: string | null;
  onNavigate: (screen: string) => void;
}

export function StreakWarningBanner({ lastActiveDate, onNavigate }: StreakWarningBannerProps) {
  const warning: StreakWarning = getStreakWarning(lastActiveDate);
  
  // მხოლოდ warning და critical დონეებზე ვაჩვენოთ
  if (warning.dangerLevel === 'safe') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: '8px' }}
      >
        <motion.div
          animate={warning.dangerLevel === 'critical' ? {
            boxShadow: [
              `0 0 0px ${warning.color}`,
              `0 0 20px ${warning.color}`,
              `0 0 0px ${warning.color}`
            ]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: warning.bgColor,
            border: `1.5px solid ${warning.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
          onClick={() => onNavigate('daily-card')}
        >
          {/* Icon */}
          <motion.div
            animate={warning.dangerLevel === 'critical' ? {
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0]
            } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{
              fontSize: '24px',
              flexShrink: 0
            }}
          >
            {warning.icon}
          </motion.div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              color: warning.color,
              marginBottom: '2px',
              letterSpacing: '0.3px'
            }}>
              {warning.message}
            </div>
            <div style={{
              fontSize: '10px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Clock size={10} />
              <span>Tap to draw your daily card</span>
            </div>
          </div>

          {/* Action */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}