import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. მიიღე request body
    const { user_id, reading_type = 'daily', date } = await req.json();
    
    if (!user_id) {
      throw new Error('user_id is required');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    console.log(`Generating horoscope for user ${user_id} on ${targetDate}`);

    // 2. შეამოწე არსებობს თუ არა უკვე horoscope
    const { data: existing, error: existingError } = await supabase
      .from('horoscopes')
      .select('*')
      .eq('user_id', user_id)
      .eq('reading_type', reading_type)
      .eq('date', targetDate)
      .single();

    if (existing) {
      console.log('Horoscope already exists, returning cached');
      return new Response(
        JSON.stringify({ 
          success: true, 
          cached: true, 
          data: existing 
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. მიიღე მომხმარებლის პროფილი
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    console.log(`User sign: ${profile.sun_sign}, Moon: ${profile.moon_sign}`);

    // 4. მიიღე დღევანდელი კოსმოსური მონაცემები
    const { data: cosmicData, error: cosmicError } = await supabase
      .from('cosmic_daily_data')
      .select('*')
      .eq('date', targetDate)
      .single();

    if (cosmicError || !cosmicData) {
      throw new Error('Cosmic data not found for this date');
    }

    // 5. მიიღე ასპექტები
    const { data: aspects, error: aspectsError } = await supabase
      .from('aspects')
      .select('*')
      .eq('date', targetDate);

    // 6. აიღე prompt template
    const { data: prompt, error: promptError } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('name', 'daily_horoscope_base')
      .eq('is_active', true)
      .single();

    if (promptError || !prompt) {
      throw new Error('Prompt template not found');
    }

    // 7. მოამზადე ტრანზიტების ტექსტი
    const transitsText = (aspects || [])
      .slice(0, 5)
      .map(a => `${a.planet1} ${a.aspect_type} ${a.planet2} (${a.influence})`)
      .join('\n');

    // 8. ჩაასვი ცვლადები prompt-ში
    const userPrompt = prompt.user_prompt_template
      .replace('{{sun_sign}}', profile.sun_sign)
      .replace('{{moon_sign}}', profile.moon_sign || 'Unknown')
      .replace('{{rising_sign}}', profile.rising_sign || 'Unknown')
      .replace('{{date}}', targetDate)
      .replace('{{moon_phase}}', cosmicData.moon_phase)
      .replace('{{moon_illumination}}', String(cosmicData.moon_illumination))
      .replace('{{moon_sign_current}}', cosmicData.moon_sign)
      .replace('{{sun_sign_current}}', cosmicData.sun_sign)
      .replace('{{transits}}', transitsText || 'No major transits')
      .replace('{{dominant_element}}', cosmicData.dominant_element)
      .replace('{{energy_level}}', String(cosmicData.energy_level));

    console.log('Prompt prepared, calling AI...');

    // 9. გამოიძახე AI API (Gemini → Groq fallback)
    const startTime = Date.now();
    let aiResponse: any;
    let aiModel = 'gemini';
    let tokensUsed = 0;

    try {
      // Gemini API
      const geminiKey = await getApiKey(supabase, 'gemini');
      aiResponse = await callGemini(geminiKey, prompt.system_prompt, userPrompt);
      tokensUsed = aiResponse.tokensUsed || 0;
    } catch (geminiError) {
      console.error('Gemini failed, trying Groq:', geminiError);
      
      try {
        // Groq API (fallback)
        const groqKey = await getApiKey(supabase, 'groq');
        aiResponse = await callGroq(groqKey, prompt.system_prompt, userPrompt);
        aiModel = 'groq';
        tokensUsed = aiResponse.tokensUsed || 0;
      } catch (groqError) {
        throw new Error(`Both AI APIs failed: ${groqError}`);
      }
    }

    const generationTime = Date.now() - startTime;
    console.log(`AI response received in ${generationTime}ms`);

    // 10. პარსე AI პასუხი
    const parsed = parseHoroscopeResponse(aiResponse.text);

    // 11. შეინახე horoscopes ცხრილში
    const { data: newHoroscope, error: insertError } = await supabase
      .from('horoscopes')
      .insert({
        user_id,
        reading_type,
        date: targetDate,
        general_prediction: parsed.general,
        love_prediction: parsed.love,
        career_prediction: parsed.career,
        health_prediction: parsed.health,
        finance_prediction: parsed.finance,
        moon_phase: cosmicData.moon_phase,
        moon_sign: cosmicData.moon_sign,
        key_transits: aspects || [],
        lucky_color: parsed.lucky_color,
        lucky_number: parsed.lucky_number,
        affirmation: parsed.affirmation,
        ai_model_used: aiModel,
        tokens_used: tokensUsed,
        generation_time_ms: generationTime
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // 12. განაახლე მომხმარებლის სტატისტიკა
    await supabase
      .from('user_profiles')
      .update({
        total_readings: (profile.total_readings || 0) + 1,
        last_reading_at: new Date().toISOString()
      })
      .eq('id', user_id);

    // 13. განაახლე API key usage
    await supabase
      .from('ai_api_keys')
      .update({
        current_usage: (await getCurrentUsage(supabase, aiModel)) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('provider_name', aiModel);

    console.log(`Horoscope saved successfully for ${targetDate}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        cached: false, 
        data: newHoroscope,
        ai_model: aiModel,
        tokens_used: tokensUsed,
        generation_time_ms: generationTime
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getApiKey(supabase: any, provider: string): Promise<string> {
  const { data } = await supabase
    .from('ai_api_keys')
    .select('api_key')
    .eq('provider_name', provider)
    .eq('is_active', true)
    .single();

  if (!data) {
    throw new Error(`${provider} API key not found`);
  }

  return data.api_key;
}

async function getCurrentUsage(supabase: any, provider: string): Promise<number> {
  const { data } = await supabase
    .from('ai_api_keys')
    .select('current_usage')
    .eq('provider_name', provider)
    .single();

  return data?.current_usage || 0;
}

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return {
    text,
    tokensUsed: data.usageMetadata?.totalTokenCount || 0
  };
}

async function callGroq(apiKey: string, systemPrompt: string, userPrompt: string) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  return {
    text,
    tokensUsed: data.usage?.total_tokens || 0
  };
}

function parseHoroscopeResponse(text: string) {
  const sections = {
    general: '',
    love: '',
    career: '',
    health: '',
    finance: '',
    lucky_color: '',
    lucky_number: 0,
    affirmation: ''
  };

  // პარსე სექციები
  const generalMatch = text.match(/## General Energy\n([\s\S]*?)(?=##|$)/i);
  if (generalMatch) sections.general = generalMatch[1].trim();

  const loveMatch = text.match(/## Love & Relationships\n([\s\S]*?)(?=##|$)/i);
  if (loveMatch) sections.love = loveMatch[1].trim();

  const careerMatch = text.match(/## Career & Finance\n([\s\S]*?)(?=##|$)/i);
  if (careerMatch) {
    sections.career = careerMatch[1].trim();
    sections.finance = careerMatch[1].trim();
  }

  const healthMatch = text.match(/## Health & Wellness\n([\s\S]*?)(?=##|$)/i);
  if (healthMatch) sections.health = healthMatch[1].trim();

  // Lucky elements
  const colorMatch = text.match(/Color:\s*([^\n]+)/i);
  if (colorMatch) sections.lucky_color = colorMatch[1].trim();

  const numberMatch = text.match(/Number:\s*(\d+)/i);
  if (numberMatch) sections.lucky_number = parseInt(numberMatch[1]);

  // Affirmation
  const affirmationMatch = text.match(/## Daily Affirmation\n"([^"]+)"/i);
  if (affirmationMatch) sections.affirmation = affirmationMatch[1].trim();

  return sections;
}