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
    console.log('🚀 [send-daily-horoscope] Starting execution...');

    // 🔐 AUTH CHECK - CRON_SECRET verification
    const authHeader = req.headers.get('Authorization');
    
    if (!CRON_SECRET) {
      console.error('❌ CRITICAL: CRON_SECRET not configured in Supabase secrets');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!authHeader || !authHeader.includes(CRON_SECRET)) {
      console.error('❌ Unauthorized attempt - invalid or missing CRON_SECRET');
      console.error(`   Received header: ${authHeader || 'none'}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Auth passed - CRON_SECRET verified');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. შევამოწმოთ ჩართულია თუ არა გლობალურად
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('daily_horoscope_enabled')
      .single();

    if (!settings?.daily_horoscope_enabled) {
      return new Response(
        JSON.stringify({ success: false, message: 'Daily horoscope is disabled in settings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Daily horoscope is enabled. Fetching eligible users...');

    // 2. მივიღოთ დღევანდელი კოსმოსური მონაცემები
    const today = new Date().toISOString().split('T')[0];
    const { data: cosmicData } = await supabase
      .from('cosmic_daily_data')
      .select('*')
      .eq('date', today)
      .single();

    const { data: aspects } = await supabase
      .from('aspects')
      .select('*')
      .eq('date', today);

    const transitsText = (aspects || [])
      .slice(0, 5)
      .map((a: any) => `${a.planet1} ${a.aspect_type} ${a.planet2} (${a.influence})`)
      .join('\n');

    // 3. მივიღოთ Prompt
    const { data: prompt } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('name', 'daily_horoscope_base')
      .eq('is_active', true)
      .single();

    if (!prompt) {
      throw new Error('Prompt template "daily_horoscope_base" not found or inactive');
    }

    // 4. ✅ მივიღოთ eligible მომხმარებლები (users table პირდაპირ)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, username, sun_sign, moon_sign, rising_sign, telegram_id')
      .not('sun_sign', 'is', null)
      .not('telegram_id', 'is', null);

    if (usersError || !users) {
      throw new Error('Failed to fetch users: ' + usersError?.message);
    }

    console.log(`🎯 Found ${users.length} eligible users for daily horoscope.`);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // 5. გავუგზავნოთ თითოეულს
    for (const user of users as any[]) {
      try {
        const sunSign = user.sun_sign;
        const moonSign = user.moon_sign || 'Unknown';
        const risingSign = user.rising_sign || 'Unknown';
        const chatId = user.telegram_id;
        const language = 'English';
        
        const userName = user.display_name || user.username || 'Friend';

        const userPrompt = prompt.user_prompt_template
          .replace(/\{\{sun_sign\}\}/g, sunSign)
          .replace(/\{\{moon_sign\}\}/g, moonSign)
          .replace(/\{\{rising_sign\}\}/g, risingSign)
          .replace(/\{\{date\}\}/g, today)
          .replace(/\{\{language\}\}/g, language)
          .replace(/\{\{moon_phase\}\}/g, cosmicData?.moon_phase || 'Unknown')
          .replace(/\{\{moon_illumination\}\}/g, String(cosmicData?.moon_illumination || 50))
          .replace(/\{\{moon_sign_current\}\}/g, cosmicData?.moon_sign || 'Unknown')
          .replace(/\{\{sun_sign_current\}\}/g, cosmicData?.sun_sign || 'Unknown')
          .replace(/\{\{transits\}\}/g, transitsText || 'No major transits')
          .replace(/\{\{dominant_element\}\}/g, cosmicData?.dominant_element || 'Unknown')
          .replace(/\{\{energy_level\}\}/g, String(cosmicData?.energy_level || 50));

        let aiText = '';
        let aiModel = 'unknown';
        let tokensUsed = 0;

        try {
          const geminiKey = await getApiKey(supabase, 'gemini');
          const geminiRes = await callGemini(geminiKey, prompt.system_prompt, userPrompt);
          aiText = geminiRes.text;
          aiModel = 'gemini';
          tokensUsed = geminiRes.tokensUsed || 0;
        } catch (geminiError) {
          console.warn(`⚠️ Gemini failed for user ${user.id}, trying Groq...`);
          const groqKey = await getApiKey(supabase, 'groq');
          const groqRes = await callGroq(groqKey, prompt.system_prompt, userPrompt);
          aiText = groqRes.text;
          aiModel = 'groq';
          tokensUsed = groqRes.tokensUsed || 0;
        }

        const parsed = parseHoroscopeResponse(aiText);

        const telegramMessage = 
`🌙 *Good Morning, ${userName}!*

Here is your daily horoscope for *${sunSign}* ♍

🔮 *General Energy*
${parsed.general}

❤️ *Love & Relationships*
${parsed.love}

💼 *Career & Finance*
${parsed.career}

🧘 *Health & Wellness*
${parsed.health}

🍀 *Your Luck Today*
Color: ${parsed.lucky_color}  •  Number: ${parsed.lucky_number}
Planet: ${parsed.lucky_planet || 'Venus'}  •  Crystal: ${parsed.lucky_crystal || 'Amethyst'}

✨ *Lunara* - Your daily dose of cosmic wisdom`;

        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramMessage,
            parse_mode: 'Markdown'
          })
        });

        const tgData = await tgRes.json();

        try {
          await supabase.from('function_logs').insert({
            function_name: 'send-daily-horoscope',
            status: tgData.ok ? 'success' : 'error',
            response_time_ms: 0,
            status_code: tgData.ok ? 200 : 500,
            error_message: tgData.ok ? null : tgData.description,
            request_data: { 
              user_id: user.id,
              sun_sign: sunSign,
              chat_id: chatId,
              ai_model: aiModel,
              tokens_used: tokensUsed
            },
            response_data: { status: tgData.ok ? 'sent' : 'failed' },
            triggered_by: 'cron'
          });
        } catch (logErr) {
          console.error('Failed to log:', logErr);
        }

        if (tgData.ok) {
          successCount++;
          console.log(`✅ Sent to ${userName} (${sunSign})`);
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
        message: `Daily horoscope dispatch complete. Success: ${successCount}, Failed: ${failCount}`,
        details: { successCount, failCount, errors: errors.slice(0, 10) }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Daily Horoscope Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getApiKey(supabase: any, provider: string): Promise<string> {
  const { data } = await supabase
    .from('ai_api_keys')
    .select('api_key')
    .eq('provider_name', provider)
    .eq('is_active', true)
    .single();

  if (!data) {
    throw new Error(`${provider} API key not found or inactive`);
  }
  return data.api_key;
}

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
    })
  });
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    tokensUsed: data.usageMetadata?.totalTokenCount || 0
  };
}

async function callGroq(apiKey: string, systemPrompt: string, userPrompt: string) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    })
  });
  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens || 0
  };
}

function parseHoroscopeResponse(text: string) {
  const sections = {
    general: '', love: '', career: '', health: '', finance: '',
    cosmic_energy_level: 'Medium', love_energy_level: 'Medium', career_energy_level: 'Medium',
    lucky_color: '', lucky_number: 0, lucky_planet: '', lucky_crystal: '',
    hero_description: '', affirmation: '', sign_used: '', reasoning: ''
  };

  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonText = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonText);
      sections.general = parsed.general_prediction || '';
      sections.love = parsed.love_prediction || '';
      sections.career = parsed.career_prediction || '';
      sections.health = parsed.health_prediction || '';
      sections.finance = parsed.finance_prediction || '';
      sections.lucky_color = parsed.lucky_color || '';
      sections.lucky_number = parsed.lucky_number || 0;
      sections.lucky_planet = parsed.lucky_planet || '';
      sections.lucky_crystal = parsed.lucky_crystal || '';
      sections.hero_description = parsed.hero_description || '';
      sections.affirmation = parsed.affirmation || '';
      sections.sign_used = parsed.sign_used || '';
      sections.reasoning = parsed.reasoning || '';
      return sections;
    }
  } catch (e) {}
  
  const generalMatch = text.match(/## General Energy\n([\s\S]*?)(?=##|$)/i);
  if (generalMatch) sections.general = generalMatch[1].trim();
  const loveMatch = text.match(/## Love & Relationships\n([\s\S]*?)(?=##|$)/i);
  if (loveMatch) sections.love = loveMatch[1].trim();
  const careerMatch = text.match(/## Career & Finance\n([\s\S]*?)(?=##|$)/i);
  if (careerMatch) sections.career = careerMatch[1].trim();
  const healthMatch = text.match(/## Health & Wellness\n([\s\S]*?)(?=##|$)/i);
  if (healthMatch) sections.health = healthMatch[1].trim();
  
  const colorMatch = text.match(/Color:\s*([^\n]+)/i) || text.match(/"lucky_color":\s*"([^"]+)"/i);
  if (colorMatch) sections.lucky_color = colorMatch[1].trim();
  const numberMatch = text.match(/Number:\s*(\d+)/i) || text.match(/"lucky_number":\s*(\d+)/i);
  if (numberMatch) sections.lucky_number = parseInt(numberMatch[1]);

  return sections;
}