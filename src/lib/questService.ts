import { supabase } from './supabase';

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  action_type: string;
  target_count: number;
  reward_xp: number;
  reward_coins: number;
  quest_type: 'daily' | 'weekly' | 'milestone';
  is_active: boolean;
}

export interface QuestProgress {
  id: string;
  user_id: string;
  quest_id: string;
  current_progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  quest?: QuestDefinition;
}

export interface QuestReward {
  xp: number;
  coins: number;
  quest_title: string;
}

/**
 * ქვესტის პროგრესის განახლება უსაფრთხო ფუნქციით
 */
export async function trackQuestProgress(
  userId: string,
  actionType: string,
  increment: number = 1
): Promise<QuestReward | null> {
  if (!supabase) {
    console.error('❌ Supabase client not available');
    return null;
  }

  try {
    // 1. ვიპოვოთ ქვესტა action_type-ით
    const { data: quest, error: questError } = await supabase
      .from('quest_definitions')
      .select('*')
      .eq('action_type', actionType)
      .eq('is_active', true)
      .single();

    if (questError || !quest) {
      console.log(`️ No active quest found for action: ${actionType}`);
      return null;
    }

    console.log(`📋 Found quest: ${quest.title} (target: ${quest.target_count})`);

    // 2. გამოვიძახოთ უსაფრთხო ფუნქცია
    const { data: result, error: funcError } = await supabase.rpc('upsert_quest_progress', {
      p_user_id: userId,
      p_quest_id: quest.id,
      p_increment: increment
    });

    if (funcError) {
      console.error('❌ Error calling upsert_quest_progress:', funcError);
      return null;
    }

    console.log('📊 Function result:', result);

    // 3. თუ დასრულდა, დავაბრუნოთ ჯილდო
    if (result?.completed) {
      console.log(`🎉 Quest completed: ${quest.title}!`);
      return {
        xp: result.reward.xp,
        coins: result.reward.coins,
        quest_title: result.reward.quest_title
      };
    }

    console.log(`⏳ Progress updated: ${result?.progress}/${quest.target_count}`);
    return null;
  } catch (error) {
    console.error('❌ Exception in trackQuestProgress:', error);
    return null;
  }
}

/**
 * მომხმარებლის ქვესტების ჩატვირთვა
 */
export async function loadUserQuests(userId: string): Promise<QuestProgress[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc('get_user_quests', {
      p_user_id: userId
    });

    if (error) {
      console.error('❌ Error loading quests:', error);
      return [];
    }

    // ტრანსფორმაცია QuestProgress ფორმატში
    return (data || []).map((item: any) => ({
      id: item.id,
      user_id: userId,
      quest_id: item.quest_id,
      current_progress: item.current_progress,
      is_completed: item.is_completed,
      is_claimed: item.is_claimed,
      quest: {
        id: item.quest_id,
        title: item.quest_title,
        description: item.quest_description,
        action_type: item.quest_action_type,
        target_count: item.quest_target_count,
        reward_xp: item.quest_reward_xp,
        reward_coins: item.quest_reward_coins,
        quest_type: item.quest_type,
        is_active: true
      }
    }));
  } catch (error) {
    console.error('❌ Exception in loadUserQuests:', error);
    return [];
  }
}

/**
 * ყველა აქტიური ქვესტის ჩატვირთვა
 */
export async function loadActiveQuests(): Promise<QuestDefinition[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('quest_definitions')
      .select('*')
      .eq('is_active', true)
      .order('quest_type', { ascending: true })
      .order('title', { ascending: true });

    if (error) {
      console.error('❌ Error loading active quests:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Exception in loadActiveQuests:', error);
    return [];
  }
}