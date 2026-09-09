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
        padding: '16px 18px',
        flexShrink: 0,
        background: `radial-gradient(120% 100% at 50% 0%, ${tier.glowColor} 0%, rgba(15,12,8,0) 70%)`,
        borderBottom: '1px solid rgba(197, 160, 89, 0.15)'
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 10,
          padding: '5px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.4)', color: '#94a3b8', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <X size={14} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <motion.div
          key={tier.icon}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          style={{
            width: 52,
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, ${tier.color}50, ${tier.color}20 55%, transparent)`,
            border: `2px solid ${tier.color}70`,
            boxShadow: `0 0 20px ${tier.glowColor}`,
            fontSize: '26px',
            flexShrink: 0
          }}
        >
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            {tier.icon}
          </motion.span>
        </motion.div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '3px' }}>
            <span style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'Georgia, serif',
              lineHeight: 1,
              textShadow: `0 0 12px ${tier.glowColor}`
            }}>
              {streak}
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
              day{streak !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: tier.color,
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              {tier.name}
            </span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>•</span>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Trophy size={9} style={{ color: '#C5A059' }} />
              Best: {longest}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}