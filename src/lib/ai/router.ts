// ============================================
// AI ROUTER - ჭკვიანური მართვის სისტემა
// ============================================
// ლოგიკა:
// 1. Knowledge Base (0 ხარჯი)
// 2. Cache (0 ხარჯი)
// 3. Free APIs (0 ხარჯი) - Dynamic Model Discovery-ით
// 4. Paid APIs (💰 ხარჯი - მხოლოდ premium)
// 5. Fallback (მზა პასუხი)
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// ============================================
// TYPES
// ============================================

export interface AIRequest {
  requestType: string;
  prompt: string;
  userId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  responseTimeMs: number;
  cached: boolean;
  source: 'knowledge_base' | 'cache' | 'free_api' | 'paid_api' | 'fallback';
}

interface KBResult {
  content: string;
  confidence: number;
}

interface CacheResult {
  content: string;
  provider: string;
}

interface APIResult {
  content: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  success: boolean;
}

// ============================================
// 🔥 🔥 🔥 DYNAMIC MODEL DISCOVERY 🔥 🔥 🔥
// ვკითხულობთ Google-ს რა მოდელები აქვს
// და ვინახავთ cache-ში 24 საათით
// ============================================

async function discoverGeminiModel(apiKey: string): Promise<string | null> {
  try {
    console.log('🔍 [discoverGeminiModel] Starting dynamic model discovery...');
    
    // 1. ვცადოთ cache-დან წაკითხვა
    try {
      const { data: cached } = await supabase
        .from('ai_cache')
        .select('*')
        .eq('cache_key', 'gemini_working_model')
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (cached) {
        console.log('✅ [discoverGeminiModel] Found cached model:', cached.response_text);
        return cached.response_text;
      }
    } catch (e) {
      console.log('📤 [discoverGeminiModel] Cache miss, asking Google...');
    }
    
    // 2. ვკითხოთ Google-ს რა მოდელები აქვს
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const modelsResponse = await fetch(modelsUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!modelsResponse.ok) {
      console.error('❌ [discoverGeminiModel] Failed to get models list:', modelsResponse.status);
      return null;
    }
    
    const modelsData = await modelsResponse.json();
    const models = modelsData.models || [];
    
    console.log(`📊 [discoverGeminiModel] Found ${models.length} models total`);
    
    // 3. ვიპოვოთ რომელი მხარს უჭერს generateContent-ს
    const generateModels = models.filter((model: any) => 
      model.supportedGenerationMethods?.includes('generateContent')
    );
    
    console.log(`📊 [discoverGeminiModel] ${generateModels.length} models support generateContent`);
    
    if (generateModels.length === 0) {
      console.error('❌ [discoverGeminiModel] No models support generateContent');
      return null;
    }
    
    // 4. ვცადოთ თითოეული მოდელი
    for (const model of generateModels) {
      const modelName = model.name.replace('models/', '');
      console.log(`🧪 [discoverGeminiModel] Testing: ${modelName} (${model.displayName})`);
      
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const testBody = {
        contents: [{ parts: [{ text: 'Say "OK"' }] }],
        generationConfig: { maxOutputTokens: 5 }
      };
      
      try {
        const testResponse = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testBody)
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          if (testData.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.log(`✅ [discoverGeminiModel] Found working model: ${model.displayName} (${modelName})`);
            
            // 5. შევინახოთ cache-ში 24 საათით
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
            } catch (cacheError) {
              console.error('⚠️ [discoverGeminiModel] Failed to cache model:', cacheError);
            }
            
            return modelName;
          }
        } else {
          console.log(`❌ [discoverGeminiModel] ${modelName} failed: ${testResponse.status}`);
        }
      } catch (error) {
        console.error(`❌ [discoverGeminiModel] Error testing ${modelName}:`, error);
        continue;
      }
    }
    
    console.error('❌ [discoverGeminiModel] No working model found');
    return null;
    
  } catch (error) {
    console.error('❌ [discoverGeminiModel] Exception:', error);
    return null;
  }
}

// ============================================
// AI ROUTER CLASS
// ============================================

export class AIRouter {
  
  // ============================================
  // MAIN ROUTING FUNCTION
  // ============================================
  
  async routeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🧠 [AI Router] Processing request:', request.requestType);
      
      // ═══════════════════════════════════════
      // LEVEL 1: KNOWLEDGE BASE (0 ხარჯი)
      // ═══════════════════════════════════════
      console.log('📚 [Level 1] Checking Knowledge Base...');
      const kbResult = await this.checkKnowledgeBase(request.prompt);
      
      if (kbResult) {
        console.log('✅ [Level 1] Found in Knowledge Base!');
        
        const responseTime = Date.now() - startTime;
        
        await this.trackUsage(request, {
          provider: 'knowledge_base',
          model: 'static',
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          responseTimeMs: responseTime,
          success: true
        });
        
        return {
          content: kbResult.content,
          provider: 'knowledge_base',
          model: 'static',
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          responseTimeMs: responseTime,
          cached: false,
          source: 'knowledge_base'
        };
      }
      
      // ═══════════════════════════════════════
      // LEVEL 2: CACHE (0 ხარჯი)
      // ═══════════════════════════════════════
      console.log('💾 [Level 2] Checking Cache...');
      const cacheKey = this.generateCacheKey(request);
      const cachedResult = await this.checkCache(cacheKey);
      
      if (cachedResult) {
        console.log('✅ [Level 2] Found in Cache!');
        
        const responseTime = Date.now() - startTime;
        
        await this.trackUsage(request, {
          provider: cachedResult.provider,
          model: 'cached',
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          responseTimeMs: responseTime,
          success: true
        });
        
        return {
          content: cachedResult.content,
          provider: cachedResult.provider,
          model: 'cached',
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          responseTimeMs: responseTime,
          cached: true,
          source: 'cache'
        };
      }
      
      // ═══════════════════════════════════════
      // LEVEL 3: FREE APIs (0 ხარჯი)
      // ═══════════════════════════════════════
      console.log('🆓 [Level 3] Trying Free APIs...');
      const freeResult = await this.tryFreeAPIs(request);
      
      if (freeResult) {
        console.log('✅ [Level 3] Success with Free API!');
        
        await this.saveToCache(cacheKey, request, freeResult);
        
        if (await this.shouldSaveToKB(freeResult, request)) {
          await this.saveToKnowledgeBase(request, freeResult);
        }
        
        const responseTime = Date.now() - startTime;
        
        await this.trackUsage(request, {
          provider: freeResult.provider,
          model: freeResult.model,
          inputTokens: freeResult.inputTokens,
          outputTokens: freeResult.outputTokens,
          cost: 0,
          responseTimeMs: responseTime,
          success: true
        });
        
        return {
          content: freeResult.content,
          provider: freeResult.provider,
          model: freeResult.model,
          inputTokens: freeResult.inputTokens,
          outputTokens: freeResult.outputTokens,
          cost: 0,
          responseTimeMs: responseTime,
          cached: false,
          source: 'free_api'
        };
      }
      
      // ═══════════════════════════════════════
      // LEVEL 4: PAID APIs (💰 ხარჯი)
      // ═══════════════════════════════════════
      console.log('💰 [Level 4] Trying Paid APIs...');
      const paidResult = await this.tryPaidAPIs(request);
      
      if (paidResult) {
        console.log('✅ [Level 4] Success with Paid API!');
        
        await this.saveToCache(cacheKey, request, paidResult);
        
        if (await this.shouldSaveToKB(paidResult, request)) {
          await this.saveToKnowledgeBase(request, paidResult);
        }
        
        const responseTime = Date.now() - startTime;
        
        await this.trackUsage(request, {
          provider: paidResult.provider,
          model: paidResult.model,
          inputTokens: paidResult.inputTokens,
          outputTokens: paidResult.outputTokens,
          cost: paidResult.cost,
          responseTimeMs: responseTime,
          success: true
        });
        
        return {
          content: paidResult.content,
          provider: paidResult.provider,
          model: paidResult.model,
          inputTokens: paidResult.inputTokens,
          outputTokens: paidResult.outputTokens,
          cost: paidResult.cost,
          responseTimeMs: responseTime,
          cached: false,
          source: 'paid_api'
        };
      }
      
      // ═══════════════════════════════════════
      // LEVEL 5: FALLBACK (მზა პასუხი)
      // ═══════════════════════════════════════
      console.log('⚠️ [Level 5] All APIs failed, using fallback...');
      const fallbackContent = await this.getFallbackResponse(request.requestType);
      
      const responseTime = Date.now() - startTime;
      
      await this.trackUsage(request, {
        provider: 'fallback',
        model: 'static',
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        responseTimeMs: responseTime,
        success: true
      });
      
      return {
        content: fallbackContent,
        provider: 'fallback',
        model: 'static',
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        responseTimeMs: responseTime,
        cached: false,
        source: 'fallback'
      };
      
    } catch (error) {
      console.error('❌ [AI Router] Error:', error);
      
      const responseTime = Date.now() - startTime;
      
      await this.trackUsage(request, {
        provider: 'error',
        model: 'error',
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        responseTimeMs: responseTime,
        success: false,
        errorMessage: (error as Error).message
      });
      
      throw error;
    }
  }
  
  // ============================================
  // LEVEL 1: KNOWLEDGE BASE
  // ============================================
  
  private async checkKnowledgeBase(prompt: string): Promise<KBResult | null> {
    try {
      const keywords = this.extractKeywords(prompt);
      
      if (keywords.length === 0) return null;
      
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .or(keywords.map(k => `title.ilike.%${k}%`).join(','))
        .gte('quality_score', 4)
        .order('usage_count', { ascending: false })
        .limit(1);
      
      if (error || !data || data.length === 0) {
        return null;
      }
      
      const entry = data[0];
      
      await supabase
        .from('knowledge_base')
        .update({
          usage_count: entry.usage_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', entry.id);
      
      return {
        content: entry.content,
        confidence: entry.quality_score / 5
      };
      
    } catch (error) {
      console.error('❌ Knowledge Base check failed:', error);
      return null;
    }
  }
  
  // ============================================
  // LEVEL 2: CACHE
  // ============================================
  
  private async checkCache(cacheKey: string): Promise<CacheResult | null> {
    try {
      const { data, error } = await supabase
        .from('ai_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (error || !data) {
        return null;
      }
      
      await supabase
        .from('ai_cache')
        .update({
          hit_count: data.hit_count + 1,
          last_hit_at: new Date().toISOString()
        })
        .eq('id', data.id);
      
      return {
        content: data.response_text,
        provider: data.provider
      };
      
    } catch (error) {
      console.error('❌ Cache check failed:', error);
      return null;
    }
  }
  
  // ============================================
  // LEVEL 3: FREE APIs
  // ============================================
  
  private async tryFreeAPIs(request: AIRequest): Promise<APIResult | null> {
    try {
      const { data: freeKeys, error } = await supabase
        .from('ai_api_keys')
        .select(`
          id,
          api_key,
          provider_name,
          error_count,
          ai_providers!inner(
            name,
            tier,
            circuit_breaker_state,
            is_active
          )
        `)
        .eq('ai_providers.tier', 'free')
        .eq('is_active', true)
        .eq('ai_providers.is_active', true)
        .eq('ai_providers.circuit_breaker_state', 'closed')
        .order('priority', { ascending: true });
      
      if (error || !freeKeys || freeKeys.length === 0) {
        console.log('⚠️ No free API keys available');
        return null;
      }
      
      for (const key of freeKeys) {
        try {
          console.log(`🔄 Trying free API: ${key.provider_name}`);
          
          const result = await this.makeApiCall(
            key.provider_name,
            key.api_key,
            request.prompt,
            request.model
          );
          
          if (result && result.content) {
            return {
              content: result.content,
              provider: key.provider_name,
              model: result.model,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
              cost: 0,
              success: true
            };
          }
          
        } catch (error) {
          console.error(`❌ Free API ${key.provider_name} failed:`, error);
          
          await supabase
            .from('ai_api_keys')
            .update({
              error_count: ((key as any).error_count || 0) + 1,
              last_used_at: new Date().toISOString()
            })
            .eq('id', key.id);
          
          continue;
        }
      }
      
      console.log('⚠️ All free APIs failed');
      return null;
      
    } catch (error) {
      console.error('❌ Free APIs attempt failed:', error);
      return null;
    }
  }
  
  // ============================================
  // LEVEL 4: PAID APIs
  // ============================================
  
  private async tryPaidAPIs(request: AIRequest): Promise<APIResult | null> {
    try {
      if (request.userId) {
        const isPremium = await this.checkUserPremium(request.userId);
        if (!isPremium) {
          console.log('⚠️ User is not premium, skipping paid APIs');
          return null;
        }
      } else {
        return null;
      }
      
      const budgetCheck = await this.checkBudget();
      if (!budgetCheck.ok) {
        console.log('⚠️ Budget exhausted, skipping paid APIs');
        return null;
      }
      
      const { data: paidKeys, error } = await supabase
        .from('ai_api_keys')
        .select(`
          id,
          api_key,
          provider_name,
          error_count,
          ai_providers!inner(
            name,
            tier,
            circuit_breaker_state,
            is_active,
            cost_per_1m_tokens
          )
        `)
        .eq('ai_providers.tier', 'paid')
        .eq('is_active', true)
        .eq('ai_providers.is_active', true)
        .eq('ai_providers.circuit_breaker_state', 'closed')
        .order('ai_providers.cost_per_1m_tokens', { ascending: true })
        .order('priority', { ascending: true });
      
      if (error || !paidKeys || paidKeys.length === 0) {
        console.log('⚠️ No paid API keys available');
        return null;
      }
      
      for (const key of paidKeys) {
        try {
          console.log(`💰 Trying paid API: ${key.provider_name}`);
          
          const result = await this.makeApiCall(
            key.provider_name,
            key.api_key,
            request.prompt,
            request.model
          );
          
          if (result && result.content) {
            const costPer1M = (key as any).ai_providers?.cost_per_1m_tokens || 0;
            
            const cost = this.calculateCost(
              costPer1M,
              result.inputTokens,
              result.outputTokens
            );
            
            await this.updateBudgetSpend(cost);
            
            return {
              content: result.content,
              provider: key.provider_name,
              model: result.model,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
              cost,
              success: true
            };
          }
          
        } catch (error) {
          console.error(`❌ Paid API ${key.provider_name} failed:`, error);
          
          await supabase
            .from('ai_api_keys')
            .update({
              error_count: ((key as any).error_count || 0) + 1,
              last_used_at: new Date().toISOString()
            })
            .eq('id', key.id);
          
          continue;
        }
      }
      
      console.log('⚠️ All paid APIs failed');
      return null;
      
    } catch (error) {
      console.error('❌ Paid APIs attempt failed:', error);
      return null;
    }
  }
  
  // ============================================
  // LEVEL 5: FALLBACK
  // ============================================
  
  private async getFallbackResponse(requestType: string): Promise<string> {
    const fallbacks: Record<string, string> = {
      daily_horoscope: "დღეს კარგი დღეა ახალი დასაწყისებისთვის. იყავით ღია შესაძლებლობებისთვის და ენდეთ თქვენს ინტუიციას. ვარსკვლავები თქვენს მხარეს არიან!",
      weekly_horoscope: "ეს კვირა მოგვიტანს ცვლილებებს და ახალ შესაძლებლობებს. მოემზადეთ გამოწვევებისთვის და იყავით მოქნილი.",
      tarot_reading: "ბარათები მიუთითებენ ცვლილებებზე. დროა გადაწყვეტილებების მისაღებად და ახალი გზით წასასვლელად.",
      numerology: "თქვენი რიცხვები მიუთითებენ ძლიერ ენერგიაზე. გამოიყენეთ ეს პერიოდი პროდუქტიულად და შემოქმედებითად.",
      compatibility: "თქვენი თავსებადობა პოზიტიურია. კომუნიკაცია და გაგება გაძლიერდება.",
      ai_chat: "გთხოვთ სცადოთ მოგვიანებით. ჩვენი AI ასისტენტი დროებით მიუწვდომელია, მაგრამ მალე დაბრუნდება."
    };
    
    return fallbacks[requestType] || fallbacks.ai_chat;
  }
  
  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  private generateCacheKey(request: AIRequest): string {
    const content = `${request.requestType}:${request.prompt}:${request.model || 'default'}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `ai:${Math.abs(hash)}`;
  }
  
  private extractKeywords(prompt: string): string[] {
    const stopWords = ['რა', 'არის', 'როგორ', 'რატომ', 'რომელი', 'როდის', 'სად', 'ვინ', 'რისი', 'მომეცი', 'გამიკეთე', 'დღის', 'კვირის'];
    const words = prompt.toLowerCase().split(/\s+/);
    return words.filter(w => w.length > 2 && !stopWords.includes(w)).slice(0, 5);
  }
  
  // ✅ განახლებული makeApiCall - Dynamic Model Discovery-ით
  private async makeApiCall(
    provider: string,
    apiKey: string,
    prompt: string,
    model?: string
  ): Promise<{ content: string; model: string; inputTokens: number; outputTokens: number } | null> {
    
    // ============================================
    // 🔥 GEMINI - Dynamic Model Discovery-ით 🔥
    // ============================================
    if (provider.includes('gemini')) {
      console.log('🧠 [Gemini] Using Dynamic Model Discovery...');
      
      // ვიპოვოთ მოდელი რომელიც მუშაობს
      const workingModel = await discoverGeminiModel(apiKey);
      
      if (!workingModel) {
        console.error('❌ [Gemini] No working model found');
        throw new Error('No working Gemini model found');
      }
      
      console.log(`✅ [Gemini] Using discovered model: ${workingModel}`);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${workingModel}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.7, 
            maxOutputTokens: 2048 
          }
        })
      });
      
      if (!response.ok) {
        // თუ მოდელი ვეღარ მუშაობს, წავშალოთ cache-დან
        try {
          await supabase
            .from('ai_cache')
            .delete()
            .eq('cache_key', 'gemini_working_model');
          console.log('🗑️ [Gemini] Removed cached model, will rediscover next time');
        } catch (e) {}
        
        throw new Error(`Gemini API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        model: workingModel,
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0
      };
    }
    
    // ============================================
    // GROQ
    // ============================================
    if (provider.includes('groq')) {
      const usedModel = model || 'llama-3.3-70b-versatile';
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: usedModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2048
        })
      });
      
      if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);
      
      const data = await response.json();
      
      return {
        content: data.choices?.[0]?.message?.content || '',
        model: usedModel,
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0
      };
    }
    
    // ============================================
    // OPENAI
    // ============================================
    if (provider.includes('openai')) {
      const usedModel = model || 'gpt-4o-mini';
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: usedModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2048
        })
      });
      
      if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
      
      const data = await response.json();
      
      return {
        content: data.choices?.[0]?.message?.content || '',
        model: usedModel,
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0
      };
    }
    
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  private calculateCost(costPer1M: number, inputTokens: number, outputTokens: number): number {
    return ((inputTokens + outputTokens) / 1000000) * costPer1M;
  }
  
  private async checkUserPremium(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('users')
      .select('current_plan')
      .eq('id', userId)
      .single();
    
    return data?.current_plan !== 'FREE' && data?.current_plan !== null;
  }
  
  private async checkBudget(): Promise<{ ok: boolean; message?: string }> {
    const { data: budget } = await supabase
      .from('ai_budgets')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (!budget) return { ok: true };
    
    const dailyUsage = budget.current_daily_spend / budget.daily_limit;
    
    if (dailyUsage > 0.95) {
      return { ok: false, message: 'Daily budget exhausted' };
    }
    
    return { ok: true };
  }
  
  private async updateBudgetSpend(cost: number): Promise<void> {
    await supabase
      .from('ai_budgets')
      .update({
        current_daily_spend: supabase.rpc('increment_daily_spend', { amount: cost }),
        current_monthly_spend: supabase.rpc('increment_monthly_spend', { amount: cost })
      })
      .eq('is_active', true);
  }
  
  private async saveToCache(
    cacheKey: string,
    request: AIRequest,
    result: APIResult
  ): Promise<void> {
    try {
      const { data: config } = await supabase
        .from('ai_request_types')
        .select('cache_ttl_seconds')
        .eq('name', request.requestType)
        .single();
      
      const ttlSeconds = config?.cache_ttl_seconds || 3600;
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
      
      await supabase
        .from('ai_cache')
        .upsert({
          cache_key: cacheKey,
          request_type: request.requestType,
          provider: result.provider,
          model: result.model,
          response_text: result.content,
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
          cost: result.cost,
          ttl_seconds: ttlSeconds,
          expires_at: expiresAt,
          hit_count: 0,
          last_hit_at: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        });
      
    } catch (error) {
      console.error('❌ Cache save failed:', error);
    }
  }
  
  private async shouldSaveToKB(result: APIResult, request: AIRequest): Promise<boolean> {
    if (result.content.length < 100) return false;
    
    const isGeneric = !this.containsDateSpecificContent(result.content);
    if (!isGeneric) return false;
    
    const evergreenTypes = ['daily_horoscope', 'tarot_reading', 'numerology'];
    if (!evergreenTypes.includes(request.requestType)) return false;
    
    return true;
  }
  
  private containsDateSpecificContent(content: string): boolean {
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{4}/,
      /\d{4}-\d{2}-\d{2}/,
      /დღეს/, /ხვალ/, /გუშინ/,
      /this week/, /today/, /tomorrow/
    ];
    
    return datePatterns.some(pattern => pattern.test(content));
  }
  
  private async saveToKnowledgeBase(request: AIRequest, result: APIResult): Promise<void> {
    try {
      const keywords = this.extractKeywords(request.prompt);
      const title = keywords.slice(0, 3).join(' ');
      
      await supabase
        .from('knowledge_base')
        .upsert({
          category: request.requestType,
          title: title,
          content: result.content,
          language: 'ka',
          source: 'ai_generated',
          quality_score: 4,
          usage_count: 0,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'category,title,language'
        });
      
      console.log('📚 Saved to Knowledge Base:', title);
      
    } catch (error) {
      console.error('❌ Knowledge Base save failed:', error);
    }
  }
  
  private async trackUsage(
    request: AIRequest,
    data: {
      provider: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      cost: number;
      responseTimeMs: number;
      success: boolean;
      errorMessage?: string;
    }
  ): Promise<void> {
    try {
      await supabase
        .from('ai_usage')
        .insert({
          request_type: request.requestType,
          user_id: request.userId || null,
          provider: data.provider,
          model: data.model,
          input_tokens: data.inputTokens,
          output_tokens: data.outputTokens,
          total_tokens: data.inputTokens + data.outputTokens,
          cost: data.cost,
          response_time_ms: data.responseTimeMs,
          success: data.success,
          error_message: data.errorMessage || null
        });
      
    } catch (error) {
      console.error('❌ Usage tracking failed:', error);
    }
  }
}

// ============================================
// EXPORT SINGLETON INSTANCE
// ============================================

export const aiRouter = new AIRouter();