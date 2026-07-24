import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// ეს ცვლადი ავტომატურად წაიღებს ტოკენს Supabase-ის Secrets-დან
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

    // 1. ვამოწმებთ მომხმარებლის პრეფერენციებს
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('push_notifications, telegram_chat_id')
      .eq('user_id', user_id)
      .single();

    if (prefError || !preferences) {
      throw new Error('User preferences not found');
    }

    // 2. თუ მომხმარებელს გამორთული აქვს შეტყობინებები, ვაჩერებთ პროცესს
    if (!preferences.push_notifications) {
      return new Response(
        JSON.stringify({ success: false, message: 'Push notifications disabled by user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. თუ Chat ID არ გვაქვს, ვერ გავაგზავნით
    if (!preferences.telegram_chat_id) {
      throw new Error('Telegram chat_id not found. User needs to interact with the bot first.');
    }

    // 4. შეტყობინების გალამაზება
    let formattedMessage = message;
    if (type === 'horoscope') formattedMessage = `🔮 *დღის ჰოროსკოპი*\n\n${message}`;
    else if (type === 'moon_phase') formattedMessage = `🌙 *მთვარის ფაზა*\n\n${message}`;
    else if (type === 'quest') formattedMessage = `🎯 *ახალი დავალება*\n\n${message}`;
    else formattedMessage = `✨ *Lunara*\n\n${message}`;

    // 5. რეალური გაგზავნა Telegram-ში
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: preferences.telegram_chat_id,
          text: formattedMessage,
          parse_mode: 'Markdown',
        }),
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      throw new Error(`Telegram API error: ${telegramData.description}`);
    }

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