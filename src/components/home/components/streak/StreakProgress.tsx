import { motion } from 'framer-motion';

interface StreakMilestone {
  id: number;
  days_required: number;
  name: string;
  icon_emoji: string;
  reward_coins: number;
  reward_xp: number;
  reward_premium_days: number;
  description: string;
  is_active: boolean;
  sort_order: number;
}

interface StreakProgressProps {
  nextMilestone: StreakMilestone | null | undefined;
  streak: number;
  percentToNext: number;
  daysToNext: number;
}

export function StreakProgress({ nextMilestone, streak, percentToNext, daysToNext }: StreakProgressProps) {
  if (!nextMilestone) return null;

  return (
    <div style={{ padding: '14px 16px 12px 16px', borderBottom: '1px solid rgba(197, 160, 89, 0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px' }}>{nextMilestone.icon_emoji}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
            {nextMilestone.name}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700 }}>
          {daysToNext}d to go
        </span>
      </div>
      
      {/* Progress bar */}
      <div style={{ position: 'relative', height: '6px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentToNext}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ 
            height: '100%', 
            borderRadius: '999px', 
            background: 'linear-gradient(90deg, #C5A059, #ffe566)',
            boxShadow: '0 0 8px rgba(255, 229, 102, 0.6)'
          }}
        />
        {/* Milestone marker */}
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            position: 'absolute',
            right: '-4px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#ffe566',
            boxShadow: '0 0 10px rgba(255, 229, 102, 0.8)',
            border: '2px solid #0c0a06'
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px', color: '#94a3b8' }}>
        <span>{streak} days</span>
        <span>{nextMilestone.days_required} days</span>
      </div>
    </div>
  );
}