import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [send-daily-card-reminder] Starting execution...');

    // 🔐 AUTH CHECK - CRON_SECRET verification
    const authHeader = req.headers.get('Authorization');
    
    if (!CRON_SECRET) {
      console.error('❌ CRITICAL: CRON_SECRET not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!authHeader) {
      console.error('❌ No Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : authHeader;
    
    if (token !== CRON_SECRET) {
      console.error('❌ Token mismatch');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid CRON_SECRET' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Auth passed');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. ვიპოვოთ users რომლებსაც დღეს არ აქვთ reading
    const { data: users, error: usersError } = await supabase.rpc('get_users_without_reading_today');

    if (usersError) {
      throw new Error('Failed to fetch users: ' + usersError.message);
    }

    if (!users || users.length === 0) {
      console.log('✅ All users have drawn their cards today! No reminders needed.');
      return new Response(
        JSON.stringify({ success: true, message: 'No reminders needed - all users drew cards today' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎯 Found ${users.length} users who haven't drawn cards today.`);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // 2. გავუგზავნოთ reminder თითოეულს
    for (const user of users) {
      try {
        const chatId = user.telegram_id;
        const userName = user.display_name || user.username || 'Friend';
        const streak = user.streak || 0;

        // Reminder message (personalized)
        const reminderMessage = 
`🌙 *Hey ${userName}!*

Don't forget to draw your daily card today! 🔮

${streak > 0 ? `🔥 You're on a *${streak}-day streak* - keep it going!` : '✨ Start your cosmic journey today!'}

The cards are waiting to share their wisdom with you. What question is on your mind tonight?

💫 *Tap here to draw your card* → Open Lunara in Telegram

✨ *Lunara* - Your daily tarot companion`;

        // გაგზავნა Telegram-ში
        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: reminderMessage,
            parse_mode: 'Markdown'
          })
        });

        const tgData = await tgRes.json();

        // ლოგირება
        try {
          await supabase.from('function_logs').insert({
            function_name: 'send-daily-card-reminder',
            status: tgData.ok ? 'success' : 'error',
            response_time_ms: 0,
            status_code: tgData.ok ? 200 : 500,
            error_message: tgData.ok ? null : tgData.description,
            request_data: { 
              user_id: user.id,
              chat_id: chatId,
              streak: streak
            },
            response_data: { status: tgData.ok ? 'sent' : 'failed' },
            triggered_by: 'cron'
          });
        } catch (logErr) {
          console.error('Failed to log:', logErr);
        }

        if (tgData.ok) {
          successCount++;
          console.log(`✅ Reminder sent to ${userName}`);
        } else {
          failCount++;
          errors.push(`User ${user.id}: ${tgData.description}`);
        }

        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (err: any) {
        failCount++;
        errors.push(`User ${user.id}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Daily card reminder complete. Success: ${successCount}, Failed: ${failCount}`,
        details: { successCount, failCount, errors: errors.slice(0, 10) }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Daily Card Reminder Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});