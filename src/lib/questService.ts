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
 * უნივერსალური ფუნქცია ქვესტის პროგრესის განახლებისთვის
 * @param userId - მომხმარებლის ID
 * @param actionType - ქვესტის action_type (მაგ: 'draw_daily_card')
 * @param increment - რამდენით გაიზარდოს პროგრესი (default: 1)
 * @returns QuestReward | null - ჯილდო თუ ქვესტა დასრულდა, null თუ არა
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
    // 1. ვიპოვოთ აქტიური ქვესტა ამ action_type-ით
    const { data: quest, error: questError } = await supabase
      .from('quest_definitions')
      .select('*')
      .eq('action_type', actionType)
      .eq('is_active', true)
      .single();

    if (questError || !quest) {
      console.log(`⚠️ No active quest found for action: ${actionType}`);
      return null;
    }

    console.log(`📋 Found quest: ${quest.title} (target: ${quest.target_count})`);

    // 2. ვიპოვოთ მომხმარებლის პროგრესი ამ ქვესტაზე
    // შენიშვნა: თუ ჩანაწერი არ არსებობს, data იქნება null, რაც ჩვენთვის მისაღებია
    const { data: progress } = await supabase
      .from('user_quest_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', quest.id)
      .single();

    // 3. თუ პროგრესი უკვე დასრულებულია, არაფერი გავაკეთოთ
    if (progress && progress.is_completed) {
      console.log(`✅ Quest already completed: ${quest.title}`);
      return null;
    }

    let newProgress: number;
    let isCompleted: boolean = false;

    if (progress) {
      // 4a. განვაახლოთ არსებული პროგრესი
      newProgress = progress.current_progress + increment;
      isCompleted = newProgress >= quest.target_count;

      const { error: updateError } = await supabase
        .from('user_quest_progress')
        .update({
          current_progress: newProgress,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', progress.id);

      if (updateError) {
        console.error('❌ Error updating quest progress:', updateError);
        return null;
      }

      console.log(`⏳ Progress updated: ${newProgress}/${quest.target_count}`);
    } else {
      // 4b. შევქმნათ ახალი პროგრესის ჩანაწერი
      newProgress = increment;
      isCompleted = newProgress >= quest.target_count;

      const { error: insertError } = await supabase
        .from('user_quest_progress')
        .insert({
          user_id: userId,
          quest_id: quest.id,
          current_progress: newProgress,
          is_completed: isCompleted,
          is_claimed: false,
          last_reset_at: new Date().toISOString(),
          completed_at: isCompleted ? new Date().toISOString() : null
        });

      if (insertError) {
        console.error('❌ Error creating quest progress:', insertError);
        return null;
      }

      console.log(`🆕 New progress created: ${newProgress}/${quest.target_count}`);
    }

    // 5. თუ ქვესტა დასრულდა, გავცეთ ჯილდო
    if (isCompleted) {
      console.log(`🎉 Quest completed: ${quest.title}! Rewarding XP: ${quest.reward_xp}, Coins: ${quest.reward_coins}`);

      // ვიპოვოთ მიმდინარე ეკონომიკა
      const { data: economy, error: econFetchError } = await supabase
        .from('user_economy')
        .select('cosmic_coins, xp, level')
        .eq('user_id', userId)
        .single();

      if (econFetchError) {
        console.error('❌ Error fetching economy:', econFetchError);
        return null;
      }

      const newCoins = (economy?.cosmic_coins || 0) + quest.reward_coins;
      const newXP = (economy?.xp || 0) + quest.reward_xp;
      const newLevel = Math.floor(newXP / 100) + 1;

      const { error: updateError } = await supabase
        .from('user_economy')
        .update({
          cosmic_coins: newCoins,
          xp: newXP,
          level: newLevel
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Error updating economy:', updateError);
        return null;
      }

      console.log(`💰 Economy updated: Coins=${newCoins}, XP=${newXP}, Level=${newLevel}`);

      return {
        xp: quest.reward_xp,
        coins: quest.reward_coins,
        quest_title: quest.title
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Exception in trackQuestProgress:', error);
    return null;
  }
}

/**
 * მიმდინარე ქვესტების ჩატვირთვა მომხმარებლისთვის
 */
export async function loadUserQuests(userId: string): Promise<QuestProgress[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_quest_progress')
      .select(`
        *,
        quest:quest_definitions(*)
      `)
      .eq('user_id', userId)
      // .order('created_at', { ascending: false }); // შენიშვნა: created_at არ არის quest_progress-ში, ამიტომ ვტოვებთ მარტივად

    if (error) {
      console.error('❌ Error loading quests:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Exception in loadUserQuests:', error);
    return [];
  }
}

/**
 * ყველა აქტიური ქვესტის ჩატვირთვა (განმარტებები)
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