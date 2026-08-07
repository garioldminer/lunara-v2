import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;

    // 2. Get user's current streak and economy
    const { data: economy, error: economyError } = await supabase
      .from('user_economy')
      .select('current_streak, longest_streak, cosmic_coins, xp, level')
      .eq('user_id', userId)
      .single();

    if (economyError || !economy) {
      throw new Error('User economy not found');
    }

    const currentStreak = economy.current_streak || 0;

    // 3. Get all active milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from('streak_milestones')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (milestonesError || !milestones) {
      throw new Error('Failed to load milestones');
    }

    // 4. Get already claimed milestones for this user
    const { data: claimedMilestones, error: claimedError } = await supabase
      .from('user_claimed_milestones')
      .select('milestone_id')
      .eq('user_id', userId);

    if (claimedError) {
      throw new Error('Failed to check claimed milestones');
    }

    const claimedIds = new Set(claimedMilestones?.map((c: any) => c.milestone_id) || []);

    // 5. Find milestones that are achieved but not yet claimed
    const achievedNotClaimed = milestones.filter((m: any) => 
      currentStreak >= m.days_required && !claimedIds.has(m.id)
    );

    if (achievedNotClaimed.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No new milestones to claim',
          data: { 
            current_streak: currentStreak, 
            total_claimed: claimedIds.size 
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Award rewards for each achieved milestone
    let totalCoins = 0;
    let totalXP = 0;
    let totalPremiumDays = 0;
    const claimedRewards = [];

    for (const milestone of achievedNotClaimed) {
      totalCoins += milestone.reward_coins;
      totalXP += milestone.reward_xp;
      totalPremiumDays += milestone.reward_premium_days;

      // Mark milestone as claimed
      const { error: claimError } = await supabase
        .from('user_claimed_milestones')
        .insert({
          user_id: userId,
          milestone_id: milestone.id,
          streak_at_claim: currentStreak
        });

      if (claimError) {
        console.error(`Error claiming milestone ${milestone.id}:`, claimError);
        // Continue with other milestones even if one fails
      }

      claimedRewards.push({
        milestone_id: milestone.id,
        name: milestone.name,
        icon: milestone.icon_emoji,
        coins: milestone.reward_coins,
        xp: milestone.reward_xp,
        premium_days: milestone.reward_premium_days
      });
    }

    // 7. Update user economy (coins + XP)
    const { error: updateError } = await supabase
      .from('user_economy')
      .update({
        cosmic_coins: economy.cosmic_coins + totalCoins,
        xp: economy.xp + totalXP,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating economy:', updateError);
      throw new Error('Failed to award rewards');
    }

    // 8. Record transactions
    for (const reward of claimedRewards) {
      await supabase.from('transactions').insert({
        user_id: userId,
        transaction_type: 'earn',
        amount_coins: reward.coins,
        amount_xp: reward.xp,
        source: 'streak_milestone',
        description: `${reward.name} milestone (${reward.icon}) - Streak: ${currentStreak} days`
      });
    }

    // 9. Success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          current_streak: currentStreak,
          milestones_claimed: claimedRewards,
          total_coins: totalCoins,
          total_xp: totalXP,
          total_premium_days: totalPremiumDays
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in claim-streak-milestone:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});