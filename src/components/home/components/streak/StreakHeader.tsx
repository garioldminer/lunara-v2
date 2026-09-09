import { motion } from 'framer-motion';
import { X, Trophy } from 'lucide-react';
import { getStreakTier } from '../../lib/helpers';

interface StreakHeaderProps {
  streak: number;
  longest: number;
  onClose: () => void;
}

export function StreakHeader({ streak, longest, onClose }: StreakHeaderProps) {
  const tier = getStreakTier(streak);
  
  return (
    <div
      style={{
        position: 'relative',
        padding: '14px 16px',
        flexShrink: 0,
        overflow: 'hidden',
        background: `radial-gradient(120% 100% at 50% 0%, ${tier.glowColor} 0%, rgba(15,12,8,0) 65%)`,
        borderBottom: '1px solid rgba(197, 160, 89, 0.18)'
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '8px', right: '8px', zIndex: 10,
          padding: '4px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.4)', color: '#94a3b8', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <X size={14} />
      </button>

      {/* Horizontal Layout: Icon | Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Tier Icon */}
        <motion.div
          key={tier.icon}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          style={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, ${tier.color}40, ${tier.color}20 55%, transparent)`,
            border: `2px solid ${tier.color}60`,
            boxShadow: `0 0 16px ${tier.glowColor}`,
            fontSize: '24px',
            flexShrink: 0
          }}
        >
          <motion.span
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {tier.icon}
          </motion.span>
        </motion.div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
            <span style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'Georgia, serif',
              lineHeight: 1
            }}>
              {streak}
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              day{streak !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '9px',
              fontWeight: 700,
              color: tier.color,
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              {tier.name}
            </span>
            <span style={{ fontSize: '9px', color: '#64748b' }}>•</span>
            <span style={{ fontSize: '9px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Trophy size={8} />
              Best: {longest}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}