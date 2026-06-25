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

// ============================================
// PROVIDERS MANAGEMENT
// ============================================

export async function getAllProviders(): Promise<AIProvider[]> {
  try {
    const { data, error } = await supabase
      .from('ai_providers')
      .select('*')
      .order('priority', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching providers:', error);
    return [];
  }
}

export async function updateProvider(
  providerId: string,
  updates: Partial<AIProvider>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_providers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', providerId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('❌ Error updating provider:', error);
    return false;
  }
}

export async function toggleProvider(providerId: string, isActive: boolean): Promise<boolean> {
  return updateProvider(providerId, { is_active: isActive });
}

export async function resetCircuitBreaker(providerId: string): Promise<boolean> {
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
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching API keys:', error);
    return [];
  }
}

export async function addApiKey(
  providerName: string,
  apiKey: string,
  dailyLimit: number = 1000,
  priority: number = 1
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_api_keys')
      .insert({
        provider_name: providerName,
        api_key: apiKey,
        daily_limit: dailyLimit,
        priority: priority,
        is_active: true,
        current_usage: 0,
        error_count: 0
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('❌ Error adding API key:', error);
    return false;
  }
}

export async function updateApiKey(
  keyId: string,
  updates: Partial<AIApiKey>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_api_keys')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', keyId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('❌ Error updating API key:', error);
    return false;
  }
}

export async function deleteApiKey(keyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_api_keys')
      .delete()
      .eq('id', keyId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('❌ Error deleting API key:', error);
    return false;
  }
}

export async function toggleApiKey(keyId: string, isActive: boolean): Promise<boolean> {
  return updateApiKey(keyId, { is_active: isActive });
}

export async function testApiKey(keyId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data: key, error } = await supabase
      .from('ai_api_keys')
      .select('*, ai_providers(name)')
      .eq('id', keyId)
      .single();

    if (error || !key) {
      return { success: false, message: 'Key not found' };
    }

    const providerName = (key as any).ai_providers?.name || key.provider_name;
    
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
        return { success: true, message: '✅ Gemini API is working!' };
      } else {
        const errorData = await response.json();
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
        return { success: true, message: '✅ Groq API is working!' };
      } else {
        const errorData = await response.json();
        return { success: false, message: `❌ ${errorData.error?.message || 'API error'}` };
      }
    }

    return { success: false, message: '⚠️ Test not implemented for this provider' };

  } catch (error) {
    console.error('❌ Error testing API key:', error);
    return { success: false, message: `❌ ${(error as Error).message}` };
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
    console.error('❌ Error fetching prompts:', error);
    return [];
  }
}

export async function addPrompt(prompt: {
  name: string;
  category: string;
  system_prompt: string;
  user_prompt_template: string;
  variables?: string[];
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_prompts')
      .insert({
        ...prompt,
        variables: prompt.variables || [],
        is_active: true,
        version: 'v1'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('❌ Error adding prompt:', error);
    return false;
  }
}

export async function updatePrompt(
  promptId: string,
  updates: Partial<AIPrompt>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_prompts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', promptId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('❌ Error updating prompt:', error);
    return false;
  }
}

export async function deletePrompt(promptId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_prompts')
      .delete()
      .eq('id', promptId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('❌ Error deleting prompt:', error);
    return false;
  }
}

// ============================================
// USAGE STATISTICS
// ============================================

export async function getTodayStats(): Promise<AIUsageStats[]> {
  try {
    const { data, error } = await supabase
      .from('v_ai_today_stats')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching today stats:', error);
    return [];
  }
}

export async function getApiKeyUsage(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('v_api_key_usage')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching API key usage:', error);
    return [];
  }
}

export async function getCacheStats(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('v_cache_performance')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching cache stats:', error);
    return [];
  }
}

// ============================================
// KNOWLEDGE BASE
// ============================================

export async function getKnowledgeBaseStats(): Promise<{ total: number; categories: any[] }> {
  try {
    const { count, error: countError } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    const { data: categories, error: catError } = await supabase
      .from('knowledge_base')
      .select('category')
      .select('count');

    return {
      total: count || 0,
      categories: categories || []
    };
  } catch (error) {
    console.error('❌ Error fetching KB stats:', error);
    return { total: 0, categories: [] };
  }
}