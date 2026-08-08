import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, message, type = 'general' } = await req.json();

    if (!user_id || !message) {
      throw new Error('user_id and message are required');
    }

    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured in Supabase Secrets');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ✅ 1. მომხმარებლის telegram_id-ის მიღება users table-დან
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('telegram_id, display_name')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message || 'Unknown error'}`);
    }

    // ✅ 2. telegram_id-ის შემოწმება
    if (!user.telegram_id) {
      throw new Error('User has no telegram_id. Cannot send notification.');
    }

    // ✅ 3. შეტყობინების გაფორმება
    let formattedMessage = message;
    if (type === 'horoscope') {
      formattedMessage = `🔮 *დღის ჰოროსკოპი*\n\n${message}`;
    } else if (type === 'moon_phase') {
      formattedMessage = `🌙 *მთვარის ფაზა*\n\n${message}`;
    } else if (type === 'quest') {
      formattedMessage = `🎯 *ახალი დავალება*\n\n${message}`;
    } else if (type === 'streak_warning') {
      formattedMessage = `🔥 *Streak Warning!*\n\n${message}`;
    } else if (type === 'daily_reminder') {
      formattedMessage = `🌙 *Lunara*\n\n${message}`;
    } else {
      formattedMessage = `✨ *Lunara*\n\n${message}`;
    }

    // ✅ 4. რეალური გაგზავნა Telegram-ში (telegram_id == chat_id)
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.telegram_id,
          text: formattedMessage,
          parse_mode: 'Markdown',
        }),
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      throw new Error(`Telegram API error: ${telegramData.description}`);
    }

    console.log(`✅ Notification sent to user ${user_id} (${type})`);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});