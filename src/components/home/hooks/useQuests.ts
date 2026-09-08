import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { loadUserQuests, type QuestProgress } from '../../../lib/questService';
import { logger } from '../../../lib/logger';

export interface DailyQuestDisplay extends QuestProgress {
  isClaimable: boolean;
}

export const useQuests = (userId: string | undefined) => {
  const [questsLoading, setQuestsLoading] = useState(true);
  const [dailyQuests, setDailyQuests] = useState<DailyQuestDisplay[]>([]);
  const [activeDailyQuest, setActiveDailyQuest] = useState<DailyQuestDisplay | null>(null);

  const loadQuests = async () => {
    if (!userId) return;
    setQuestsLoading(true);

    try {
      const quests = await loadUserQuests(userId);
      const dQuests = quests.filter(q => q.quest?.quest_type === 'daily') as DailyQuestDisplay[];
      const processedQuests = dQuests.map(q => ({ ...q, isClaimable: q.is_completed && !q.is_claimed }));
      
      setDailyQuests(processedQuests);

      const unclaimed = processedQuests.filter(q => !q.is_claimed);
      if (unclaimed.length > 0) {
        const randomIndex = Math.floor(Math.random() * unclaimed.length);
        setActiveDailyQuest(unclaimed[randomIndex]);
      } else {
        setActiveDailyQuest(null);
      }
    } catch (error) {
      logger.error('Error loading quests:', error);
    } finally {
      setQuestsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadQuests();
  }, [userId]);

  const claimQuest = async (quest: DailyQuestDisplay): Promise<{
    success: boolean;
    reward?: { coins: number; xp: number };
    error?: string;
  }> => {
    if (!userId || !supabase) {
      return { success: false, error: 'No user or supabase' };
    }

    try {
      const { data, error } = await supabase.rpc('claim_quest_reward', {
        p_user_id: userId,
        p_quest_id: quest.quest_id
      });

      if (error || !data?.success) {
        return { success: false, error: error?.message || data?.error };
      }

      await loadQuests();
      return { success: true, reward: data.reward };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    questsLoading,
    dailyQuests,
    activeDailyQuest,
    loadQuests,
    claimQuest
  };
};