-- ============================================
-- COMPLETE AI INFRASTRUCTURE SYSTEM
-- Version: 2.0.0
-- Date: 2024-01-01
-- Description: Multi-agent AI system with:
--   - Provider management & API key rotation
--   - Dynamic model discovery
--   - Knowledge base & self-learning
--   - Queue system for 10K+ users
--   - Circuit breaker & graceful degradation
--   - Budget control & A/B testing
--   - Multi-agent orchestration
-- ============================================

-- ============================================
-- SECTION 1: CORE INFRASTRUCTURE
-- ============================================

-- 1.1 AI PROVIDERS (პროვაიდერების რეესტრი)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'voice')),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'paid', 'specialized')),
  base_url TEXT,
  preferred_model TEXT,  -- Optional fallback
  rpm_limit INTEGER DEFAULT 60,
  daily_token_limit INTEGER DEFAULT 1000000,
  cost_per_1m_tokens DECIMAL(10,6) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 1,
  max_retries INTEGER DEFAULT 3,
  timeout_ms INTEGER DEFAULT 30000,
  
  -- Circuit Breaker
  circuit_breaker_state TEXT DEFAULT 'closed' CHECK (circuit_breaker_state IN ('closed', 'open', 'half-open')),
  consecutive_failures INTEGER DEFAULT 0,
  failure_threshold INTEGER DEFAULT 5,
  recovery_timeout_seconds INTEGER DEFAULT 300,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ai_providers IS 'Registry of AI providers with circuit breaker protection';

-- 1.2 AI API KEYS (მრავლობითი გასაღებების მენეჯმენტი)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL REFERENCES ai_providers(name) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  current_usage INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 1000,
  last_used_at TIMESTAMP WITH TIME ZONE,
  error_count INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_name, api_key)
);

COMMENT ON TABLE ai_api_keys IS 'Multiple API keys per provider with rotation and load balancing';

-- 1.3 AI DISCOVERED MODELS (დინამიური მოდელების აღმოჩენა)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_discovered_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL REFERENCES ai_providers(name) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  model_name TEXT,
  is_free_tier BOOLEAN DEFAULT FALSE,
  supports_text BOOLEAN DEFAULT FALSE,
  supports_image BOOLEAN DEFAULT FALSE,
  supports_voice BOOLEAN DEFAULT FALSE,
  max_tokens INTEGER,
  input_cost_per_1m DECIMAL(10,6) DEFAULT 0,
  output_cost_per_1m DECIMAL(10,6) DEFAULT 0,
  rpm_limit INTEGER,
  is_healthy BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_name, model_id)
);

COMMENT ON TABLE ai_discovered_models IS 'Dynamically discovered models from APIs (no hardcoded models)';

-- 1.4 AI HEALTH CHECKS (ჯანმრთელობის მონიტორინგი)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  model_id TEXT,
  check_type TEXT CHECK (check_type IN ('discovery', 'health', 'fallback')),
  success BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  models_found INTEGER,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ai_health_checks IS 'Health check history for providers and models';

-- ============================================
-- SECTION 2: PROMPT & REQUEST MANAGEMENT
-- ============================================

-- 2.1 AI PROMPTS (პრომპტების ბიბლიოთეკა)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('horoscope', 'tarot', 'chat', 'numerology', 'compatibility', 'general')),
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  version TEXT DEFAULT 'v1',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ai_prompts IS 'Template library for AI prompts with versioning and variable support';

-- 2.2 AI REQUEST TYPES (მოთხოვნის ტიპების კონფიგურაცია)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_request_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  allowed_providers JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_provider TEXT,
  cache_ttl_seconds INTEGER DEFAULT 3600,
  free_user_daily_limit INTEGER DEFAULT 10,
  premium_user_daily_limit INTEGER DEFAULT 100,
  max_tokens INTEGER DEFAULT 2048,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  
  -- Smart Model Selection
  complexity_level TEXT DEFAULT 'medium' CHECK (complexity_level IN ('simple', 'medium', 'complex', 'expert')),
  simple_model TEXT,
  complex_model TEXT,
  
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ai_request_types IS 'Configuration for different types of AI requests with smart model selection';

-- ============================================
-- SECTION 3: USAGE TRACKING & ANALYTICS
-- ============================================

-- 3.1 AI USAGE (გამოყენების ჟურნალი)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  api_key_id UUID REFERENCES ai_api_keys(id) ON DELETE SET NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  ip_address TEXT,
  metadata JSONB,
  
  -- Quality Scoring
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative', 'neutral')),
  feedback_at TIMESTAMP WITH TIME ZONE,
  response_length INTEGER,
  contains_keywords BOOLEAN,
  
  -- Self-Learning
  saved_to_kb BOOLEAN DEFAULT FALSE,
  kb_entry_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ai_usage IS 'Detailed log of every AI request with quality tracking and self-learning';

-- 3.2 AI DAILY STATS (ადმინის დეშბორდის სტატისტიკა)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  provider TEXT NOT NULL,
  request_type TEXT,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,6) DEFAULT 0,
  avg_response_time_ms INTEGER,
  cache_hits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, provider, request_type)
);

COMMENT ON TABLE ai_daily_stats IS 'Aggregated daily statistics for admin dashboard';

-- ============================================
-- SECTION 4: CACHING & PERFORMANCE
-- ============================================

-- 4.1 AI CACHE (ქეში / ფულის დაზოგვის სისტემა)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  request_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  response_text TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0,
  ttl_seconds INTEGER DEFAULT 3600,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_hit_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE ai_cache IS 'Response cache to reduce API calls and costs';

-- ============================================
-- SECTION 5: KNOWLEDGE BASE & SELF-LEARNING
-- ============================================

-- 5.1 KNOWLEDGE BASE (ცოდნის ბაზა)
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'ka',
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated', 'user_feedback')),
  quality_score INTEGER DEFAULT 5 CHECK (quality_score BETWEEN 1 AND 5),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, title, language)
);

COMMENT ON TABLE knowledge_base IS 'Static knowledge that never changes (zodiac signs, tarot meanings, etc.)';

-- ============================================
-- SECTION 6: QUEUE SYSTEM & LOAD BALANCING
-- ============================================

-- 6.1 AI QUEUE (რიგის სისტემა 10K+ მომხმარებლისთვის)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),  -- 1=high, 2=medium, 3=low
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  assigned_key_id UUID REFERENCES ai_api_keys(id),
  result TEXT,
  error_message TEXT,
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  wait_time_ms INTEGER
);

COMMENT ON TABLE ai_queue IS 'Queue system for handling 10K+ concurrent users with priority levels';

-- ============================================
-- SECTION 7: BUDGET & EXPERIMENTS
-- ============================================

-- 7.1 AI BUDGETS (ბიუჯეტის კონტროლი)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  daily_limit DECIMAL(10,2),
  monthly_limit DECIMAL(10,2),
  alert_threshold DECIMAL(3,2) DEFAULT 0.80,
  current_daily_spend DECIMAL(10,2) DEFAULT 0,
  current_monthly_spend DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ai_budgets IS 'Budget control with alerts to prevent overspending';

-- 7.2 AI EXPERIMENTS (A/B Testing Framework)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  request_type TEXT NOT NULL,
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  traffic_split DECIMAL(3,2) DEFAULT 0.50,
  total_requests INTEGER DEFAULT 0,
  variant_a_requests INTEGER DEFAULT 0,
  variant_b_requests INTEGER DEFAULT 0,
  variant_a_avg_score DECIMAL(3,2),
  variant_b_avg_score DECIMAL(3,2),
  status TEXT DEFAULT 'running' CHECK (status IN ('draft', 'running', 'completed', 'archived')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE ai_experiments IS 'A/B testing framework for comparing models, prompts, and configurations';

-- ============================================
-- SECTION 8: MULTI-AGENT SYSTEM
-- ============================================

-- 8.1 AI AGENTS (აგენტების რეესტრი)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Model preferences
  preferred_model TEXT,
  fallback_model TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  
  -- Prompt configuration
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  
  -- Capabilities
  supports_text BOOLEAN DEFAULT TRUE,
  supports_image BOOLEAN DEFAULT FALSE,
  supports_voice BOOLEAN DEFAULT FALSE,
  
  -- Performance
  avg_response_time_ms INTEGER,
  success_rate DECIMAL(5,2) DEFAULT 100.00,
  total_requests INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ai_agents IS 'Registry of AI agents (specialists) with their roles and capabilities';

-- 8.2 AI AGENT SPECIALIZATIONS (სპეციალიზაციები)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_agent_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  proficiency_level INTEGER DEFAULT 5 CHECK (proficiency_level BETWEEN 1 AND 5),
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, specialization)
);

COMMENT ON TABLE ai_agent_specializations IS 'What each agent specializes in';

-- 8.3 AI AGENT PIPELINES (თანამშრომლობა)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_agent_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  request_type TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_timeout_ms INTEGER DEFAULT 30000,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ai_agent_pipelines IS 'Multi-agent collaboration workflows';

-- 8.4 AI AGENT EXECUTIONS (შესრულების ჟურნალი)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES ai_agent_pipelines(id),
  agent_id UUID REFERENCES ai_agents(id),
  execution_order INTEGER NOT NULL,
  input_text TEXT,
  output_text TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ai_agent_executions IS 'Detailed log of each agent execution in a pipeline';

-- ============================================
-- SECTION 9: INDEXES (Performance Optimization)
-- ============================================

-- AI Providers
CREATE INDEX IF NOT EXISTS idx_ai_providers_type ON ai_providers(type);
CREATE INDEX IF NOT EXISTS idx_ai_providers_tier ON ai_providers(tier);
CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON ai_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_providers_circuit ON ai_providers(circuit_breaker_state);

-- AI API Keys
CREATE INDEX IF NOT EXISTS idx_ai_api_keys_provider ON ai_api_keys(provider_name);
CREATE INDEX IF NOT EXISTS idx_ai_api_keys_active ON ai_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_api_keys_priority ON ai_api_keys(priority);
CREATE INDEX IF NOT EXISTS idx_ai_api_keys_usage ON ai_api_keys(current_usage, daily_limit);

-- AI Discovered Models
CREATE INDEX IF NOT EXISTS idx_ai_discovered_models_provider ON ai_discovered_models(provider_name);
CREATE INDEX IF NOT EXISTS idx_ai_discovered_models_healthy ON ai_discovered_models(is_healthy);
CREATE INDEX IF NOT EXISTS idx_ai_discovered_models_checked ON ai_discovered_models(last_checked_at);

-- AI Health Checks
CREATE INDEX IF NOT EXISTS idx_ai_health_checks_provider ON ai_health_checks(provider_name, checked_at);
CREATE INDEX IF NOT EXISTS idx_ai_health_checks_type ON ai_health_checks(check_type);

-- AI Prompts
CREATE INDEX IF NOT EXISTS idx_ai_prompts_category ON ai_prompts(category);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_active ON ai_prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_name ON ai_prompts(name);

-- AI Request Types
CREATE INDEX IF NOT EXISTS idx_ai_request_types_name ON ai_request_types(name);
CREATE INDEX IF NOT EXISTS idx_ai_request_types_enabled ON ai_request_types(is_enabled);
CREATE INDEX IF NOT EXISTS idx_ai_request_types_complexity ON ai_request_types(complexity_level);

-- AI Usage
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage(provider, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_type ON ai_usage(request_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_success ON ai_usage(success);
CREATE INDEX IF NOT EXISTS idx_ai_usage_quality ON ai_usage(quality_score);

-- AI Cache
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_type ON ai_cache(request_type);

-- AI Daily Stats
CREATE INDEX IF NOT EXISTS idx_ai_daily_stats_date ON ai_daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_ai_daily_stats_provider ON ai_daily_stats(provider);
CREATE INDEX IF NOT EXISTS idx_ai_daily_stats_type ON ai_daily_stats(request_type);

-- Knowledge Base
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_language ON knowledge_base(language);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_usage ON knowledge_base(usage_count DESC);

-- AI Queue
CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON ai_queue(status, priority);
CREATE INDEX IF NOT EXISTS idx_ai_queue_user ON ai_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_queue_queued ON ai_queue(queued_at);

-- AI Agents
CREATE INDEX IF NOT EXISTS idx_ai_agents_role ON ai_agents(role);
CREATE INDEX IF NOT EXISTS idx_ai_agents_active ON ai_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_agents_priority ON ai_agents(priority);

-- AI Agent Specializations
CREATE INDEX IF NOT EXISTS idx_ai_agent_specs_agent ON ai_agent_specializations(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_specs_spec ON ai_agent_specializations(specialization);

-- AI Agent Pipelines
CREATE INDEX IF NOT EXISTS idx_ai_pipelines_type ON ai_agent_pipelines(request_type);
CREATE INDEX IF NOT EXISTS idx_ai_pipelines_active ON ai_agent_pipelines(is_active);

-- AI Agent Executions
CREATE INDEX IF NOT EXISTS idx_ai_executions_pipeline ON ai_agent_executions(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_ai_executions_agent ON ai_agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_executions_date ON ai_agent_executions(created_at);

-- ============================================
-- SECTION 10: FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update daily stats on usage insert
CREATE OR REPLACE FUNCTION update_ai_daily_stats_on_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_daily_stats (date, provider, request_type, total_requests, successful_requests, failed_requests, total_tokens, total_cost)
  VALUES (
    NEW.created_at::date,
    NEW.provider,
    NEW.request_type,
    1,
    CASE WHEN NEW.success THEN 1 ELSE 0 END,
    CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    NEW.total_tokens,
    NEW.cost
  )
  ON CONFLICT (date, provider, request_type)
  DO UPDATE SET
    total_requests = ai_daily_stats.total_requests + 1,
    successful_requests = ai_daily_stats.successful_requests + CASE WHEN NEW.success THEN 1 ELSE 0 END,
    failed_requests = ai_daily_stats.failed_requests + CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    total_tokens = ai_daily_stats.total_tokens + NEW.total_tokens,
    total_cost = ai_daily_stats.total_cost + NEW.cost,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_usage_insert_trigger
AFTER INSERT ON ai_usage
FOR EACH ROW
EXECUTE FUNCTION update_ai_daily_stats_on_usage();

-- Function: Update API key usage
CREATE OR REPLACE FUNCTION update_api_key_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.api_key_id IS NOT NULL AND NEW.success = TRUE THEN
    UPDATE ai_api_keys
    SET 
      current_usage = current_usage + 1,
      last_used_at = NOW()
    WHERE id = NEW.api_key_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_usage_update_key_trigger
AFTER INSERT ON ai_usage
FOR EACH ROW
EXECUTE FUNCTION update_api_key_usage();

-- Function: Update circuit breaker on failure
CREATE OR REPLACE FUNCTION update_circuit_breaker()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.success = FALSE THEN
    UPDATE ai_providers
    SET 
      consecutive_failures = consecutive_failures + 1,
      last_failure_at = NOW(),
      circuit_breaker_state = CASE 
        WHEN consecutive_failures + 1 >= failure_threshold THEN 'open'
        ELSE circuit_breaker_state
      END,
      opened_at = CASE 
        WHEN consecutive_failures + 1 >= failure_threshold THEN NOW()
        ELSE opened_at
      END
    WHERE name = NEW.provider;
  ELSE
    UPDATE ai_providers
    SET 
      consecutive_failures = 0,
      circuit_breaker_state = 'closed'
    WHERE name = NEW.provider;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_usage_circuit_breaker_trigger
AFTER INSERT ON ai_usage
FOR EACH ROW
EXECUTE FUNCTION update_circuit_breaker();

-- Function: Clear expired cache
CREATE OR REPLACE FUNCTION clear_expired_ai_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM ai_cache
    WHERE expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Reset daily API key usage
CREATE OR REPLACE FUNCTION reset_daily_api_key_usage()
RETURNS VOID AS $$
BEGIN
  UPDATE ai_api_keys
  SET 
    current_usage = 0,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Reset circuit breakers (call periodically)
CREATE OR REPLACE FUNCTION reset_circuit_breakers()
RETURNS VOID AS $$
BEGIN
  UPDATE ai_providers
  SET 
    circuit_breaker_state = 'half-open',
    consecutive_failures = 0
  WHERE 
    circuit_breaker_state = 'open'
    AND opened_at < NOW() - (recovery_timeout_seconds || ' seconds')::interval;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SECTION 11: VIEWS (Admin Dashboard)
-- ============================================

CREATE OR REPLACE VIEW v_ai_today_stats AS
SELECT 
  provider,
  request_type,
  COUNT(*) as total_requests,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed,
  SUM(total_tokens) as total_tokens,
  SUM(cost) as total_cost,
  AVG(response_time_ms) as avg_response_time_ms
FROM ai_usage
WHERE created_at >= CURRENT_DATE
GROUP BY provider, request_type;

CREATE OR REPLACE VIEW v_ai_monthly_stats AS
SELECT 
  provider,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_requests,
  SUM(total_tokens) as total_tokens,
  SUM(cost) as total_cost,
  AVG(response_time_ms) as avg_response_time_ms
FROM ai_usage
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY provider, DATE_TRUNC('month', created_at);

CREATE OR REPLACE VIEW v_api_key_usage AS
SELECT 
  k.id,
  k.provider_name,
  k.is_active,
  k.current_usage,
  k.daily_limit,
  k.priority,
  k.last_used_at,
  k.error_count,
  ROUND((k.current_usage::decimal / NULLIF(k.daily_limit, 0)) * 100, 2) as usage_percentage,
  k.daily_limit - k.current_usage as remaining_usage
FROM ai_api_keys k
WHERE k.is_active = TRUE;

CREATE OR REPLACE VIEW v_cache_performance AS
SELECT 
  request_type,
  COUNT(*) as total_cached,
  SUM(hit_count) as total_hits,
  AVG(hit_count) as avg_hits_per_entry,
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_entries,
  COUNT(CASE WHEN expires_at >= NOW() THEN 1 END) as active_entries
FROM ai_cache
GROUP BY request_type;

CREATE OR REPLACE VIEW v_provider_performance AS
SELECT 
  p.name as provider_name,
  p.tier,
  p.is_active,
  p.circuit_breaker_state,
  COUNT(u.id) as total_requests,
  SUM(CASE WHEN u.success THEN 1 ELSE 0 END) as successful_requests,
  SUM(CASE WHEN NOT u.success THEN 1 ELSE 0 END) as failed_requests,
  ROUND(AVG(u.response_time_ms)::numeric, 2) as avg_response_time_ms,
  SUM(u.total_tokens) as total_tokens,
  SUM(u.cost) as total_cost
FROM ai_providers p
LEFT JOIN ai_usage u ON p.name = u.provider AND u.created_at >= CURRENT_DATE
WHERE p.is_active = TRUE
GROUP BY p.name, p.tier, p.is_active, p.circuit_breaker_state;

CREATE OR REPLACE VIEW v_queue_status AS
SELECT 
  status,
  priority,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (NOW() - queued_at)) * 1000)::integer as avg_wait_ms
FROM ai_queue
WHERE status IN ('pending', 'processing')
GROUP BY status, priority;

CREATE OR REPLACE VIEW v_agent_performance AS
SELECT 
  a.name as agent_name,
  a.role,
  a.display_name,
  COUNT(e.id) as total_executions,
  SUM(CASE WHEN e.success THEN 1 ELSE 0 END) as successful,
  ROUND(AVG(e.response_time_ms)::numeric, 2) as avg_response_time_ms,
  ROUND(AVG(e.quality_score)::numeric, 2) as avg_quality_score
FROM ai_agents a
LEFT JOIN ai_agent_executions e ON a.id = e.agent_id AND e.created_at >= CURRENT_DATE
WHERE a.is_active = TRUE
GROUP BY a.name, a.role, a.display_name;

-- ============================================
-- SECTION 12: ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_discovered_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_request_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_executions ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage providers" ON ai_providers
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Admins can manage API keys" ON ai_api_keys
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Admins can manage discovered models" ON ai_discovered_models
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Admins can view health checks" ON ai_health_checks
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Everyone can read active prompts" ON ai_prompts
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage prompts" ON ai_prompts
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Everyone can read enabled request types" ON ai_request_types
  FOR SELECT USING (is_enabled = TRUE);

CREATE POLICY "Admins can manage request types" ON ai_request_types
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Users can view own usage" ON ai_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all usage" ON ai_usage
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "System can insert usage" ON ai_usage
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Everyone can read cache" ON ai_cache
  FOR SELECT USING (TRUE);

CREATE POLICY "System can manage cache" ON ai_cache
  FOR ALL USING (TRUE);

CREATE POLICY "Admins can view daily stats" ON ai_daily_stats
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Everyone can read knowledge base" ON knowledge_base
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage knowledge base" ON knowledge_base
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Users can view own queue" ON ai_queue
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage queue" ON ai_queue
  FOR ALL USING (TRUE);

CREATE POLICY "Admins can manage budgets" ON ai_budgets
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Admins can manage experiments" ON ai_experiments
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Everyone can read active agents" ON ai_agents
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage agents" ON ai_agents
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Everyone can read agent specializations" ON ai_agent_specializations
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage agent specializations" ON ai_agent_specializations
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Everyone can read active pipelines" ON ai_agent_pipelines
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage pipelines" ON ai_agent_pipelines
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "Admins can view executions" ON ai_agent_executions
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = TRUE));

CREATE POLICY "System can insert executions" ON ai_agent_executions
  FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- SECTION 13: SEED DATA
-- ============================================

-- Insert default providers
INSERT INTO ai_providers (name, type, tier, preferred_model, rpm_limit, daily_token_limit, cost_per_1m_tokens, priority) VALUES
('gemini', 'text', 'free', NULL, 15, 1000000, 0, 1),
('groq', 'text', 'free', NULL, 30, 14400, 0, 2),
('openai', 'text', 'paid', 'gpt-4o-mini', 100, 10000000, 0.15, 3),
('anthropic', 'text', 'paid', 'claude-3-haiku', 50, 5000000, 0.25, 4);

-- Insert default request types
INSERT INTO ai_request_types (name, description, allowed_providers, preferred_provider, cache_ttl_seconds, free_user_daily_limit, premium_user_daily_limit, complexity_level, simple_model, complex_model) VALUES
('daily_horoscope', 'Daily horoscope generation', '["gemini", "groq"]'::jsonb, 'gemini', 86400, 5, 100, 'simple', 'gemini-flash', 'gpt4o'),
('weekly_horoscope', 'Weekly horoscope forecast', '["gemini", "groq"]'::jsonb, 'gemini', 604800, 2, 50, 'medium', 'gemini-flash', 'gpt4o'),
('tarot_reading', 'Tarot card reading interpretation', '["groq", "gemini"]'::jsonb, 'groq', 3600, 3, 50, 'complex', 'groq-llama', 'gpt4o'),
('ai_chat', 'General AI conversation', '["gemini", "groq"]'::jsonb, 'gemini', 0, 10, 200, 'medium', 'gemini-flash', 'gpt4o-mini'),
('numerology', 'Numerology calculation', '["gemini", "groq"]'::jsonb, 'gemini', 86400, 3, 50, 'simple', 'gemini-flash', 'gpt4o'),
('compatibility', 'Relationship compatibility', '["gemini", "groq"]'::jsonb, 'gemini', 86400, 2, 30, 'complex', 'gemini-flash', 'gpt4o');

-- Insert default prompts
INSERT INTO ai_prompts (name, category, system_prompt, user_prompt_template, variables) VALUES
('daily_horoscope_general', 'horoscope', 
 'შენ ხარ პროფესიონალი ასტროლოგი 20 წლიანი გამოცდილებით. წერე მოკლე, ზუსტი და შთამაგონებელი ჰოროსკოპები ქართულ ენაზე.',
 'მომეცი დღის ჰოროსკოპი {{sign}} ნიშნისთვის {{date}} თარიღზე. მოკლედ, 100 სიტყვაში.',
 '["sign", "date"]'::jsonb),
('tarot_reading_interpretation', 'tarot',
 'შენ ხარ გამოცდილი ტაროს მკითხველი. ინტერპრეტაცია გააკეთე ღრმად, მაგრამ გასაგებად.',
 'გამიკეთე ტაროს კითხვა. ბარათები: {{cards}}. კითხვა: {{question}}.',
 '["cards", "question"]'::jsonb);

-- Insert default agents
INSERT INTO ai_agents (name, role, display_name, description, preferred_model, system_prompt, temperature) VALUES
('orchestrator', 'orchestrator', 'მთავარი ორკესტრატორი', 'მართავს ყველა აგენტს', 'gemini-flash', 'შენ ხარ AI სისტემის ორკესტრატორი. გადაწყვიტე რომელი სპეციალისტი გამოიძახო.', 0.3),
('astrologer', 'astrologer', 'პროფესიონალი ასტროლოგი', 'სპეციალიზირებული ჰოროსკოპებში', 'gemini-flash', 'შენ ხარ პროფესიონალი ასტროლოგი 20 წლიანი გამოცდილებით.', 0.7),
('tarot_reader', 'tarot_reader', 'გამოცდილი ტაროს მკითხველი', 'ტაროს ინტერპრეტაცია', 'groq-llama', 'შენ ხარ გამოცდილი ტაროს მკითხველი.', 0.8),
('numerologist', 'numerologist', 'ნუმეროლოგი', 'რიცხვების ანალიზი', 'gemini-flash', 'შენ ხარ ნუმეროლოგი.', 0.6),
('mentor', 'mentor', 'პირადი მენტორი', 'მოტივაცია და რჩევები', 'gpt4o-mini', 'შენ ხარ თბილი და ემპათიური მენტორი.', 0.7),
('researcher', 'researcher', 'მკვლევარი', 'ღრმა ანალიზი', 'gpt4o', 'შენ ხარ მკვლევარი. იპოვე ზუსტი ინფორმაცია.', 0.5),
('writer', 'writer', 'პროფესიონალი მწერალი', 'ტექსტის გალამაზება', 'gemini-flash', 'შენ ხარ პროფესიონალი მწერალი.', 0.7),
('conversationalist', 'conversationalist', 'მეგობრული ჩატერი', 'ზოგადი ჩატი', 'gemini-flash', 'შენ ხარ მეგობრული ჩატერი.', 0.7),
('quality_controller', 'quality_controller', 'ხარისხის კონტროლერი', 'პასუხის შემოწმება', 'gemini-flash', 'შენ ხარ ხარისხის კონტროლერი.', 0.3);

-- Insert agent specializations
INSERT INTO ai_agent_specializations (agent_id, specialization, proficiency_level, keywords) VALUES
((SELECT id FROM ai_agents WHERE name = 'astrologer'), 'horoscope', 5, ARRAY['horoscope', 'zodiac', 'sign', 'planet']),
((SELECT id FROM ai_agents WHERE name = 'tarot_reader'), 'tarot', 5, ARRAY['tarot', 'card', 'spread']),
((SELECT id FROM ai_agents WHERE name = 'numerologist'), 'numerology', 5, ARRAY['numerology', 'number']),
((SELECT id FROM ai_agents WHERE name = 'mentor'), 'guidance', 5, ARRAY['advice', 'help', 'support']),
((SELECT id FROM ai_agents WHERE name = 'writer'), 'writing', 5, ARRAY['write', 'edit', 'refine']),
((SELECT id FROM ai_agents WHERE name = 'conversationalist'), 'chat', 5, ARRAY['chat', 'talk', 'question']);

-- Insert pipelines
INSERT INTO ai_agent_pipelines (name, description, request_type, steps) VALUES
('horoscope_generation', 'ჰოროსკოპის გენერაცია', 'daily_horoscope',
 '[{"agent": "astrologer", "action": "generate", "timeout_ms": 5000}, {"agent": "writer", "action": "refine", "timeout_ms": 3000}, {"agent": "quality_controller", "action": "validate", "timeout_ms": 2000}]'::jsonb),
('tarot_reading', 'ტაროს კითხვა', 'tarot_reading',
 '[{"agent": "tarot_reader", "action": "interpret", "timeout_ms": 8000}, {"agent": "mentor", "action": "add_guidance", "timeout_ms": 3000}]'::jsonb),
('general_chat', 'ზოგადი ჩატი', 'ai_chat',
 '[{"agent": "conversationalist", "action": "respond", "timeout_ms": 3000}]'::jsonb);

-- Insert sample knowledge base
INSERT INTO knowledge_base (category, title, content) VALUES
('zodiac_signs', 'Aries', 'ვერძი (21 მარტი - 19 აპრილი) - ცეცხლის ნიშანი. მმართველი პლანეტა: მარსი. მახასიათებლები: ენერგიული, ლიდერი, იმპულსური.'),
('zodiac_signs', 'Taurus', 'კურო (20 აპრილი - 20 მაისი) - მიწის ნიშანი. მმართველი პლანეტა: ვენერა. მახასიათებლები: სტაბილური, პრაქტიკული, ერთგული.'),
('tarot_cards', 'The Fool', 'შუტი (0) - ახალი დასაწყისი, თავგადასავალი, სიმ innocence. მიუთითებს ახალ გზაზე დაწყებას.');

-- ============================================
-- END OF COMPLETE AI INFRASTRUCTURE
-- ============================================