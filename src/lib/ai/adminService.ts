// ============================================
// AI ADMIN SERVICE - მართვის ფუნქციები
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// ============================================
// TYPES
// ============================================

export interface AIProvider {
  id: string;
  name: string;
  type: string;
  tier: string;
  preferred_model: string | null;
  rpm_limit: number;
  daily_token_limit: number;
  cost_per_1m_tokens: number;
  is_active: boolean;
  priority: number;
  circuit_breaker_state: string;
  consecutive_failures: number;
  created_at: string;
}

export interface AIApiKey {
  id: string;
  provider_name: string;
  api_key: string;
  is_active: boolean;
  current_usage: number;
  daily_limit: number;
  last_used_at: string | null;
  error_count: number;
  priority: number;
  created_at: string;
  ai_providers?: {
    tier: string;
    is_active: boolean;
  };
}

export interface AIPrompt {
  id: string;
  name: string;
  category: string;
  system_prompt: string;
  user_prompt_template: string;
  variables: string[];
  version: string;
  is_active: boolean;
  created_at: string;
}

export interface AIUsageStats {
  provider: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_tokens: number;
  total_cost: number;
  avg_response_time_ms: number;
}

export interface OperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

// ============================================
// PROVIDERS MANAGEMENT
// ============================================

export async function getAllProviders(): Promise<AIProvider[]> {
  try {
    console.log('🔍 [getAllProviders] Fetching providers...');
    const { data, error } = await supabase
      .from('ai_providers')
      .select('*')
      .order('priority', { ascending: true });

    if (error) throw error;
    console.log(`✅ [getAllProviders] Found ${data?.length || 0} providers`);
    return data || [];
  } catch (error) {
    console.error('❌ [getAllProviders] Exception:', error);
    return [];
  }
}

export async function updateProvider(
  providerId: string,
  updates: Partial<AIProvider>
): Promise<OperationResult> {
  try {
    const { data, error } = await supabase
      .from('ai_providers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', providerId)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function toggleProvider(providerId: string, isActive: boolean): Promise<OperationResult> {
  return updateProvider(providerId, { is_active: isActive });
}

export async function resetCircuitBreaker(providerId: string): Promise<OperationResult> {
  return updateProvider(providerId, {
    circuit_breaker_state: 'closed',
    consecutive_failures: 0
  });
}

// ============================================
// API KEYS MANAGEMENT
// ============================================

export async function getAllApiKeys(): Promise<AIApiKey[]> {
  try {
    console.log('🔍 [getAllApiKeys] Fetching API keys...');
    const { data, error } = await supabase
      .from('ai_api_keys')
      .select(`
        *,
        ai_providers (
          tier,
          is_active
        )
      `)
      .order('provider_name', { ascending: true })
      .order('priority', { ascending: true });

    if (error) throw error;
    console.log(`✅ [getAllApiKeys] Found ${data?.length || 0} API keys`);
    return data || [];
  } catch (error) {
    console.error('❌ [getAllApiKeys] Exception:', error);
    return [];
  }
}

export async function addApiKey(
  providerName: string,
  apiKey: string,
  dailyLimit: number = 1000,
  priority: number = 1
): Promise<OperationResult> {
  try {
    console.log('🔑 [addApiKey] Attempting to insert:', { providerName, dailyLimit, priority });
    
    const { data, error } = await supabase
      .from('ai_api_keys')
      .insert({
        provider_name: providerName,
        api_key: apiKey,
        daily_limit: dailyLimit,
        priority: priority,
        is_active: true,
        current_usage: 0,
        error_count: 0
      })
      .select();

    if (error) {
      console.error('❌ [addApiKey] Error:', error);
      return { success: false, error: error.message, data: { details: error.details, hint: error.hint, code: error.code } };
    }

    console.log('✅ [addApiKey] Success!');
    return { success: true, data };
  } catch (error) {
    console.error('❌ [addApiKey] Exception:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateApiKey(keyId: string, updates: Partial<AIApiKey>): Promise<OperationResult> {
  try {
    const { data, error } = await supabase
      .from('ai_api_keys')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', keyId)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteApiKey(keyId: string): Promise<OperationResult> {
  try {
    const { data, error } = await supabase
      .from('ai_api_keys')
      .delete()
      .eq('id', keyId)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function toggleApiKey(keyId: string, isActive: boolean): Promise<OperationResult> {
  return updateApiKey(keyId, { is_active: isActive });
}

// ============================================
// 🔥 🔥 🔥 DYNAMIC MODEL DISCOVERY TEST 🔥 🔥 🔥
// ჩვენ ვკითხულობთ Google-ს რა მოდელები აქვს
// და ვცდილობთ ყველას თანმიმდევრობით
// ============================================
export async function testApiKey(keyId: string): Promise<{ 
  success: boolean; 
  message: string;
  details?: any;
}> {
  const debugLog: any[] = [];
  const log = (msg: string, data?: any) => {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    console.log(entry, data || '');
    debugLog.push({ msg, data, time: new Date().toISOString() });
  };

  try {
    log('🧪 ===== DYNAMIC MODEL DISCOVERY TEST START =====');
    log('🧪 Key ID:', keyId);
    
    // 1. წაიკითხე გასაღები ბაზიდან
    const { data: key, error } = await supabase
      .from('ai_api_keys')
      .select('*, ai_providers(name, type)')
      .eq('id', keyId)
      .single();

    if (error || !key) {
      log('❌ Key not found', error);
      return { success: false, message: 'Key not found', details: { error, debugLog } };
    }

    log('✅ Key loaded from DB', {
      id: key.id,
      provider_name: key.provider_name,
      is_active: key.is_active,
      keyLength: key.api_key.length,
      keyPreview: key.api_key.substring(0, 20) + '...'
    });

    const providerName = (key as any).ai_providers?.name || key.provider_name;
    log('🧪 Provider name:', providerName);
    
    // ============================================
    // 🔥 GEMINI - DYNAMIC MODEL DISCOVERY 🔥
    // ვკითხულობთ Google-ს რა მოდელები აქვს
    // ============================================
    if (providerName.includes('gemini')) {
      log('🧪 ===== GEMINI DYNAMIC DISCOVERY START =====');
      log('🧪 Strategy: Ask Google "What models do you have?" then test each one');
      
      // ============================================
      // STEP 1: ვკითხოთ Google-ს რა მოდელები აქვს
      // ============================================
      log('\n📤 ===== STEP 1: ASK GOOGLE FOR MODELS =====');
      
      const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key.api_key}`;
      log('📤 GET URL:', modelsUrl);
      log('📤 METHOD: GET');
      log('📤 HEADERS: { Content-Type: application/json }');
      
      const modelsStartTime = Date.now();
      const modelsResponse = await fetch(modelsUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const modelsTime = Date.now() - modelsStartTime;
      
      log(`📥 Response received in ${modelsTime}ms`);
      log('📥 Status:', `${modelsResponse.status} ${modelsResponse.statusText}`);
      
      // ვაჩვენოთ ყველა response header
      log('📥 Response Headers:');
      modelsResponse.headers.forEach((value, k) => {
        log(`   📥 ${k}: ${value}`);
      });
      
      const modelsText = await modelsResponse.text();
      log('📥 Raw Response (first 3000 chars):', modelsText.substring(0, 3000));
      
      if (modelsText.length > 3000) {
        log(`... (${modelsText.length - 3000} more chars)`);
      }
      
      if (!modelsResponse.ok) {
        log('❌ ❌ ❌ FAILED TO GET MODELS LIST ❌ ❌ ❌');
        log('❌ This means the API key itself is invalid or blocked');
        
        let errorData;
        try {
          errorData = JSON.parse(modelsText);
          log('❌ Error details:', errorData);
        } catch (e) {
          log('⚠️ Response not valid JSON');
        }
        
        return { 
          success: false, 
          message: `❌ Cannot get models list. Status: ${modelsResponse.status}`,
          details: { 
            status: modelsResponse.status,
            statusText: modelsResponse.statusText,
            response: errorData || modelsText,
            debugLog 
          }
        };
      }
      
      let modelsData;
      try {
        modelsData = JSON.parse(modelsText);
      } catch (e) {
        log('❌ Failed to parse models response as JSON');
        return { success: false, message: '❌ Invalid JSON from Google', details: { response: modelsText, debugLog } };
      }
      
      log('✅ ✅ ✅ Got models list from Google! ✅ ✅ ✅');
      log(`📊 Total models returned: ${modelsData.models?.length || 0}`);
      
      // ============================================
      // STEP 2: ვნახოთ ყველა მოდელი
      // ============================================
      log('\n📋 ===== STEP 2: LIST ALL MODELS =====');
      
      if (!modelsData.models || modelsData.models.length === 0) {
        log('❌ No models found in response');
        return { success: false, message: '❌ No models available', details: { debugLog } };
      }
      
      modelsData.models.forEach((model: any, i: number) => {
        log(`\n📋 Model ${i + 1}:`, {
          name: model.name,
          displayName: model.displayName,
          description: model.description?.substring(0, 150),
          supportedMethods: model.supportedGenerationMethods,
          inputTokenLimit: model.inputTokenLimit,
          outputTokenLimit: model.outputTokenLimit
        });
      });
      
      // ============================================
      // STEP 3: ვიპოვოთ რომელი მხარს უჭერს generateContent-ს
      // ============================================
      log('\n🔍 ===== STEP 3: FILTER MODELS =====');
      
      const generateModels = modelsData.models.filter((model: any) => 
        model.supportedGenerationMethods?.includes('generateContent')
      );
      
      log(`📊 Total models: ${modelsData.models.length}`);
      log(`📊 Models supporting generateContent: ${generateModels.length}`);
      
      if (generateModels.length === 0) {
        log('❌ No models support generateContent');
        return { success: false, message: '❌ No models support generateContent', details: { debugLog } };
      }
      
      log('📋 Models that support generateContent:');
      generateModels.forEach((model: any, i: number) => {
        log(`   ${i + 1}. ${model.name} (${model.displayName})`);
      });
      
      // ============================================
      // STEP 4: ვცადოთ თითოეული მოდელი
      // ============================================
      log('\n🧪 ===== STEP 4: TEST EACH MODEL =====');
      
      for (let i = 0; i < generateModels.length; i++) {
        const model = generateModels[i];
        const modelName = model.name.replace('models/', '');
        
        log(`\n🧪 ----- Testing Model ${i + 1}/${generateModels.length}: ${modelName} -----`);
        log('📤 Model displayName:', model.displayName);
        log('📤 Input limit:', model.inputTokenLimit);
        log('📤 Output limit:', model.outputTokenLimit);
        
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key.api_key}`;
        const testBody = {
          contents: [{ parts: [{ text: 'Say "OK" in one word' }] }],
          generationConfig: { 
            maxOutputTokens: 10, 
            temperature: 0.7 
          }
        };
        
        log('📤 POST URL:', testUrl);
        log('📤 Request Body:', JSON.stringify(testBody, null, 2));
        
        try {
          const startTime = Date.now();
          const testResponse = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testBody)
          });
          
          const responseTime = Date.now() - startTime;
          log(`📥 Response in ${responseTime}ms`);
          log('📥 Status:', `${testResponse.status} ${testResponse.statusText}`);
          
          const testText = await testResponse.text();
          log('📥 Response (first 1500 chars):', testText.substring(0, 1500));
          
          let testData;
          try {
            testData = JSON.parse(testText);
          } catch (e) {
            log('⚠️ Response not valid JSON');
          }
          
          // წარმატება!
          if (testResponse.ok && testData?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const responseText = testData.candidates[0].content.parts[0].text;
            log('\n✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅');
            log(`✅ MODEL WORKS!`);
            log(`✅ Model: ${modelName}`);
            log(`✅ Display Name: ${model.displayName}`);
            log(`✅ Response: "${responseText}"`);
            log(`✅ Response time: ${responseTime}ms`);
            log(`✅ Input tokens: ${testData.usageMetadata?.promptTokenCount}`);
            log(`✅ Output tokens: ${testData.usageMetadata?.candidatesTokenCount}`);
            log('✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅');
            
            return { 
              success: true, 
              message: `✅ Gemini works! Model: ${model.displayName}`,
              details: {
                workingModel: modelName,
                modelDisplayName: model.displayName,
                response: responseText,
                responseTime,
                inputTokens: testData.usageMetadata?.promptTokenCount,
                outputTokens: testData.usageMetadata?.candidatesTokenCount,
                totalModelsFound: modelsData.models.length,
                generateModelsFound: generateModels.length,
                testedModels: i + 1,
                debugLog
              }
            };
          } else {
            log(`❌ Model ${modelName} failed`);
            if (testData?.error) {
              log('❌ Error code:', testData.error.code);
              log('❌ Error message:', testData.error.message);
              log('❌ Error status:', testData.error.status);
            }
          }
          
        } catch (fetchError) {
          log('❌ Fetch exception:', (fetchError as Error).message);
          log('❌ Stack:', (fetchError as Error).stack);
        }
      }
      
      // ყველა მოდელი ვერ მუშაობს
      log('\n❌ ❌ ❌ ALL MODELS FAILED ❌ ❌ ❌');
      log(`❌ Tried ${generateModels.length} models, none worked`);
      
      return { 
        success: false, 
        message: `❌ All ${generateModels.length} models failed. API key may be invalid or quota exceeded.`,
        details: {
          totalModelsFound: modelsData.models.length,
          generateModelsFound: generateModels.length,
          triedModels: generateModels.map((m: any) => m.name),
          debugLog
        }
      };
    }
    
    // ============================================
    // GROQ TEST
    // ============================================
    if (providerName.includes('groq')) {
      log('🧪 ===== GROQ TEST START =====');
      
      // ჯერ ვკითხოთ Groq-ს რა მოდელები აქვს
      log('📤 STEP 1: Asking Groq for models list...');
      
      const modelsUrl = 'https://api.groq.com/openai/v1/models';
      const modelsResponse = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key.api_key}`,
          'Content-Type': 'application/json'
        }
      });
      
      log('📥 Models Status:', `${modelsResponse.status} ${modelsResponse.statusText}`);
      
      const modelsText = await modelsResponse.text();
      log('📥 Models Response (first 2000 chars):', modelsText.substring(0, 2000));
      
      let modelsData;
      try {
        modelsData = JSON.parse(modelsText);
        log(`📊 Total models: ${modelsData.data?.length || 0}`);
        
        if (modelsData.data) {
          modelsData.data.forEach((model: any, i: number) => {
            log(`   ${i + 1}. ${model.id}`);
          });
        }
      } catch (e) {
        log('⚠️ Not valid JSON');
      }
      
      // ვცადოთ chat completion
      log('\n🧪 STEP 2: Testing chat completion...');
      
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const requestBody = {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 10
      };
      
      log('📤 URL:', url);
      log('📤 BODY:', JSON.stringify(requestBody, null, 2));
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseTime = Date.now() - startTime;
      log(`📥 Response in ${responseTime}ms`);
      log('📥 Status:', `${response.status} ${response.statusText}`);
      
      const responseText = await response.text();
      log('📥 Response:', responseText.substring(0, 2000));
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {}

      if (response.ok) {
        return { 
          success: true, 
          message: '✅ Groq API is working!',
          details: { responseTime, response: responseData, debugLog }
        };
      } else {
        return { 
          success: false, 
          message: `❌ ${responseData?.error?.message || 'Groq API error'}`,
          details: { status: response.status, error: responseData?.error, debugLog }
        };
      }
    }
    
    // ============================================
    // OPENAI TEST
    // ============================================
    if (providerName.includes('openai')) {
      log('🧪 ===== OPENAI TEST START =====');
      
      const url = 'https://api.openai.com/v1/chat/completions';
      const requestBody = {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 10
      };
      
      log('📤 URL:', url);
      log('📤 BODY:', JSON.stringify(requestBody, null, 2));
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseTime = Date.now() - startTime;
      log(`📥 Response in ${responseTime}ms`);
      log('📥 Status:', `${response.status} ${response.statusText}`);
      
      const responseText = await response.text();
      log('📥 Response:', responseText.substring(0, 2000));
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {}

      if (response.ok) {
        return { success: true, message: '✅ OpenAI API is working!', details: { responseTime, response: responseData, debugLog } };
      } else {
        return { success: false, message: `❌ ${responseData?.error?.message || 'OpenAI error'}`, details: { status: response.status, error: responseData?.error, debugLog } };
      }
    }

    return { 
      success: false, 
      message: `⚠️ Test not implemented for: ${providerName}`,
      details: { provider: providerName, debugLog }
    };

  } catch (error) {
    log('❌ TOP-LEVEL EXCEPTION:', error);
    log('❌ Error name:', (error as Error).name);
    log('❌ Error message:', (error as Error).message);
    log('❌ Error stack:', (error as Error).stack);
    return { 
      success: false, 
      message: `❌ ${(error as Error).message}`,
      details: { error: (error as Error).stack, debugLog }
    };
  }
}

// ============================================
// PROMPTS MANAGEMENT
// ============================================

export async function getAllPrompts(): Promise<AIPrompt[]> {
  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ [getAllPrompts] Exception:', error);
    return [];
  }
}

export async function addPrompt(prompt: {
  name: string;
  category: string;
  system_prompt: string;
  user_prompt_template: string;
  variables?: string[];
}): Promise<OperationResult> {
  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .insert({
        ...prompt,
        variables: prompt.variables || [],
        is_active: true,
        version: 'v1'
      })
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updatePrompt(promptId: string, updates: Partial<AIPrompt>): Promise<OperationResult> {
  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', promptId)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deletePrompt(promptId: string): Promise<OperationResult> {
  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .delete()
      .eq('id', promptId)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ============================================
// USAGE STATISTICS
// ============================================

export async function getTodayStats(): Promise<AIUsageStats[]> {
  try {
    const { data, error } = await supabase.from('v_ai_today_stats').select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ [getTodayStats] Exception:', error);
    return [];
  }
}

export async function getApiKeyUsage(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('v_api_key_usage').select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ [getApiKeyUsage] Exception:', error);
    return [];
  }
}

export async function getCacheStats(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('v_cache_performance').select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ [getCacheStats] Exception:', error);
    return [];
  }
}

export async function getKnowledgeBaseStats(): Promise<{ total: number; categories: any[] }> {
  try {
    const { count } = await supabase.from('knowledge_base').select('*', { count: 'exact', head: true });
    const { data: categories } = await supabase.from('knowledge_base').select('category');
    return { total: count || 0, categories: categories || [] };
  } catch (error) {
    console.error('❌ [getKnowledgeBaseStats] Exception:', error);
    return { total: 0, categories: [] };
  }
}