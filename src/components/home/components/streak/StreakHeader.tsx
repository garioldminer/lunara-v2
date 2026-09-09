import { motion } from 'framer-motion';
import { X } from 'lucide-react';
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
        padding: '24px 20px 20px 20px',
        textAlign: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        background: `radial-gradient(120% 100% at 50% 0%, ${tier.glowColor} 0%, rgba(15,12,8,0) 65%)`,
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

      {/* Tier Icon with Dynamic Glow */}
      <motion.div
        key={tier.icon}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        style={{
          position: 'relative',
          width: 80,
          height: 80,
          margin: '0 auto 12px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${tier.color}40, ${tier.color}20 55%, transparent)`,
          border: `2px solid ${tier.color}60`,
          boxShadow: `0 0 30px ${tier.glowColor}, inset 0 0 20px ${tier.glowColor}`,
          fontSize: '40px'
        }}
      >
        <motion.span
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {tier.icon}
        </motion.span>
      </motion.div>

      {/* Tier Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: tier.color,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '4px',
          textShadow: `0 0 10px ${tier.glowColor}`
        }}
      >
        {tier.name}
      </motion.div>

      {/* Streak Count */}
      <h2
        style={{
          margin: '0 0 6px 0',
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '0.3px',
          color: '#fff',
          fontFamily: 'Georgia, serif',
          textShadow: `0 0 20px ${tier.glowColor}`
        }}
      >
        {streak} Day{streak !== 1 ? 's' : ''} Streak!
      </h2>
      
      {/* Longest Streak */}
      <p style={{ 
        fontSize: '11px', 
        color: '#94a3b8', 
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px'
      }}>
        <span style={{ fontSize: '14px' }}>🏆</span>
        Best: {longest} days
      </p>
    </div>
  );
}