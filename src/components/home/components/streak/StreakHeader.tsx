import { motion } from 'framer-motion';
import { X, Flame } from 'lucide-react';

interface StreakHeaderProps {
  streak: number;
  longest: number;
  onClose: () => void;
}

export function StreakHeader({ streak, longest, onClose }: StreakHeaderProps) {
  const getCurrentTierIcon = () => {
    if (streak >= 100) return '💎';
    if (streak >= 60) return '🏆';
    if (streak >= 30) return '👑';
    if (streak >= 14) return '⭐';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '🌱';
    return '🔥';
  };

  return (
    <div
      style={{
        position: 'relative',
        padding: '24px 20px 20px 20px',
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

      {/* Pulsing Flame Icon with Tier */}
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
            border: '1px solid rgba(255, 107, 53, 0.6)',
            fontSize: '24px'
          }}
        >
          {getCurrentTierIcon()}
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
        {streak} Day{streak !== 1 ? 's' : ''} Streak!
      </h2>
      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
        Longest: {longest} days
      </p>
    </div>
  );
}