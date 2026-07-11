import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id, reading_type = 'daily', date } = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    console.log(`Generating horoscope for user ${user_id} on ${targetDate} (type: ${reading_type})`);

    const { data: existing } = await supabase
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
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    console.log(`User sign: ${profile.sun_sign}, Moon: ${profile.moon_sign}`);

    const today = new Date().toISOString().split('T')[0];

    const { data: cosmicData, error: cosmicError } = await supabase
      .from('cosmic_daily_data')
      .select('*')
      .eq('date', today)
      .single();

    if (cosmicError || !cosmicData) {
      throw new Error('Cosmic data not found for today');
    }

    const { data: aspects } = await supabase
      .from('aspects')
      .select('*')
      .eq('date', today);

    const promptNames: Record<string, string> = {
      daily: 'daily_horoscope_base',
      today: 'daily_horoscope_base',
      tomorrow: 'tomorrow_horoscope_base',
      weekly: 'weekly_horoscope_base',
      monthly: 'monthly_horoscope_base'
    };

    const promptName = promptNames[reading_type] || 'daily_horoscope_base';
    console.log(`Using prompt template: ${promptName}`);

    const { data: prompt, error: promptError } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('name', promptName)
      .eq('is_active', true)
      .single();

    if (promptError || !prompt) {
      console.error('Prompt error:', promptError);
      throw new Error(`Prompt template not found: ${promptName}`);
    }

    const transitsText = (aspects || [])
      .slice(0, 5)
      .map(a => `${a.planet1} ${a.aspect_type} ${a.planet2} (${a.influence})`)
      .join('\n');

    const userPrompt = prompt.user_prompt_template
      .replace(/\{\{sun_sign\}\}/g, profile.sun_sign)
      .replace(/\{\{moon_sign\}\}/g, profile.moon_sign || 'Unknown')
      .replace(/\{\{rising_sign\}\}/g, profile.rising_sign || 'Unknown')
      .replace(/\{\{date\}\}/g, targetDate)
      .replace(/\{\{moon_phase\}\}/g, cosmicData.moon_phase)
      .replace(/\{\{moon_illumination\}\}/g, String(cosmicData.moon_illumination))
      .replace(/\{\{moon_sign_current\}\}/g, cosmicData.moon_sign)
      .replace(/\{\{sun_sign_current\}\}/g, cosmicData.sun_sign)
      .replace(/\{\{transits\}\}/g, transitsText || 'No major transits')
      .replace(/\{\{dominant_element\}\}/g, cosmicData.dominant_element)
      .replace(/\{\{energy_level\}\}/g, String(cosmicData.energy_level));

    console.log('Prompt prepared, calling AI...');

    const startTime = Date.now();
    let aiResponse: any;
    let aiModel = 'gemini';
    let tokensUsed = 0;

    try {
      const geminiKey = await getApiKey(supabase, 'gemini');
      aiResponse = await callGemini(geminiKey, prompt.system_prompt, userPrompt);
      tokensUsed = aiResponse.tokensUsed || 0;
    } catch (geminiError) {
      console.error('Gemini failed, trying Groq:', geminiError);

      try {
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

    let parsed = parseHoroscopeResponse(aiResponse.text);

    // ============================================
    // 🆕 POST-PROCESSING: Sign Replacement
    // ============================================
    const userSign = profile.sun_sign.toLowerCase();
    const userSignCapitalized = profile.sun_sign.charAt(0).toUpperCase() + profile.sun_sign.slice(1).toLowerCase();
    
    console.log(`🔧 Post-processing: replacing wrong signs with ${userSignCapitalized}`);

    const allSigns = [
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 
      'virgo', 'libra', 'scorpio', 'sagittarius', 
      'capricorn', 'aquarius', 'pisces'
    ];

    const replaceSignInText = (text: string): string => {
      let result = text;
      
      allSigns.forEach(sign => {
        if (sign === userSign) return;
        
        const signCap = sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();
        
        result = result.replace(
          new RegExp(`\\bAs\\s+an?\\s+${signCap}\\b`, 'gi'),
          `As a ${userSignCapitalized}`
        );
        
        result = result.replace(
          new RegExp(`\\b${signCap}\\b`, 'g'),
          userSignCapitalized
        );
      });
      
      return result;
    };

    parsed.general = replaceSignInText(parsed.general);
    parsed.love = replaceSignInText(parsed.love);
    parsed.career = replaceSignInText(parsed.career);
    parsed.health = replaceSignInText(parsed.health);
    parsed.finance = replaceSignInText(parsed.finance);
    parsed.affirmation = replaceSignInText(parsed.affirmation);
    parsed.hero_description = replaceSignInText(parsed.hero_description);

    console.log(`✅ Post-processing complete: all signs replaced with ${userSignCapitalized}`);

    let newHoroscope;
    
    const { data, error: insertError } = await supabase
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
        cosmic_energy_level: parsed.cosmic_energy_level,
        love_energy_level: parsed.love_energy_level,
        career_energy_level: parsed.career_energy_level,
        moon_phase: cosmicData.moon_phase,
        moon_sign: cosmicData.moon_sign,
        key_transits: aspects || [],
        lucky_color: parsed.lucky_color,
        lucky_number: parsed.lucky_number,
        lucky_planet: parsed.lucky_planet,
        lucky_crystal: parsed.lucky_crystal,
        hero_description: parsed.hero_description,
        affirmation: parsed.affirmation,
        ai_model_used: aiModel,
        tokens_used: tokensUsed,
        generation_time_ms: generationTime
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        console.log('⚠️ Duplicate key detected, fetching existing horoscope...');
        const { data: existingHoroscope, error: fetchError } = await supabase
          .from('horoscopes')
          .select('*')
          .eq('user_id', user_id)
          .eq('reading_type', reading_type)
          .eq('date', targetDate)
          .single();
        
        if (fetchError) {
          throw fetchError;
        }
        newHoroscope = existingHoroscope;
      } else {
        throw insertError;
      }
    } else {
      newHoroscope = data;
    }

    if (data) {
      await supabase
        .from('user_profiles')
        .update({
          total_readings: (profile.total_readings || 0) + 1,
          last_reading_at: new Date().toISOString()
        })
        .eq('id', user_id);

      await supabase
        .from('ai_api_keys')
        .update({
          current_usage: (await getCurrentUsage(supabase, aiModel)) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('provider_name', aiModel);
    }

    console.log(`✅ Horoscope saved successfully for ${targetDate} (${reading_type})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        cached: !data,
        data: newHoroscope,
        ai_model: aiModel,
        tokens_used: tokensUsed,
        generation_time_ms: generationTime
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

// ✅ განახლებული Gemini API - temperature 0.5
async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
      }],
      generationConfig: {
        temperature: 0.5,  // ✅ 0.7 → 0.5
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

// ✅ განახლებული Groq API - temperature 0.5
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
      temperature: 0.5,  // ✅ 0.7 → 0.5
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
    cosmic_energy_level: 'Medium',
    love_energy_level: 'Medium',
    career_energy_level: 'Medium',
    lucky_color: '',
    lucky_number: 0,
    lucky_planet: '',
    lucky_crystal: '',
    hero_description: '',
    affirmation: ''
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

      const normalizeLevel = (level: string) => {
        if (!level) return 'Medium';
        const lower = level.toLowerCase();
        if (lower.includes('very')) return 'Very High';
        if (lower.includes('high')) return 'High';
        if (lower.includes('medium')) return 'Medium';
        if (lower.includes('low')) return 'Low';
        return 'Medium';
      };

      sections.cosmic_energy_level = normalizeLevel(parsed.cosmic_energy_level);
      sections.love_energy_level = normalizeLevel(parsed.love_energy_level);
      sections.career_energy_level = normalizeLevel(parsed.career_energy_level);

      return sections;
    }
  } catch (e) {
    console.log('JSON parsing failed, trying markdown format');
  }

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

  const cosmicMatch = text.match(/"cosmic_energy_level":\s*"([^"]+)"/i);
  if (cosmicMatch) {
    const level = cosmicMatch[1].trim().toLowerCase();
    if (['low', 'medium', 'high', 'very high'].includes(level)) {
      sections.cosmic_energy_level = level.charAt(0).toUpperCase() + level.slice(1);
    }
  }

  const loveEnergyMatch = text.match(/"love_energy_level":\s*"([^"]+)"/i);
  if (loveEnergyMatch) {
    const level = loveEnergyMatch[1].trim().toLowerCase();
    if (['low', 'medium', 'high', 'very high'].includes(level)) {
      sections.love_energy_level = level.charAt(0).toUpperCase() + level.slice(1);
    }
  }

  const careerEnergyMatch = text.match(/"career_energy_level":\s*"([^"]+)"/i);
  if (careerEnergyMatch) {
    const level = careerEnergyMatch[1].trim().toLowerCase();
    if (['low', 'medium', 'high', 'very high'].includes(level)) {
      sections.career_energy_level = level.charAt(0).toUpperCase() + level.slice(1);
    }
  }

  const colorMatch = text.match(/Color:\s*([^\n]+)/i) || text.match(/"lucky_color":\s*"([^"]+)"/i);
  if (colorMatch) sections.lucky_color = colorMatch[1].trim();

  const numberMatch = text.match(/Number:\s*(\d+)/i) || text.match(/"lucky_number":\s*(\d+)/i);
  if (numberMatch) sections.lucky_number = parseInt(numberMatch[1]);

  const planetMatch = text.match(/"lucky_planet":\s*"([^"]+)"/i);
  if (planetMatch) sections.lucky_planet = planetMatch[1].trim();

  const crystalMatch = text.match(/"lucky_crystal":\s*"([^"]+)"/i);
  if (crystalMatch) sections.lucky_crystal = crystalMatch[1].trim();

  const heroMatch = text.match(/"hero_description":\s*"([^"]+)"/i);
  if (heroMatch) sections.hero_description = heroMatch[1].trim();

  const affirmationMatch = text.match(/## (?:Daily|Weekly|Monthly)?\s*Affirmation\n"([^"]+)"/i) 
    || text.match(/Affirmation:\s*"([^"]+)"/i)
    || text.match(/"affirmation":\s*"([^"]+)"/i)
    || text.match(/"([^"]{20,})"/);

  if (affirmationMatch) sections.affirmation = affirmationMatch[1].trim();

  return sections;
}