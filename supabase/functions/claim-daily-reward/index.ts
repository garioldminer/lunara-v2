import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;
    const today = new Date().toISOString().split('T')[0];

    // Check if user already claimed today
    const { data: economy, error: economyError } = await supabase
      .from('user_economy')
      .select('last_daily_claim, current_streak, longest_streak, last_active_date')
      .eq('user_id', userId)
      .single();

    // If no economy record exists, create one
    if (economyError || !economy) {
      const { error: insertError } = await supabase
        .from('user_economy')
        .insert({
          user_id: userId,
          cosmic_coins: 0,
          xp: 0,
          level: 1,
          cosmic_focus: 3,
          max_focus: 3,
          current_streak: 0,
          longest_streak: 0,
          last_active_date: today
        });

      if (insertError) {
        console.error('Error creating economy record:', insertError);
        throw new Error('Failed to initialize user economy');
      }

      // Re-fetch
      const { data: newEconomy } = await supabase
        .from('user_economy')
        .select('*')
        .eq('user_id', userId)
        .single();

      economy = newEconomy;
    }

    // Check if already claimed today
    if (economy.last_daily_claim === today) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Already claimed today',
          data: economy
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate streak
    let newStreak = 1;
    let newLongestStreak = economy.longest_streak;

    if (economy.last_active_date) {
      const lastActive = new Date(economy.last_active_date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      if (lastActive.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        // Was active yesterday, increment streak
        newStreak = economy.current_streak + 1;
      }
    }

    // Update longest streak if needed
    if (newStreak > newLongestStreak) {
      newLongestStreak = newStreak;
    }

    // Calculate reward (base 10 + streak bonus)
    const baseReward = 10;
    const streakBonus = Math.min(newStreak * 2, 20); // Max 20 bonus
    const totalCoins = baseReward + streakBonus;
    const totalXP = 10;

    // Update economy
    const { data: updatedEconomy, error: updateError } = await supabase
      .from('user_economy')
      .update({
        cosmic_coins: economy.cosmic_coins + totalCoins,
        xp: economy.xp + totalXP,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_daily_claim: today,
        last_active_date: today
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating economy:', updateError);
      throw new Error('Failed to update economy');
    }

    // Insert transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        transaction_type: 'earn',
        amount_coins: totalCoins,
        amount_xp: totalXP,
        source: 'daily_reward',
        description: `Daily reward (Streak: ${newStreak} days)`
      });

    if (transactionError) {
      console.error('Error inserting transaction:', transactionError);
      // Don't throw, economy was already updated
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          economy: updatedEconomy,
          reward: {
            coins: totalCoins,
            xp: totalXP,
            streak: newStreak
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in claim-daily-reward:', error);
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