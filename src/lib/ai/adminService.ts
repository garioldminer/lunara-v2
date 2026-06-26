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

// ✅ RESULT TYPE - უკეთესი error handling-ისთვის
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

    if (error) {
      console.error('❌ [getAllProviders] Error:', error);
      throw error;
    }
    
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
    console.log('🔄 [updateProvider] Updating provider:', providerId, updates);
    const { data, error } = await supabase
      .from('ai_providers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', providerId)
      .select();

    if (error) {
      console.error('❌ [updateProvider] Error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ [updateProvider] Success');
    return { success: true, data };
  } catch (error) {
    console.error('❌ [updateProvider] Exception:', error);
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

    if (error) {
      console.error('❌ [getAllApiKeys] Error:', error);
      throw error;
    }
    
    console.log(`✅ [getAllApiKeys] Found ${data?.length || 0} API keys`);
    return data || [];
  } catch (error) {
    console.error('❌ [getAllApiKeys] Exception:', error);
    return [];
  }
}

// ✅ განახლებული addApiKey - უკეთესი error logging-ით
export async function addApiKey(
  providerName: string,
  apiKey: string,
  dailyLimit: number = 1000,
  priority: number = 1
): Promise<OperationResult> {
  try {
    console.log('🔑 [addApiKey] Attempting to insert API key:', {
      providerName,
      dailyLimit,
      priority,
      keyPreview: apiKey.substring(0, 10) + '...'
    });
    
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
      .select(); // ✅ ვთხოვთ რომ დაგვიბრუნოს ჩაწერილი მონაცემი

    if (error) {
      console.error('❌ [addApiKey] Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return { 
        success: false, 
        error: error.message,
        data: { details: error.details, hint: error.hint, code: error.code }
      };
    }

    console.log('✅ [addApiKey] Success! Inserted:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ [addApiKey] Exception:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateApiKey(
  keyId: string,
  updates: Partial<AIApiKey>
): Promise<OperationResult> {
  try {
    console.log('🔄 [updateApiKey] Updating key:', keyId, updates);
    const { data, error } = await supabase
      .from('ai_api_keys')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', keyId)
      .select();

    if (error) {
      console.error('❌ [updateApiKey] Error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ [updateApiKey] Success');
    return { success: true, data };
  } catch (error) {
    console.error('❌ [updateApiKey] Exception:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteApiKey(keyId: string): Promise<OperationResult> {
  try {
    console.log('🗑️ [deleteApiKey] Deleting key:', keyId);
    const { data, error } = await supabase
      .from('ai_api_keys')
      .delete()
      .eq('id', keyId)
      .select();

    if (error) {
      console.error('❌ [deleteApiKey] Error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ [deleteApiKey] Success');
    return { success: true, data };
  } catch (error) {
    console.error('❌ [deleteApiKey] Exception:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function toggleApiKey(keyId: string, isActive: boolean): Promise<OperationResult> {
  return updateApiKey(keyId, { is_active: isActive });
}

export async function testApiKey(keyId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🧪 [testApiKey] Testing key:', keyId);
    const { data: key, error } = await supabase
      .from('ai_api_keys')
      .select('*, ai_providers(name)')
      .eq('id', keyId)
      .single();

    if (error || !key) {
      console.error('❌ [testApiKey] Key not found:', error);
      return { success: false, message: 'Key not found' };
    }

    const providerName = (key as any).ai_providers?.name || key.provider_name;
    console.log('🧪 [testApiKey] Testing with provider:', providerName);
    
    // Test based on provider
    if (providerName.includes('gemini')) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key.api_key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "OK"' }] }],
            generationConfig: { maxOutputTokens: 10 }
          })
        }
      );

      if (response.ok) {
        console.log('✅ [testApiKey] Gemini API working!');
        return { success: true, message: '✅ Gemini API is working!' };
      } else {
        const errorData = await response.json();
        console.error('❌ [testApiKey] Gemini error:', errorData);
        return { success: false, message: `❌ ${errorData.error?.message || 'API error'}` };
      }
    }

    if (providerName.includes('groq')) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Say "OK"' }],
          max_tokens: 10
        })
      });

      if (response.ok) {
        console.log('✅ [testApiKey] Groq API working!');
        return { success: true, message: '✅ Groq API is working!' };
      } else {
        const errorData = await response.json();
        console.error('❌ [testApiKey] Groq error:', errorData);
        return { success: false, message: `❌ ${errorData.error?.message || 'API error'}` };
      }
    }

    return { success: false, message: '⚠️ Test not implemented for this provider' };

  } catch (error) {
    console.error('❌ [testApiKey] Exception:', error);
    return { success: false, message: `❌ ${(error as Error).message}` };
  }
}

// ============================================
// PROMPTS MANAGEMENT
// ============================================

export async function getAllPrompts(): Promise<AIPrompt[]> {
  try {
    console.log('🔍 [getAllPrompts] Fetching prompts...');
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [getAllPrompts] Error:', error);
      throw error;
    }
    
    console.log(`✅ [getAllPrompts] Found ${data?.length || 0} prompts`);
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
    console.log('📝 [addPrompt] Adding prompt:', prompt.name);
    const { data, error } = await supabase
      .from('ai_prompts')
      .insert({
        ...prompt,
        variables: prompt.variables || [],
        is_active: true,
        version: 'v1'
      })
      .select();

    if (error) {
      console.error('❌ [addPrompt] Error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ [addPrompt] Success');
    return { success: true, data };
  } catch (error) {
    console.error('❌ [addPrompt] Exception:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updatePrompt(
  promptId: string,
  updates: Partial<AIPrompt>
): Promise<OperationResult> {
  try {
    console.log('🔄 [updatePrompt] Updating prompt:', promptId);
    const { data, error } = await supabase
      .from('ai_prompts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', promptId)
      .select();

    if (error) {
      console.error('❌ [updatePrompt] Error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ [updatePrompt] Success');
    return { success: true, data };
  } catch (error) {
    console.error('❌ [updatePrompt] Exception:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deletePrompt(promptId: string): Promise<OperationResult> {
  try {
    console.log('🗑️ [deletePrompt] Deleting prompt:', promptId);
    const { data, error } = await supabase
      .from('ai_prompts')
      .delete()
      .eq('id', promptId)
      .select();

    if (error) {
      console.error('❌ [deletePrompt] Error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ [deletePrompt] Success');
    return { success: true, data };
  } catch (error) {
    console.error('❌ [deletePrompt] Exception:', error);
    return { success: false, error: (error as Error).message };
  }
}

// ============================================
// USAGE STATISTICS
// ============================================

export async function getTodayStats(): Promise<AIUsageStats[]> {
  try {
    console.log('🔍 [getTodayStats] Fetching today stats...');
    const { data, error } = await supabase
      .from('v_ai_today_stats')
      .select('*');

    if (error) {
      console.error('❌ [getTodayStats] Error:', error);
      throw error;
    }
    
    console.log(`✅ [getTodayStats] Found ${data?.length || 0} stats entries`);
    return data || [];
  } catch (error) {
    console.error('❌ [getTodayStats] Exception:', error);
    return [];
  }
}

export async function getApiKeyUsage(): Promise<any[]> {
  try {
    console.log('🔍 [getApiKeyUsage] Fetching API key usage...');
    const { data, error } = await supabase
      .from('v_api_key_usage')
      .select('*');

    if (error) {
      console.error('❌ [getApiKeyUsage] Error:', error);
      throw error;
    }
    
    console.log(`✅ [getApiKeyUsage] Found ${data?.length || 0} usage entries`);
    return data || [];
  } catch (error) {
    console.error('❌ [getApiKeyUsage] Exception:', error);
    return [];
  }
}

export async function getCacheStats(): Promise<any[]> {
  try {
    console.log('🔍 [getCacheStats] Fetching cache stats...');
    const { data, error } = await supabase
      .from('v_cache_performance')
      .select('*');

    if (error) {
      console.error('❌ [getCacheStats] Error:', error);
      throw error;
    }
    
    console.log(`✅ [getCacheStats] Found ${data?.length || 0} cache entries`);
    return data || [];
  } catch (error) {
    console.error('❌ [getCacheStats] Exception:', error);
    return [];
  }
}

// ============================================
// KNOWLEDGE BASE
// ============================================

export async function getKnowledgeBaseStats(): Promise<{ total: number; categories: any[] }> {
  try {
    console.log('🔍 [getKnowledgeBaseStats] Fetching KB stats...');
    const { count } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true });

    const { data: categories } = await supabase
      .from('knowledge_base')
      .select('category');

    console.log(`✅ [getKnowledgeBaseStats] Total: ${count}, Categories: ${categories?.length || 0}`);
    return {
      total: count || 0,
      categories: categories || []
    };
  } catch (error) {
    console.error('❌ [getKnowledgeBaseStats] Exception:', error);
    return { total: 0, categories: [] };
  }
}