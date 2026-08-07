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

    // Get current streak data
    const { data: economy, error: economyError } = await supabase
      .from('user_economy')
      .select('current_streak, longest_streak, last_active_date')
      .eq('user_id', userId)
      .single();

    if (economyError || !economy) {
      throw new Error('User economy not found');
    }

    // Check if already updated today
    if (economy.last_active_date === today) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Streak already updated today',
          data: {
            current_streak: economy.current_streak,
            longest_streak: economy.longest_streak,
            already_updated: true
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate new streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak: number;
    if (economy.last_active_date === yesterdayStr) {
      // Was active yesterday, increment streak
      newStreak = economy.current_streak + 1;
    } else {
      // Missed days, reset streak to 1
      newStreak = 1;
    }

    // Update longest streak if needed
    const newLongest = Math.max(newStreak, economy.longest_streak);

    // Update economy
    const { data: updatedEconomy, error: updateError } = await supabase
      .from('user_economy')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_active_date: today
      })
      .eq('user_id', userId)
      .select('current_streak, longest_streak')
      .single();

    if (updateError) {
      console.error('Error updating streak:', updateError);
      throw new Error('Failed to update streak');
    }

    // Log the streak update
    await supabase.from('transactions').insert({
      user_id: userId,
      transaction_type: 'info',
      amount_coins: 0,
      amount_xp: 0,
      source: 'streak_update',
      description: `Daily reading completed. Streak: ${newStreak} days`
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          current_streak: updatedEconomy.current_streak,
          longest_streak: updatedEconomy.longest_streak,
          already_updated: false,
          streak_incremented: newStreak > economy.current_streak
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-streak-on-reading:', error);
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