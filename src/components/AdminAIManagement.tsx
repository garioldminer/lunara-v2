import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Check, 
  X,
  Zap,
  Database,
  Key,
  MessageSquare,
  BarChart3,
  TestTube,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  getAllProviders,
  getAllApiKeys,
  addApiKey,
  deleteApiKey,
  toggleApiKey,
  testApiKey,
  getAllPrompts,
  addPrompt,
  deletePrompt,
  getTodayStats,
  getApiKeyUsage,
  toggleProvider,
  resetCircuitBreaker,
  type AIProvider,
  type AIApiKey,
  type AIPrompt,
  type AIUsageStats
} from '../lib/ai/adminService';
import './AdminAIManagement.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

type Tab = 'dashboard' | 'keys' | 'providers' | 'prompts' | 'stats';

export default function AdminAIManagement({ onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [apiKeys, setApiKeys] = useState<AIApiKey[]>([]);
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [todayStats, setTodayStats] = useState<AIUsageStats[]>([]);
  const [apiKeyUsage, setApiKeyUsage] = useState<any[]>([]);
  
  // Add states
  const [showAddKey, setShowAddKey] = useState(false);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  
  // Form states
  const [newKey, setNewKey] = useState({
    provider_name: 'gemini',
    api_key: '',
    daily_limit: 1000,
    priority: 1
  });
  
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    category: 'horoscope',
    system_prompt: '',
    user_prompt_template: '',
    variables: ''
  });
  
  // Test states
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [key: string]: { success: boolean; message: string } }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [providersData, keysData, promptsData, statsData, usageData] = await Promise.all([
      getAllProviders(),
      getAllApiKeys(),
      getAllPrompts(),
      getTodayStats(),
      getApiKeyUsage()
    ]);
    
    setProviders(providersData);
    setApiKeys(keysData);
    setPrompts(promptsData);
    setTodayStats(statsData);
    setApiKeyUsage(usageData);
    setLoading(false);
  };

  // ============================================
  // API KEYS HANDLERS
  // ============================================
  
  const handleAddApiKey = async () => {
    if (!newKey.api_key) return;
    
    const success = await addApiKey(
      newKey.provider_name,
      newKey.api_key,
      newKey.daily_limit,
      newKey.priority
    );
    
    if (success) {
      setShowAddKey(false);
      setNewKey({ provider_name: 'gemini', api_key: '', daily_limit: 1000, priority: 1 });
      await loadData();
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    
    const success = await deleteApiKey(keyId);
    if (success) {
      await loadData();
    }
  };

  const handleToggleApiKey = async (keyId: string, isActive: boolean) => {
    const success = await toggleApiKey(keyId, !isActive);
    if (success) {
      await loadData();
    }
  };

  const handleTestApiKey = async (keyId: string) => {
    setTestingKey(keyId);
    const result = await testApiKey(keyId);
    setTestResult(prev => ({ ...prev, [keyId]: result }));
    setTestingKey(null);
  };

  // ============================================
  // PROMPTS HANDLERS
  // ============================================
  
  const handleAddPrompt = async () => {
    if (!newPrompt.name || !newPrompt.system_prompt) return;
    
    const success = await addPrompt({
      name: newPrompt.name,
      category: newPrompt.category,
      system_prompt: newPrompt.system_prompt,
      user_prompt_template: newPrompt.user_prompt_template,
      variables: newPrompt.variables.split(',').map(v => v.trim()).filter(v => v)
    });
    
    if (success) {
      setShowAddPrompt(false);
      setNewPrompt({
        name: '',
        category: 'horoscope',
        system_prompt: '',
        user_prompt_template: '',
        variables: ''
      });
      await loadData();
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    
    const success = await deletePrompt(promptId);
    if (success) {
      await loadData();
    }
  };

  // ============================================
  // PROVIDERS HANDLERS
  // ============================================
  
  const handleToggleProvider = async (providerId: string, isActive: boolean) => {
    const success = await toggleProvider(providerId, !isActive);
    if (success) {
      await loadData();
    }
  };

  const handleResetCircuitBreaker = async (providerId: string) => {
    const success = await resetCircuitBreaker(providerId);
    if (success) {
      await loadData();
    }
  };

  // ============================================
  // RENDER
  // ============================================
  
  if (loading) {
    return (
      <div className="ai-admin-screen">
        <div className="ai-admin-loading">
          <RefreshCw size={32} className="spin" />
          <p>Loading AI Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-admin-screen">
      {/* Header */}
      <div className="ai-admin-header">
        <button className="ai-admin-back-btn" onClick={() => onNavigate?.('admin')}>
          <ArrowLeft size={20} />
        </button>
        <div className="ai-admin-header-center">
          <Zap size={24} />
          <h1>AI Management</h1>
        </div>
        <button className="ai-admin-refresh-btn" onClick={loadData}>
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="ai-admin-tabs">
        <button
          className={`ai-admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={16} />
          <span>Dashboard</span>
        </button>
        <button
          className={`ai-admin-tab ${activeTab === 'keys' ? 'active' : ''}`}
          onClick={() => setActiveTab('keys')}
        >
          <Key size={16} />
          <span>API Keys</span>
        </button>
        <button
          className={`ai-admin-tab ${activeTab === 'providers' ? 'active' : ''}`}
          onClick={() => setActiveTab('providers')}
        >
          <Database size={16} />
          <span>Providers</span>
        </button>
        <button
          className={`ai-admin-tab ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          <MessageSquare size={16} />
          <span>Prompts</span>
        </button>
        <button
          className={`ai-admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart3 size={16} />
          <span>Stats</span>
        </button>
      </div>

      {/* Content */}
      <div className="ai-admin-content">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="ai-dashboard">
            <h2>📊 Today's Overview</h2>
            
            <div className="dashboard-stats">
              <div className="dashboard-stat-card">
                <div className="stat-icon blue">
                  <Zap size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-number">
                    {todayStats.reduce((sum, s) => sum + s.total_requests, 0)}
                  </span>
                  <span className="stat-label">Total Requests</span>
                </div>
              </div>
              
              <div className="dashboard-stat-card">
                <div className="stat-icon green">
                  <CheckCircle2 size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-number">
                    {todayStats.reduce((sum, s) => sum + s.successful_requests, 0)}
                  </span>
                  <span className="stat-label">Successful</span>
                </div>
              </div>
              
              <div className="dashboard-stat-card">
                <div className="stat-icon red">
                  <XCircle size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-number">
                    {todayStats.reduce((sum, s) => sum + s.failed_requests, 0)}
                  </span>
                  <span className="stat-label">Failed</span>
                </div>
              </div>
              
              <div className="dashboard-stat-card">
                <div className="stat-icon gold">
                  <Database size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-number">
                    {apiKeys.length}
                  </span>
                  <span className="stat-label">API Keys</span>
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <h3>💰 Cost Today</h3>
              <div className="cost-display">
                ${todayStats.reduce((sum, s) => sum + Number(s.total_cost), 0).toFixed(4)}
              </div>
            </div>

            <div className="dashboard-section">
              <h3>⚡ Provider Status</h3>
              <div className="provider-status-list">
                {providers.map(provider => (
                  <div key={provider.id} className="provider-status-item">
                    <div className="provider-status-info">
                      <span className="provider-name">{provider.name}</span>
                      <span className={`provider-tier ${provider.tier}`}>
                        {provider.tier}
                      </span>
                    </div>
                    <div className="provider-status-indicators">
                      <span className={`status-dot ${provider.is_active ? 'active' : 'inactive'}`} />
                      <span className={`circuit-state ${provider.circuit_breaker_state}`}>
                        {provider.circuit_breaker_state}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* API KEYS TAB */}
        {activeTab === 'keys' && (
          <div className="ai-keys">
            <div className="keys-header">
              <h2>🔑 API Keys Management</h2>
              <button className="add-btn" onClick={() => setShowAddKey(true)}>
                <Plus size={16} />
                <span>Add Key</span>
              </button>
            </div>

            <div className="keys-list">
              {apiKeys.map((key) => (
                <motion.div
                  key={key.id}
                  className={`key-card ${key.is_active ? 'active' : 'inactive'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="key-header">
                    <div className="key-provider">
                      <span className="provider-badge">{key.provider_name}</span>
                      <span className={`tier-badge ${(key as any).ai_providers?.tier || 'unknown'}`}>
                        {(key as any).ai_providers?.tier || 'unknown'}
                      </span>
                    </div>
                    <div className="key-actions">
                      <button
                        className="icon-btn test"
                        onClick={() => handleTestApiKey(key.id)}
                        disabled={testingKey === key.id}
                        title="Test"
                      >
                        {testingKey === key.id ? (
                          <RefreshCw size={14} className="spin" />
                        ) : (
                          <TestTube size={14} />
                        )}
                      </button>
                      <button
                        className="icon-btn toggle"
                        onClick={() => handleToggleApiKey(key.id, key.is_active)}
                        title={key.is_active ? 'Disable' : 'Enable'}
                      >
                        {key.is_active ? <Check size={14} /> : <X size={14} />}
                      </button>
                      <button
                        className="icon-btn delete"
                        onClick={() => handleDeleteApiKey(key.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="key-details">
                    <div className="key-value">
                      <span className="key-label">Key:</span>
                      <span className="key-text">
                        {key.api_key.substring(0, 10)}...{key.api_key.substring(key.api_key.length - 4)}
                      </span>
                    </div>
                    <div className="key-usage">
                      <span className="key-label">Usage:</span>
                      <span className="key-text">
                        {key.current_usage} / {key.daily_limit}
                      </span>
                      <div className="usage-bar">
                        <div
                          className="usage-fill"
                          style={{
                            width: `${(key.current_usage / key.daily_limit) * 100}%`,
                            backgroundColor: key.current_usage / key.daily_limit > 0.8 ? '#ef4444' : '#10b981'
                          }}
                        />
                      </div>
                    </div>
                    <div className="key-meta">
                      <span>Priority: {key.priority}</span>
                      <span>Errors: {key.error_count}</span>
                    </div>
                  </div>

                  {testResult[key.id] && (
                    <div className={`test-result ${testResult[key.id].success ? 'success' : 'error'}`}>
                      {testResult[key.id].success ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                      <span>{testResult[key.id].message}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Add Key Modal */}
            <AnimatePresence>
              {showAddKey && (
                <motion.div
                  className="modal-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddKey(false)}
                >
                  <motion.div
                    className="modal"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3>Add New API Key</h3>
                    
                    <div className="modal-field">
                      <label>Provider:</label>
                      <select
                        value={newKey.provider_name}
                        onChange={(e) => setNewKey({ ...newKey, provider_name: e.target.value })}
                      >
                        {providers.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.tier})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="modal-field">
                      <label>API Key:</label>
                      <input
                        type="text"
                        value={newKey.api_key}
                        onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
                        placeholder="Enter API key..."
                      />
                    </div>

                    <div className="modal-field">
                      <label>Daily Limit:</label>
                      <input
                        type="number"
                        value={newKey.daily_limit}
                        onChange={(e) => setNewKey({ ...newKey, daily_limit: parseInt(e.target.value) || 1000 })}
                        min="1"
                      />
                    </div>

                    <div className="modal-field">
                      <label>Priority:</label>
                      <input
                        type="number"
                        value={newKey.priority}
                        onChange={(e) => setNewKey({ ...newKey, priority: parseInt(e.target.value) || 1 })}
                        min="1"
                      />
                    </div>

                    <div className="modal-buttons">
                      <button className="cancel-btn" onClick={() => setShowAddKey(false)}>
                        Cancel
                      </button>
                      <button className="confirm-btn" onClick={handleAddApiKey}>
                        Add Key
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* PROVIDERS TAB */}
        {activeTab === 'providers' && (
          <div className="ai-providers">
            <h2>🗄️ Providers Management</h2>
            
            <div className="providers-list">
              {providers.map((provider) => (
                <motion.div
                  key={provider.id}
                  className={`provider-card ${provider.is_active ? 'active' : 'inactive'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="provider-header">
                    <div className="provider-info">
                      <h3>{provider.name}</h3>
                      <div className="provider-badges">
                        <span className={`tier-badge ${provider.tier}`}>{provider.tier}</span>
                        <span className="type-badge">{provider.type}</span>
                      </div>
                    </div>
                    <div className="provider-actions">
                      <button
                        className="icon-btn toggle"
                        onClick={() => handleToggleProvider(provider.id, provider.is_active)}
                        title={provider.is_active ? 'Disable' : 'Enable'}
                      >
                        {provider.is_active ? <Check size={14} /> : <X size={14} />}
                      </button>
                      {provider.circuit_breaker_state !== 'closed' && (
                        <button
                          className="icon-btn reset"
                          onClick={() => handleResetCircuitBreaker(provider.id)}
                          title="Reset Circuit Breaker"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="provider-details">
                    <div className="detail-row">
                      <span className="label">RPM Limit:</span>
                      <span className="value">{provider.rpm_limit}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Daily Token Limit:</span>
                      <span className="value">{provider.daily_token_limit.toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Cost per 1M tokens:</span>
                      <span className="value">${provider.cost_per_1m_tokens}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Priority:</span>
                      <span className="value">{provider.priority}</span>
                    </div>
                  </div>

                  <div className="provider-status">
                    <div className={`circuit-indicator ${provider.circuit_breaker_state}`}>
                      <Shield size={14} />
                      <span>Circuit: {provider.circuit_breaker_state}</span>
                    </div>
                    {provider.consecutive_failures > 0 && (
                      <div className="failures-indicator">
                        <AlertCircle size={14} />
                        <span>{provider.consecutive_failures} failures</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* PROMPTS TAB */}
        {activeTab === 'prompts' && (
          <div className="ai-prompts">
            <div className="prompts-header">
              <h2>💬 Prompts Library</h2>
              <button className="add-btn" onClick={() => setShowAddPrompt(true)}>
                <Plus size={16} />
                <span>Add Prompt</span>
              </button>
            </div>

            <div className="prompts-list">
              {prompts.map((prompt) => (
                <motion.div
                  key={prompt.id}
                  className={`prompt-card ${prompt.is_active ? 'active' : 'inactive'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="prompt-header">
                    <div className="prompt-info">
                      <h3>{prompt.name}</h3>
                      <span className="category-badge">{prompt.category}</span>
                    </div>
                    <div className="prompt-actions">
                      <button
                        className="icon-btn delete"
                        onClick={() => handleDeletePrompt(prompt.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="prompt-content">
                    <div className="prompt-section">
                      <span className="section-label">System Prompt:</span>
                      <p className="section-text">{prompt.system_prompt}</p>
                    </div>
                    <div className="prompt-section">
                      <span className="section-label">User Template:</span>
                      <p className="section-text">{prompt.user_prompt_template}</p>
                    </div>
                    {prompt.variables && prompt.variables.length > 0 && (
                      <div className="prompt-variables">
                        <span className="section-label">Variables:</span>
                        <div className="variables-list">
                          {prompt.variables.map((v, i) => (
                            <span key={i} className="variable-tag">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add Prompt Modal */}
            <AnimatePresence>
              {showAddPrompt && (
                <motion.div
                  className="modal-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddPrompt(false)}
                >
                  <motion.div
                    className="modal large"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3>Add New Prompt</h3>
                    
                    <div className="modal-field">
                      <label>Name:</label>
                      <input
                        type="text"
                        value={newPrompt.name}
                        onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                        placeholder="e.g., daily_horoscope_general"
                      />
                    </div>

                    <div className="modal-field">
                      <label>Category:</label>
                      <select
                        value={newPrompt.category}
                        onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                      >
                        <option value="horoscope">Horoscope</option>
                        <option value="tarot">Tarot</option>
                        <option value="numerology">Numerology</option>
                        <option value="compatibility">Compatibility</option>
                        <option value="chat">Chat</option>
                        <option value="general">General</option>
                      </select>
                    </div>

                    <div className="modal-field">
                      <label>System Prompt:</label>
                      <textarea
                        value={newPrompt.system_prompt}
                        onChange={(e) => setNewPrompt({ ...newPrompt, system_prompt: e.target.value })}
                        placeholder="You are a professional astrologer..."
                        rows={4}
                      />
                    </div>

                    <div className="modal-field">
                      <label>User Prompt Template:</label>
                      <textarea
                        value={newPrompt.user_prompt_template}
                        onChange={(e) => setNewPrompt({ ...newPrompt, user_prompt_template: e.target.value })}
                        placeholder="Generate horoscope for {{sign}} on {{date}}..."
                        rows={3}
                      />
                    </div>

                    <div className="modal-field">
                      <label>Variables (comma-separated):</label>
                      <input
                        type="text"
                        value={newPrompt.variables}
                        onChange={(e) => setNewPrompt({ ...newPrompt, variables: e.target.value })}
                        placeholder="sign, date, time"
                      />
                    </div>

                    <div className="modal-buttons">
                      <button className="cancel-btn" onClick={() => setShowAddPrompt(false)}>
                        Cancel
                      </button>
                      <button className="confirm-btn" onClick={handleAddPrompt}>
                        Add Prompt
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="ai-stats">
            <h2>📈 Usage Statistics</h2>
            
            <div className="stats-section">
              <h3>Today by Provider</h3>
              <div className="stats-table">
                <div className="stats-table-header">
                  <span>Provider</span>
                  <span>Requests</span>
                  <span>Success</span>
                  <span>Failed</span>
                  <span>Tokens</span>
                  <span>Cost</span>
                </div>
                {todayStats.map((stat, i) => (
                  <div key={i} className="stats-table-row">
                    <span className="provider-name">{stat.provider}</span>
                    <span>{stat.total_requests}</span>
                    <span className="success">{stat.successful_requests}</span>
                    <span className="failed">{stat.failed_requests}</span>
                    <span>{stat.total_tokens.toLocaleString()}</span>
                    <span>${Number(stat.total_cost).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-section">
              <h3>API Key Usage</h3>
              <div className="stats-table">
                <div className="stats-table-header">
                  <span>Provider</span>
                  <span>Usage</span>
                  <span>Limit</span>
                  <span>Progress</span>
                  <span>Remaining</span>
                </div>
                {apiKeyUsage.map((usage, i) => (
                  <div key={i} className="stats-table-row">
                    <span className="provider-name">{usage.provider_name}</span>
                    <span>{usage.current_usage}</span>
                    <span>{usage.daily_limit}</span>
                    <span>
                      <div className="mini-progress-bar">
                        <div
                          className="mini-progress-fill"
                          style={{ width: `${usage.usage_percentage}%` }}
                        />
                      </div>
                      <span className="percentage">{usage.usage_percentage}%</span>
                    </span>
                    <span>{usage.remaining_usage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}