import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface StreakBannerProps {
  currentStreak: number;
  isDailyRevealed: boolean;
  isDismissed: boolean;
  onDismiss: () => void;
  onNavigate: (screen: string) => void;
}

export function StreakBanner({ currentStreak, isDailyRevealed, isDismissed, onDismiss, onNavigate }: StreakBannerProps) {
  if (currentStreak === 0 || isDailyRevealed || isDismissed) return null;

  return (
    <>
      <motion.div
        key="streak-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9997
        }}
        onClick={onDismiss}
      />

      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
          pointerEvents: 'none',
          padding: '24px'
        }}
      >
        <motion.div
          key="streak-banner"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: '300px',
            padding: '18px 16px',
            background: 'linear-gradient(135deg, rgba(69, 10, 10, 0.98) 0%, rgba(124, 45, 18, 0.98) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.6)',
            borderRadius: '16px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(239, 68, 68, 0.3)',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <button
            onClick={onDismiss}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '5px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.4)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={12} />
          </button>

          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontSize: '36px', marginBottom: '8px' }}
          >
            ⚠️
          </motion.div>

          <div style={{ fontSize: '15px', fontWeight: 800, color: '#fca5a5', marginBottom: '4px', lineHeight: 1.3 }}>
            Your {currentStreak}-day streak is in danger!
          </div>

          <div style={{ fontSize: '11px', color: '#fdba74', marginBottom: '14px', lineHeight: 1.4 }}>
            Draw your card today to keep it alive 🔥
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onDismiss}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Later
            </button>
            <button
              onClick={() => onNavigate('daily-card')}
              style={{
                flex: 2,
                padding: '10px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)'
              }}
            >
              🔥 DRAW NOW
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}