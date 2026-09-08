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
    <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(197, 160, 89, 0.15)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#C5A059', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Next: {nextMilestone.icon_emoji} {nextMilestone.name}
        </span>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{streak}/{nextMilestone.days_required}</span>
      </div>
      <div style={{ height: '5px', borderRadius: '999px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentToNext}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ 
            height: '100%', 
            borderRadius: '999px', 
            background: 'linear-gradient(90deg, #ff6b35, #ffe566)',
            boxShadow: '0 0 8px rgba(255, 229, 102, 0.5)'
          }}
        />
      </div>
      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
        {daysToNext} more days to {nextMilestone.name}
      </div>
    </div>
  );
}