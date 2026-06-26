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
    // ============================================
    if (providerName.includes('gemini')) {
      log('🧪 ===== GEMINI DYNAMIC DISCOVERY START =====');
      log('🧪 ⚠️ Thinking mode DISABLED (thinkingBudget: 0)');
      
      const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key.api_key}`;
      log('📤 GET URL:', modelsUrl);
      
      const modelsResponse = await fetch(modelsUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const modelsText = await modelsResponse.text();
      
      if (!modelsResponse.ok) {
        return { 
          success: false, 
          message: `❌ Cannot get models list. Status: ${modelsResponse.status}`,
          details: { status: modelsResponse.status, response: modelsText, debugLog }
        };
      }
      
      let modelsData;
      try {
        modelsData = JSON.parse(modelsText);
      } catch (e) {
        return { success: false, message: '❌ Invalid JSON from Google', details: { response: modelsText, debugLog } };
      }
      
      log(`📊 Total models: ${modelsData.models?.length || 0}`);
      
      const generateModels = modelsData.models.filter((model: any) => 
        model.supportedGenerationMethods?.includes('generateContent')
      );
      
      if (generateModels.length === 0) {
        return { success: false, message: '❌ No models support generateContent', details: { debugLog } };
      }
      
      for (let i = 0; i < generateModels.length; i++) {
        const model = generateModels[i];
        const modelName = model.name.replace('models/', '');
        
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key.api_key}`;
        
        const testBody = {
          contents: [{ parts: [{ text: 'Say "OK" in one word' }] }],
          generationConfig: { 
            maxOutputTokens: 100,
            temperature: 0.7,
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        };
        
        try {
          const testResponse = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testBody)
          });
          
          if (testResponse.ok) {
            const testData = await testResponse.json();
            
            if (testData?.candidates?.[0]?.content?.parts) {
              const parts = testData.candidates[0].content.parts;
              const realPart = parts.find((p: any) => !p.thought && p.text);
              
              if (realPart && realPart.text && realPart.text.trim().length > 0) {
                log(`✅ MODEL WORKS: ${model.displayName}`);
                
                try {
                  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                  await supabase
                    .from('ai_cache')
                    .upsert({
                      cache_key: 'gemini_working_model',
                      request_type: 'model_discovery',
                      provider: 'gemini',
                      model: modelName,
                      response_text: modelName,
                      input_tokens: 0,
                      output_tokens: 0,
                      cost: 0,
                      ttl_seconds: 86400,
                      expires_at: expiresAt,
                      hit_count: 0,
                      last_hit_at: new Date().toISOString()
                    }, { onConflict: 'cache_key' });
                } catch (e) {}
                
                return { 
                  success: true, 
                  message: `✅ Gemini works! Model: ${model.displayName}`,
                  details: {
                    workingModel: modelName,
                    modelDisplayName: model.displayName,
                    response: realPart.text,
                    debugLog
                  }
                };
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      return { 
        success: false, 
        message: `❌ All models failed.`,
        details: { debugLog }
      };
    }
    
    // ============================================
    // GROQ TEST
    // ============================================
    if (providerName.includes('groq')) {
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const requestBody = {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 10
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      if (response.ok) {
        return { 
          success: true, 
          message: '✅ Groq API is working!',
          details: { response: responseData, debugLog }
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
      const url = 'https://api.openai.com/v1/chat/completions';
      const requestBody = {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 10
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      if (response.ok) {
        return { success: true, message: '✅ OpenAI API is working!', details: { response: responseData, debugLog } };
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
// ✅ USAGE STATISTICS - განახლებული NaN-ის გარეშე
// ============================================

export async function getTodayStats(): Promise<AIUsageStats[]> {
  try {
    console.log('🔍 [getTodayStats] Fetching today stats...');
    
    // მივიღოთ დღევანდელი მონაცემები ai_usage-დან
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    const { data, error } = await supabase
      .from('ai_usage')
      .select('*')
      .gte('created_at', todayStr)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [getTodayStats] Error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('📊 [getTodayStats] No data for today');
      return [];
    }

    // დავაჯგუფოთ provider-ის მიხედვით
    const grouped: { [key: string]: AIUsageStats } = {};
    
    data.forEach((item: any) => {
      const provider = item.provider || 'unknown';
      
      if (!grouped[provider]) {
        grouped[provider] = {
          provider,
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0,
          total_tokens: 0,
          total_cost: 0,
          avg_response_time_ms: 0
        };
      }
      
      grouped[provider].total_requests++;
      
      if (item.success) {
        grouped[provider].successful_requests++;
      } else {
        grouped[provider].failed_requests++;
      }
      
      grouped[provider].total_tokens += item.total_tokens || 0;
      grouped[provider].total_cost += Number(item.cost) || 0;
    });
    
    // გამოვთვალოთ average response time
    Object.keys(grouped).forEach(provider => {
      const providerData = data.filter((item: any) => item.provider === provider);
      const totalTime = providerData.reduce((sum: number, item: any) => 
        sum + (item.response_time_ms || 0), 0
      );
      grouped[provider].avg_response_time_ms = totalTime / providerData.length;
    });
    
    const result = Object.values(grouped);
    console.log(`✅ [getTodayStats] Found ${result.length} providers with data`);
    
    return result;
    
  } catch (error) {
    console.error('❌ [getTodayStats] Exception:', error);
    return [];
  }
}

export async function getApiKeyUsage(): Promise<any[]> {
  try {
    console.log('🔍 [getApiKeyUsage] Fetching API key usage...');
    
    // მივიღოთ ყველა API key
    const { data: keys, error: keysError } = await supabase
      .from('ai_api_keys')
      .select('id, provider_name, current_usage, daily_limit');
    
    if (keysError) {
      console.error('❌ [getApiKeyUsage] Error:', keysError);
      throw keysError;
    }
    
    if (!keys || keys.length === 0) {
      console.log('📊 [getApiKeyUsage] No API keys found');
      return [];
    }
    
    // გამოვთვალოთ usage percentage
    const result = keys.map((key: any) => {
      const currentUsage = key.current_usage || 0;
      const dailyLimit = key.daily_limit || 1000;
      const usagePercentage = dailyLimit > 0 ? (currentUsage / dailyLimit) * 100 : 0;
      const remainingUsage = dailyLimit - currentUsage;
      
      return {
        provider_name: key.provider_name,
        current_usage: currentUsage,
        daily_limit: dailyLimit,
        usage_percentage: Math.round(usagePercentage * 100) / 100,
        remaining_usage: remainingUsage > 0 ? remainingUsage : 0
      };
    });
    
    console.log(`✅ [getApiKeyUsage] Found ${result.length} API keys`);
    return result;
    
  } catch (error) {
    console.error('❌ [getApiKeyUsage] Exception:', error);
    return [];
  }
}

export async function getCacheStats(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('ai_cache').select('*');
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