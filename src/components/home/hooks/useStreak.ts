import { useState, useEffect } from 'react';
import { getStreakMilestones, getClaimedMilestones } from '../../../lib/streakService';
import { logger } from '../../../lib/logger';

export const useStreak = (userId: string | undefined, currentStreak: number) => {
  const [unclaimedMilestoneCount, setUnclaimedMilestoneCount] = useState(0);
  const [streakBannerDismissed, setStreakBannerDismissed] = useState(false);

  useEffect(() => {
    const loadMilestones = async () => {
      if (!userId) return;

      try {
        const [milestones, claimed] = await Promise.all([
          getStreakMilestones(),
          getClaimedMilestones(userId)
        ]);

        const claimedIds = new Set(claimed.map(c => c.milestone_id));
        const unclaimed = milestones.filter(
          m => currentStreak >= m.days_required && !claimedIds.has(m.id)
        );
        
        setUnclaimedMilestoneCount(unclaimed.length);
      } catch (error: any) {
        logger.error('Failed to load milestones:', error.message);
      }
    };

    loadMilestones();
  }, [userId, currentStreak]);

  const dismissBanner = () => setStreakBannerDismissed(true);
  const resetBannerDismissed = () => setStreakBannerDismissed(false);

  return {
    unclaimedMilestoneCount,
    streakBannerDismissed,
    dismissBanner,
    resetBannerDismissed
  };
};