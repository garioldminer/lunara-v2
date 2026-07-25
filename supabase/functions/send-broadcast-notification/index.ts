import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_USER_ID = 'c9dbe3be-5c02-4034-8bfd-1d693eb02754';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      admin_user_id, 
      message, 
      image_url,
      buttons,
      target_audience,
      specific_user_ids,
      broadcast_id 
    } = await req.json();

    // 1. უსაფრთხოება: მხოლოდ ადმინი
    if (admin_user_id !== ADMIN_USER_ID) {
      throw new Error('Unauthorized: Only admin can send broadcasts');
    }

    if (!message || !target_audience) {
      throw new Error('Missing required fields: message and target_audience');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let targets: any[] = [];

    // 2. სამიზნე აუდიტორიის შერჩევა (ფილტრაცია)
    if (target_audience === 'all') {
      const { data } = await supabase.from('user_preferences').select('user_id, telegram_chat_id').not('telegram_chat_id', 'is', null);
      targets = data || [];
    } 
    else if (target_audience === 'active') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data } = await supabase.from('users').select('id, telegram_chat_id').gte('last_active_at', sevenDaysAgo.toISOString()).not('telegram_chat_id', 'is', null);
      targets = data || [];
    }
    else if (target_audience === 'premium') {
      const { data } = await supabase.from('users').select('id, telegram_chat_id').eq('plan_type', 'premium').not('telegram_chat_id', 'is', null);
      targets = data || [];
    }
    else if (target_audience === 'free') {
      const { data } = await supabase.from('users').select('id, telegram_chat_id').eq('plan_type', 'free').not('telegram_chat_id', 'is', null);
      targets = data || [];
    }
    else if (target_audience === 'specific' && specific_user_ids) {
      const { data } = await supabase.from('users').select('id, telegram_chat_id').in('id', specific_user_ids).not('telegram_chat_id', 'is', null);
      targets = data || [];
    }

    if (targets.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'სამიზნე აუდიტორიაში არ არის მომხმარებელი.', details: { successCount: 0, failCount: 0, totalFound: 0 } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // 3. ციკლში გაგზავნა
    for (const target of targets) {
      try {
        const telegramPayload: any = {
          chat_id: target.telegram_chat_id,
          parse_mode: 'Markdown'
        };

        if (image_url) {
          telegramPayload.photo = image_url;
          telegramPayload.caption = message;
        } else {
          telegramPayload.text = message;
        }

        if (buttons && buttons.length > 0) {
          telegramPayload.reply_markup = {
            inline_keyboard: [buttons.map((btn: any) => ({ text: btn.text, url: btn.url }))]
          };
        }

        const endpoint = image_url ? 'sendPhoto' : 'sendMessage';
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telegramPayload)
        });
        
        const data = await res.json();
        
        if (data.ok) {
          successCount++;
          if (broadcast_id) {
            await supabase.from('broadcast_logs').insert({ broadcast_id, user_id: target.user_id, channel: 'telegram', status: 'sent' });
          }
        } else {
          failCount++;
          errors.push(`User ${target.user_id}: ${data.description}`);
          if (broadcast_id) {
            await supabase.from('broadcast_logs').insert({ broadcast_id, user_id: target.user_id, channel: 'telegram', status: 'failed', error_message: data.description });
          }
        }
        
        // Rate limiting (50ms)
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (err: any) {
        failCount++;
        errors.push(`User ${target.user_id}: ${err.message}`);
      }
    }

    // 4. მთავარი ჩანაწერის განახლება
    if (broadcast_id) {
      await supabase.from('broadcast_messages').update({ status: 'sent', success_count: successCount, fail_count: failCount }).eq('id', broadcast_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `გაგზავნა დასრულდა. წარმატებული: ${successCount}, ვერ მოხერხდა: ${failCount}`,
        details: { successCount, failCount, totalFound: targets.length, errors: errors.slice(0, 10) }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Broadcast Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});