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
  XCircle,
  Edit2,
  Bug,
  Info,
  Trophy // 🆕 დამატებულია Quests ტაბისთვის
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { isAdmin } from '../lib/adminService';
import { supabase } from '../lib/supabase'; // 🆕 დამატებულია ბაზასთან პირდაპირი მუშაობისთვის
import {
  getAllProviders,
  getAllApiKeys,
  addApiKey,
  deleteApiKey,
  toggleApiKey,
  testApiKey,
  getAllPrompts,
  addPrompt,
  updatePrompt,
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

type Tab = 'dashboard' | 'keys' | 'providers' | 'prompts' | 'stats' | 'quests'; // 🆕 დამატებულია 'quests'

interface DebugLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warn' | 'data';
  source: string;
  message: string;
  data?: any;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  action_type: string;
  target_count: number;
  reward_xp: number;
  reward_coins: number;
  quest_type: 'daily' | 'weekly' | 'milestone';
  is_active: boolean;
}

export default function AdminAIManagement({ onNavigate }: Props) {
  const { user } = useUser();
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [apiKeys, setApiKeys] = useState<AIApiKey[]>([]);
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [todayStats, setTodayStats] = useState<AIUsageStats[]>([]);
  const [apiKeyUsage, setApiKeyUsage] = useState<any[]>([]);
  
  // 🆕 Quests State
  const [quests, setQuests] = useState<Quest[]>([]);
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [editingQuest, setEditingQuest] = useState<string | null>(null);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    action_type: 'draw_daily_card',
    target_count: 1,
    reward_xp: 10,
    reward_coins: 5,
    quest_type: 'daily' as 'daily' | 'weekly' | 'milestone',
    is_active: true
  });
  
  const [showAddKey, setShowAddKey] = useState(false);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  
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
  
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [key: string]: { success: boolean; message: string } }>({});

  // ✅ Admin check
  useEffect(() => {
    if (user) {
      isAdmin(user.id).then(admin => {
        setIsUserAdmin(admin);
      });
    } else {
      setIsUserAdmin(false);
    }
  }, [user]);

  // ✅ SAFE NUMBER HELPER - NaN-ის თავიდან ასაცილებლად
  const safeNum = (value: any): number => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };

  // ✅ COMPUTED STATS - ერთხელ გამოითვლება
  const totalRequests = todayStats.length > 0 
    ? todayStats.reduce((sum, s) => sum + safeNum(s.total_requests), 0)
    : 0;
  
  const successfulRequests = todayStats.length > 0 
    ? todayStats.reduce((sum, s) => sum + safeNum(s.successful_requests), 0)
    : 0;
  
  const failedRequests = todayStats.length > 0 
    ? todayStats.reduce((sum, s) => sum + safeNum(s.failed_requests), 0)
    : 0;
  
  const totalCost = todayStats.length > 0 
    ? todayStats.reduce((sum, s) => sum + safeNum(s.total_cost), 0)
    : 0;

  const addDebugLog = (type: DebugLog['type'], source: string, message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      source,
      message,
      data
    };
    setDebugLogs(prev => [log, ...prev].slice(0, 100));
    console.log(`[${type.toUpperCase()}] [${source}] ${message}`, data || '');
  };

  useEffect(() => {
    addDebugLog('info', 'INIT', 'AI Management component mounted');
    addDebugLog('info', 'INIT', `Initial tab: ${activeTab}`);
    loadData();
  }, []);

  const loadData = async () => {
    addDebugLog('info', 'LOAD', 'Starting data load...');
    setLoading(true);
    
    try {
      addDebugLog('info', 'LOAD', 'Fetching all data in parallel...');
      
      const [providersData, keysData, promptsData, statsData, usageData, questsData] = await Promise.all([
        getAllProviders().catch(err => {
          addDebugLog('error', 'LOAD', 'Failed to fetch providers', err.message);
          return [];
        }),
        getAllApiKeys().catch(err => {
          addDebugLog('error', 'LOAD', 'Failed to fetch API keys', err.message);
          return [];
        }),
        getAllPrompts().catch(err => {
          addDebugLog('error', 'LOAD', 'Failed to fetch prompts', err.message);
          return [];
        }),
        getTodayStats().catch(err => {
          addDebugLog('error', 'LOAD', 'Failed to fetch today stats', err.message);
          return [];
        }),
        getApiKeyUsage().catch(err => {
          addDebugLog('error', 'LOAD', 'Failed to fetch API key usage', err.message);
          return [];
        }),
        supabase.from('quest_definitions').select('*').order('quest_type', { ascending: true }).order('title', { ascending: true }).then(res => {
          if (res.error) {
            addDebugLog('error', 'LOAD', 'Failed to fetch quests', res.error.message);
            return [];
          }
          return res.data || [];
        })
      ]);

      setProviders(providersData);
      setApiKeys(keysData);
      setPrompts(promptsData);
      setTodayStats(statsData);
      setApiKeyUsage(usageData);
      setQuests(questsData); // 🆕

      addDebugLog('data', 'PROVIDERS', `Loaded ${providersData.length} providers`, providersData);
      addDebugLog('data', 'API_KEYS', `Loaded ${keysData.length} API keys`, keysData);
      addDebugLog('data', 'PROMPTS', `Loaded ${promptsData.length} prompts`, promptsData);
      addDebugLog('data', 'STATS', `Loaded ${statsData.length} stats entries`, statsData);
      addDebugLog('data', 'USAGE', `Loaded ${usageData.length} usage entries`, usageData);
      addDebugLog('data', 'QUESTS', `Loaded ${questsData.length} quests`, questsData); // 🆕

      if (providersData.length === 0) {
        addDebugLog('warn', 'PROVIDERS', '⚠️ No providers found!');
      }

      if (keysData.length === 0) {
        addDebugLog('warn', 'API_KEYS', '⚠️ No API keys found.');
      }

      addDebugLog('success', 'LOAD', '✅ All data loaded successfully');
    } catch (error) {
      addDebugLog('error', 'LOAD', '❌ Critical error during data load', (error as Error).message);
    }
    
    setLoading(false);
  };

  // ============================================
  // 🆕 QUESTS HANDLERS
  // ============================================
  
  const handleAddQuest = async () => {
    addDebugLog('info', 'ADD_QUEST', 'Attempting to add quest', { title: newQuest.title, action_type: newQuest.action_type });
    
    if (!newQuest.title || !newQuest.action_type) {
      addDebugLog('warn', 'ADD_QUEST', '❌ Title or action type is empty!');
      return;
    }
    
    try {
      const { data, error } = await supabase.from('quest_definitions').insert([newQuest]).select().single();
      
      if (error) {
        addDebugLog('error', 'ADD_QUEST', `❌ Failed: ${error.message}`);
      } else {
        addDebugLog('success', 'ADD_QUEST', '✅ Quest added successfully', data);
        setShowAddQuest(false);
        setNewQuest({ title: '', description: '', action_type: 'draw_daily_card', target_count: 1, reward_xp: 10, reward_coins: 5, quest_type: 'daily', is_active: true });
        await loadData();
      }
    } catch (error) {
      addDebugLog('error', 'ADD_QUEST', '❌ Exception while adding quest', (error as Error).message);
    }
  };

  const handleUpdateQuest = async (questId: string) => {
    addDebugLog('info', 'EDIT_QUEST', `Opening edit mode for quest: ${questId}`);
    
    const quest = quests.find(q => q.id === questId);
    if (!quest) {
      addDebugLog('error', 'EDIT_QUEST', '❌ Quest not found!');
      return;
    }
    
    setNewQuest({ ...quest });
    setEditingQuest(questId);
    setShowAddQuest(true);
  };

  const handleSaveEditQuest = async () => {
    addDebugLog('info', 'SAVE_EDIT_QUEST', `Saving edit for quest: ${editingQuest}`);
    
    if (!editingQuest || !newQuest.title || !newQuest.action_type) {
      addDebugLog('warn', 'SAVE_EDIT_QUEST', '❌ Missing required fields!');
      return;
    }
    
    try {
      const { data, error } = await supabase.from('quest_definitions').update({
        title: newQuest.title,
        description: newQuest.description,
        action_type: newQuest.action_type,
        target_count: newQuest.target_count,
        reward_xp: newQuest.reward_xp,
        reward_coins: newQuest.reward_coins,
        quest_type: newQuest.quest_type,
        is_active: newQuest.is_active
      }).eq('id', editingQuest).select().single();
      
      if (error) {
        addDebugLog('error', 'SAVE_EDIT_QUEST', `❌ Failed: ${error.message}`);
      } else {
        addDebugLog('success', 'SAVE_EDIT_QUEST', '✅ Quest updated successfully', data);
        setShowAddQuest(false);
        setEditingQuest(null);
        setNewQuest({ title: '', description: '', action_type: 'draw_daily_card', target_count: 1, reward_xp: 10, reward_coins: 5, quest_type: 'daily', is_active: true });
        await loadData();
      }
    } catch (error) {
      addDebugLog('error', 'SAVE_EDIT_QUEST', '❌ Exception while updating quest', (error as Error).message);
    }
  };

  const handleToggleQuest = async (questId: string, isActive: boolean) => {
    addDebugLog('info', 'TOGGLE_QUEST', `Toggling quest ${questId} to ${!isActive}`);
    
    try {
      const { error } = await supabase.from('quest_definitions').update({ is_active: !isActive }).eq('id', questId);
      if (error) {
        addDebugLog('error', 'TOGGLE_QUEST', `❌ Failed: ${error.message}`);
      } else {
        addDebugLog('success', 'TOGGLE_QUEST', '✅ Quest toggled successfully');
        await loadData();
      }
    } catch (error) {
      addDebugLog('error', 'TOGGLE_QUEST', '❌ Exception while toggling quest', (error as Error).message);
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    addDebugLog('info', 'DELETE_QUEST', `Attempting to delete quest: ${questId}`);
    
    if (!confirm('Are you sure you want to delete this quest?')) {
      addDebugLog('info', 'DELETE_QUEST', 'User cancelled deletion');
      return;
    }
    
    try {
      const { error } = await supabase.from('quest_definitions').delete().eq('id', questId);
      if (error) {
        addDebugLog('error', 'DELETE_QUEST', `❌ Failed: ${error.message}`);
      } else {
        addDebugLog('success', 'DELETE_QUEST', '✅ Quest deleted successfully');
        await loadData();
      }
    } catch (error) {
      addDebugLog('error', 'DELETE_QUEST', '❌ Exception while deleting quest', (error as Error).message);
    }
  };

  // ============================================
  // API KEYS HANDLERS
  // ============================================
  
  const handleAddApiKey = async () => {
    addDebugLog('info', 'ADD_KEY', 'Attempting to add API key', { 
      provider: newKey.provider_name, 
      limit: newKey.daily_limit,
      keyPreview: newKey.api_key ? newKey.api_key.substring(0, 10) + '...' : 'EMPTY'
    });
    
    if (!newKey.api_key) {
      addDebugLog('warn', 'ADD_KEY', '❌ API key is empty!');
      return;
    }
    
    try {
      const result = await addApiKey(
        newKey.provider_name,
        newKey.api_key,
        newKey.daily_limit,
        newKey.priority
      );
      
      if (result.success) {
        addDebugLog('success', 'ADD_KEY', '✅ API key added successfully!', result.data);
        setShowAddKey(false);
        setNewKey({ provider_name: 'gemini', api_key: '', daily_limit: 1000, priority: 1 });
        await loadData();
      } else {
        addDebugLog('error', 'ADD_KEY', `❌ Failed: ${result.error}`, result.data);
      }
    } catch (error) {
      addDebugLog('error', 'ADD_KEY', '❌ Exception while adding API key', (error as Error).message);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    addDebugLog('info', 'DELETE_KEY', `Attempting to delete key: ${keyId}`);
    
    if (!confirm('Are you sure you want to delete this API key?')) {
      addDebugLog('info', 'DELETE_KEY', 'User cancelled deletion');
      return;
    }
    
    try {
      const result = await deleteApiKey(keyId);
      if (result.success) {
        addDebugLog('success', 'DELETE_KEY', '✅ Key deleted successfully', result.data);
        await loadData();
      } else {
        addDebugLog('error', 'DELETE_KEY', `❌ Failed: ${result.error}`);
      }
    } catch (error) {
      addDebugLog('error', 'DELETE_KEY', '❌ Exception while deleting key', (error as Error).message);
    }
  };

  const handleToggleApiKey = async (keyId: string, isActive: boolean) => {
    addDebugLog('info', 'TOGGLE_KEY', `Toggling key ${keyId} to ${!isActive}`);
    
    try {
      const result = await toggleApiKey(keyId, !isActive);
      if (result.success) {
        addDebugLog('success', 'TOGGLE_KEY', '✅ Key toggled successfully', result.data);
        await loadData();
      } else {
        addDebugLog('error', 'TOGGLE_KEY', `❌ Failed: ${result.error}`);
      }
    } catch (error) {
      addDebugLog('error', 'TOGGLE_KEY', '❌ Exception while toggling key', (error as Error).message);
    }
  };

  const handleTestApiKey = async (keyId: string) => {
    addDebugLog('info', 'TEST_KEY', `Testing key: ${keyId}`);
    setTestingKey(keyId);
    
    try {
      const result = await testApiKey(keyId);
      addDebugLog(result.success ? 'success' : 'error', 'TEST_KEY', result.message, result);
      setTestResult(prev => ({ ...prev, [keyId]: result }));
    } catch (error) {
      addDebugLog('error', 'TEST_KEY', '❌ Exception while testing key', (error as Error).message);
      setTestResult(prev => ({ ...prev, [keyId]: { success: false, message: (error as Error).message } }));
    }
    
    setTestingKey(null);
  };

  // ============================================
  // PROMPTS HANDLERS
  // ============================================
  
  const handleAddPrompt = async () => {
    addDebugLog('info', 'ADD_PROMPT', 'Attempting to add prompt', { name: newPrompt.name, category: newPrompt.category });
    
    if (!newPrompt.name || !newPrompt.system_prompt) {
      addDebugLog('warn', 'ADD_PROMPT', '❌ Name or system prompt is empty!');
      return;
    }
    
    try {
      const result = await addPrompt({
        name: newPrompt.name,
        category: newPrompt.category,
        system_prompt: newPrompt.system_prompt,
        user_prompt_template: newPrompt.user_prompt_template,
        variables: newPrompt.variables.split(',').map(v => v.trim()).filter(v => v)
      });
      
      if (result.success) {
        addDebugLog('success', 'ADD_PROMPT', '✅ Prompt added successfully', result.data);
        setShowAddPrompt(false);
        setNewPrompt({
          name: '',
          category: 'horoscope',
          system_prompt: '',
          user_prompt_template: '',
          variables: ''
        });
        setEditingPrompt(null);
        await loadData();
      } else {
        addDebugLog('error', 'ADD_PROMPT', `❌ Failed: ${result.error}`);
      }
    } catch (error) {
      addDebugLog('error', 'ADD_PROMPT', '❌ Exception while adding prompt', (error as Error).message);
    }
  };

  const handleUpdatePrompt = async (promptId: string) => {
    addDebugLog('info', 'EDIT_PROMPT', `Opening edit mode for prompt: ${promptId}`);
    
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) {
      addDebugLog('error', 'EDIT_PROMPT', '❌ Prompt not found!');
      return;
    }
    
    addDebugLog('data', 'EDIT_PROMPT', 'Loaded prompt data for editing', prompt);
    
    setNewPrompt({
      name: prompt.name,
      category: prompt.category,
      system_prompt: prompt.system_prompt,
      user_prompt_template: prompt.user_prompt_template,
      variables: prompt.variables?.join(', ') || ''
    });
    setEditingPrompt(promptId);
    setShowAddPrompt(true);
  };

  const handleSaveEditPrompt = async () => {
    addDebugLog('info', 'SAVE_EDIT', `Saving edit for prompt: ${editingPrompt}`);
    
    if (!editingPrompt || !newPrompt.name || !newPrompt.system_prompt) {
      addDebugLog('warn', 'SAVE_EDIT', '❌ Missing required fields!');
      return;
    }
    
    try {
      const result = await updatePrompt(editingPrompt, {
        name: newPrompt.name,
        category: newPrompt.category,
        system_prompt: newPrompt.system_prompt,
        user_prompt_template: newPrompt.user_prompt_template,
        variables: newPrompt.variables.split(',').map(v => v.trim()).filter(v => v)
      });
      
      if (result.success) {
        addDebugLog('success', 'SAVE_EDIT', '✅ Prompt updated successfully', result.data);
        setShowAddPrompt(false);
        setEditingPrompt(null);
        setNewPrompt({
          name: '',
          category: 'horoscope',
          system_prompt: '',
          user_prompt_template: '',
          variables: ''
        });
        await loadData();
      } else {
        addDebugLog('error', 'SAVE_EDIT', `❌ Failed: ${result.error}`);
      }
    } catch (error) {
      addDebugLog('error', 'SAVE_EDIT', '❌ Exception while updating prompt', (error as Error).message);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    addDebugLog('info', 'DELETE_PROMPT', `Attempting to delete prompt: ${promptId}`);
    
    if (!confirm('Are you sure you want to delete this prompt?')) {
      addDebugLog('info', 'DELETE_PROMPT', 'User cancelled deletion');
      return;
    }
    
    try {
      const result = await deletePrompt(promptId);
      if (result.success) {
        addDebugLog('success', 'DELETE_PROMPT', '✅ Prompt deleted successfully', result.data);
        await loadData();
      } else {
        addDebugLog('error', 'DELETE_PROMPT', `❌ Failed: ${result.error}`);
      }
    } catch (error) {
      addDebugLog('error', 'DELETE_PROMPT', '❌ Exception while deleting prompt', (error as Error).message);
    }
  };

  // ============================================
  // PROVIDERS HANDLERS
  // ============================================
  
  const handleToggleProvider = async (providerId: string, isActive: boolean) => {
    addDebugLog('info', 'TOGGLE_PROVIDER', `Toggling provider ${providerId} to ${!isActive}`);
    
    try {
      const result = await toggleProvider(providerId, !isActive);
      if (result.success) {
        addDebugLog('success', 'TOGGLE_PROVIDER', '✅ Provider toggled successfully', result.data);
        await loadData();
      } else {
        addDebugLog('error', 'TOGGLE_PROVIDER', `❌ Failed: ${result.error}`);
      }
    } catch (error) {
      addDebugLog('error', 'TOGGLE_PROVIDER', '❌ Exception while toggling provider', (error as Error).message);
    }
  };

  const handleResetCircuitBreaker = async (providerId: string) => {
    addDebugLog('info', 'RESET_CB', `Resetting circuit breaker for: ${providerId}`);
    
    try {
      const result = await resetCircuitBreaker(providerId);
      if (result.success) {
        addDebugLog('success', 'RESET_CB', '✅ Circuit breaker reset successfully', result.data);
        await loadData();
      } else {
        addDebugLog('error', 'RESET_CB', `❌ Failed: ${result.error}`);
      }
    } catch (error) {
      addDebugLog('error', 'RESET_CB', '❌ Exception while resetting circuit breaker', (error as Error).message);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  
  // ✅ ჯერ არ ვიცით admin თუ არა
  if (isUserAdmin === null) {
    return (
      <div className="ai-admin-screen">
        <div className="ai-admin-loading">
          <RefreshCw size={32} className="spin" />
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // ✅ არ არის admin
  if (!isUserAdmin) {
    return (
      <div className="ai-admin-screen">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center',
          gap: '12px',
          padding: '20px'
        }}>
          <Shield size={64} color="#ef4444" />
          <h2 style={{ color: '#ef4444', margin: 0, fontSize: '20px' }}>⛔ Access Denied</h2>
          <p style={{ color: '#c87800', margin: 0, fontSize: '13px' }}>
            You do not have permission to access this page.
          </p>
          <p style={{ fontSize: '11px', color: '#886600' }}>
            This incident will be reported.
          </p>
          <button 
            onClick={() => onNavigate?.('home')}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #60a5fa, #93c5fd)',
              border: 'none',
              borderRadius: '10px',
              color: '#0a0600',
              fontFamily: 'Georgia, serif',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="ai-admin-refresh-btn" 
            onClick={() => setShowDebug(!showDebug)}
            title="Toggle Debug Panel"
            style={{ 
              background: showDebug ? 'rgba(96, 165, 250, 0.3)' : 'rgba(96, 165, 250, 0.15)',
              borderColor: showDebug ? '#60a5fa' : 'rgba(96, 165, 250, 0.3)'
            }}
          >
            <Bug size={18} />
          </button>
          <button className="ai-admin-refresh-btn" onClick={loadData} title="Refresh">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* DEBUG PANEL */}
      {showDebug && (
        <div className="debug-panel">
          <div className="debug-header">
            <Bug size={16} />
            <span>Debug Panel</span>
            <span className="debug-count">{debugLogs.length} logs</span>
            <button 
              className="debug-clear" 
              onClick={() => setDebugLogs([])}
            >
              Clear
            </button>
          </div>
          
          <div className="debug-summary">
            <div className="debug-stat">
              <Info size={12} />
              <span>Providers: <strong>{providers.length}</strong></span>
            </div>
            <div className="debug-stat">
              <Key size={12} />
              <span>API Keys: <strong>{apiKeys.length}</strong></span>
            </div>
            <div className="debug-stat">
              <MessageSquare size={12} />
              <span>Prompts: <strong>{prompts.length}</strong></span>
            </div>
            <div className="debug-stat">
              <Trophy size={12} />
              <span>Quests: <strong>{quests.length}</strong></span>
            </div>
          </div>

          {providers.length === 0 && (
            <div className="debug-warning">
              ⚠️ <strong>No providers in database!</strong> Run SQL to insert default providers.
            </div>
          )}

          <div className="debug-logs">
            {debugLogs.length === 0 && (
              <div style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'center', padding: '10px' }}>
                No logs yet. Perform an action to see logs here.
              </div>
            )}
            {debugLogs.map((log, i) => (
              <div key={i} className={`debug-log ${log.type}`}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="debug-time">{log.timestamp}</span>
                  <span className="debug-source">[{log.source}]</span>
                  <span className="debug-msg">{log.message}</span>
                </div>
                {log.data && (
                  <details className="debug-data">
                    <summary>Data</summary>
                    <pre>{JSON.stringify(log.data, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="ai-admin-tabs">
        <button
          className={`ai-admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('dashboard');
            addDebugLog('info', 'NAV', 'Switched to Dashboard tab');
          }}
        >
          <BarChart3 size={16} />
          <span>Dashboard</span>
        </button>
        <button
          className={`ai-admin-tab ${activeTab === 'keys' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('keys');
            addDebugLog('info', 'NAV', 'Switched to API Keys tab');
          }}
        >
          <Key size={16} />
          <span>API Keys</span>
        </button>
        <button
          className={`ai-admin-tab ${activeTab === 'providers' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('providers');
            addDebugLog('info', 'NAV', 'Switched to Providers tab');
          }}
        >
          <Database size={16} />
          <span>Providers</span>
        </button>
        <button
          className={`ai-admin-tab ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('prompts');
            addDebugLog('info', 'NAV', 'Switched to Prompts tab');
          }}
        >
          <MessageSquare size={16} />
          <span>Prompts</span>
        </button>
        <button
          className={`ai-admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('stats');
            addDebugLog('info', 'NAV', 'Switched to Stats tab');
          }}
        >
          <BarChart3 size={16} />
          <span>Stats</span>
        </button>
        {/* 🆕 Quests Tab Button */}
        <button
          className={`ai-admin-tab ${activeTab === 'quests' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('quests');
            addDebugLog('info', 'NAV', 'Switched to Quests tab');
          }}
        >
          <Trophy size={16} />
          <span>Quests</span>
        </button>
      </div>

      {/* Content */}
      <div className="ai-admin-content">
        
        {/* ✅ DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="ai-dashboard">
            <h2>📊 Today's Overview</h2>
            
            <div className="dashboard-stats">
              <div className="dashboard-stat-card">
                <div className="stat-icon blue">
                  <Zap size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-number">{totalRequests}</span>
                  <span className="stat-label">Total Requests</span>
                </div>
              </div>
              
              <div className="dashboard-stat-card">
                <div className="stat-icon green">
                  <CheckCircle2 size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-number">{successfulRequests}</span>
                  <span className="stat-label">Successful</span>
                </div>
              </div>
              
              <div className="dashboard-stat-card">
                <div className="stat-icon red">
                  <XCircle size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-number">{failedRequests}</span>
                  <span className="stat-label">Failed</span>
                </div>
              </div>
              
              <div className="dashboard-stat-card">
                <div className="stat-icon gold">
                  <Database size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-number">{apiKeys.length}</span>
                  <span className="stat-label">API Keys</span>
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <h3>💰 Cost Today</h3>
              <div className="cost-display">
                ${totalCost.toFixed(4)}
              </div>
            </div>

            <div className="dashboard-section">
              <h3>⚡ Provider Status ({providers.length} total)</h3>
              <div className="provider-status-list">
                {providers.length === 0 && (
                  <div className="debug-warning">
                    ⚠️ No providers found! Check database.
                  </div>
                )}
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
              <button className="add-btn" onClick={() => {
                addDebugLog('info', 'UI', 'Opening Add Key modal');
                setShowAddKey(true);
              }}>
                <Plus size={16} />
                <span>Add Key</span>
              </button>
            </div>

            <div className="keys-list">
              {apiKeys.length === 0 && (
                <div className="debug-warning">
                  ⚠️ No API keys found. Click "Add Key" to add one.
                </div>
              )}
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
                        {safeNum(key.current_usage)} / {safeNum(key.daily_limit)}
                      </span>
                      <div className="usage-bar">
                        <div
                          className="usage-fill"
                          style={{
                            width: `${safeNum(key.daily_limit) > 0 ? (safeNum(key.current_usage) / safeNum(key.daily_limit)) * 100 : 0}%`,
                            backgroundColor: safeNum(key.daily_limit) > 0 && safeNum(key.current_usage) / safeNum(key.daily_limit) > 0.8 ? '#ef4444' : '#10b981'
                          }}
                        />
                      </div>
                    </div>
                    <div className="key-meta">
                      <span>Priority: {safeNum(key.priority)}</span>
                      <span>Errors: {safeNum(key.error_count)}</span>
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
                        onChange={(e) => {
                          setNewKey({ ...newKey, provider_name: e.target.value });
                          addDebugLog('info', 'FORM', `Provider changed to: ${e.target.value}`);
                        }}
                      >
                        {providers.length === 0 && (
                          <option value="" disabled>No providers available</option>
                        )}
                        {providers.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.tier})
                          </option>
                        ))}
                      </select>
                      {providers.length === 0 && (
                        <small style={{ color: '#ef4444', fontSize: '10px' }}>
                          ⚠️ No providers in database!
                        </small>
                      )}
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
            <h2>🗄️ Providers Management ({providers.length} total)</h2>
            
            <div className="providers-list">
              {providers.length === 0 && (
                <div className="debug-warning">
                  ⚠️ No providers found! Run SQL to insert default providers.
                </div>
              )}
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
                      <span className="value">{safeNum(provider.rpm_limit)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Daily Token Limit:</span>
                      <span className="value">{safeNum(provider.daily_token_limit).toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Cost per 1M tokens:</span>
                      <span className="value">${safeNum(provider.cost_per_1m_tokens)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Priority:</span>
                      <span className="value">{safeNum(provider.priority)}</span>
                    </div>
                  </div>

                  <div className="provider-status">
                    <div className={`circuit-indicator ${provider.circuit_breaker_state}`}>
                      <Shield size={14} />
                      <span>Circuit: {provider.circuit_breaker_state}</span>
                    </div>
                    {safeNum(provider.consecutive_failures) > 0 && (
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
              <h2>💬 Prompts Library ({prompts.length} total)</h2>
              <button className="add-btn" onClick={() => {
                setEditingPrompt(null);
                setNewPrompt({
                  name: '',
                  category: 'horoscope',
                  system_prompt: '',
                  user_prompt_template: '',
                  variables: ''
                });
                setShowAddPrompt(true);
                addDebugLog('info', 'UI', 'Opening Add Prompt modal');
              }}>
                <Plus size={16} />
                <span>Add Prompt</span>
              </button>
            </div>

            <div className="prompts-list">
              {prompts.length === 0 && (
                <div className="debug-warning">
                  ⚠️ No prompts found. Click "Add Prompt" to create one.
                </div>
              )}
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
                        className="icon-btn edit"
                        onClick={() => handleUpdatePrompt(prompt.id)}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
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

            {/* Add/Edit Prompt Modal */}
            <AnimatePresence>
              {showAddPrompt && (
                <motion.div
                  className="modal-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setShowAddPrompt(false);
                    setEditingPrompt(null);
                  }}
                >
                  <motion.div
                    className="modal large"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3>{editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}</h3>
                    
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
                      <button className="cancel-btn" onClick={() => {
                        setShowAddPrompt(false);
                        setEditingPrompt(null);
                      }}>
                        Cancel
                      </button>
                      <button className="confirm-btn" onClick={editingPrompt ? handleSaveEditPrompt : handleAddPrompt}>
                        {editingPrompt ? 'Save Changes' : 'Add Prompt'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 🆕 QUESTS TAB */}
        {activeTab === 'quests' && (
          <div className="ai-prompts"> {/* Reusing ai-prompts layout for consistency */}
            <div className="prompts-header">
              <h2>🏆 Quests Management ({quests.length} total)</h2>
              <button className="add-btn" onClick={() => {
                setEditingQuest(null);
                setNewQuest({
                  title: '',
                  description: '',
                  action_type: 'draw_daily_card',
                  target_count: 1,
                  reward_xp: 10,
                  reward_coins: 5,
                  quest_type: 'daily',
                  is_active: true
                });
                setShowAddQuest(true);
                addDebugLog('info', 'UI', 'Opening Add Quest modal');
              }}>
                <Plus size={16} />
                <span>Add Quest</span>
              </button>
            </div>

            <div className="prompts-list">
              {quests.length === 0 && (
                <div className="debug-warning">
                  ⚠️ No quests found. Click "Add Quest" to create one.
                </div>
              )}
              {quests.map((quest) => (
                <motion.div
                  key={quest.id}
                  className={`prompt-card ${quest.is_active ? 'active' : 'inactive'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="prompt-header">
                    <div className="prompt-info">
                      <h3>{quest.title}</h3>
                      <span className="category-badge">{quest.quest_type}</span>
                    </div>
                    <div className="prompt-actions">
                      <button
                        className="icon-btn edit"
                        onClick={() => handleUpdateQuest(quest.id)}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="icon-btn toggle"
                        onClick={() => handleToggleQuest(quest.id, quest.is_active)}
                        title={quest.is_active ? 'Disable' : 'Enable'}
                      >
                        {quest.is_active ? <Check size={14} /> : <X size={14} />}
                      </button>
                      <button
                        className="icon-btn delete"
                        onClick={() => handleDeleteQuest(quest.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="prompt-content">
                    <div className="prompt-section">
                      <span className="section-label">Action Type:</span>
                      <p className="section-text" style={{ color: '#60a5fa', fontWeight: 'bold' }}>{quest.action_type}</p>
                    </div>
                    <div className="prompt-section">
                      <span className="section-label">Description:</span>
                      <p className="section-text">{quest.description}</p>
                    </div>
                    <div className="prompt-variables" style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span className="section-label">Target: <span style={{color: '#fff'}}>{quest.target_count}</span></span>
                      <span className="section-label">XP: <span style={{color: '#a78bfa', fontWeight: 'bold'}}>{quest.reward_xp}</span></span>
                      <span className="section-label">Coins: <span style={{color: '#fbbf24', fontWeight: 'bold'}}>{quest.reward_coins}</span></span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add/Edit Quest Modal */}
            <AnimatePresence>
              {showAddQuest && (
                <motion.div
                  className="modal-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setShowAddQuest(false);
                    setEditingQuest(null);
                  }}
                >
                  <motion.div
                    className="modal large"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3>{editingQuest ? 'Edit Quest' : 'Add New Quest'}</h3>
                    
                    <div className="modal-field">
                      <label>Title:</label>
                      <input
                        type="text"
                        value={newQuest.title}
                        onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                        placeholder="e.g., Daily Card Draw"
                      />
                    </div>

                    <div className="modal-field">
                      <label>Description:</label>
                      <textarea
                        value={newQuest.description}
                        onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                        placeholder="e.g., Draw your daily tarot card"
                        rows={2}
                      />
                    </div>

                    <div className="modal-field">
                      <label>Action Type:</label>
                      <select
                        value={newQuest.action_type}
                        onChange={(e) => setNewQuest({ ...newQuest, action_type: e.target.value })}
                      >
                        <option value="draw_daily_card">draw_daily_card</option>
                        <option value="check_horoscope">check_horoscope</option>
                        <option value="complete_reading">complete_reading</option>
                        <option value="discover_card">discover_card</option>
                        <option value="maintain_streak">maintain_streak</option>
                      </select>
                    </div>

                    <div className="modal-field">
                      <label>Quest Type:</label>
                      <select
                        value={newQuest.quest_type}
                        onChange={(e) => setNewQuest({ ...newQuest, quest_type: e.target.value as 'daily' | 'weekly' | 'milestone' })}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="milestone">Milestone</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="modal-field" style={{ flex: 1 }}>
                        <label>Target Count:</label>
                        <input
                          type="number"
                          value={newQuest.target_count}
                          onChange={(e) => setNewQuest({ ...newQuest, target_count: parseInt(e.target.value) || 1 })}
                          min="1"
                        />
                      </div>
                      <div className="modal-field" style={{ flex: 1 }}>
                        <label>XP Reward:</label>
                        <input
                          type="number"
                          value={newQuest.reward_xp}
                          onChange={(e) => setNewQuest({ ...newQuest, reward_xp: parseInt(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>
                      <div className="modal-field" style={{ flex: 1 }}>
                        <label>Coins Reward:</label>
                        <input
                          type="number"
                          value={newQuest.reward_coins}
                          onChange={(e) => setNewQuest({ ...newQuest, reward_coins: parseInt(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="modal-buttons">
                      <button className="cancel-btn" onClick={() => {
                        setShowAddQuest(false);
                        setEditingQuest(null);
                      }}>
                        Cancel
                      </button>
                      <button className="confirm-btn" onClick={editingQuest ? handleSaveEditQuest : handleAddQuest}>
                        {editingQuest ? 'Save Changes' : 'Add Quest'}
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
                {todayStats.length === 0 && (
                  <div className="debug-warning">
                    ⚠️ No stats data available yet.
                  </div>
                )}
                {todayStats.map((stat, i) => (
                  <div key={i} className="stats-table-row">
                    <span className="provider-name">{stat.provider}</span>
                    <span>{safeNum(stat.total_requests)}</span>
                    <span className="success">{safeNum(stat.successful_requests)}</span>
                    <span className="failed">{safeNum(stat.failed_requests)}</span>
                    <span>{safeNum(stat.total_tokens).toLocaleString()}</span>
                    <span>${safeNum(stat.total_cost).toFixed(4)}</span>
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
                {apiKeyUsage.length === 0 && (
                  <div className="debug-warning">
                    ⚠️ No usage data available yet.
                  </div>
                )}
                {apiKeyUsage.map((usage, i) => (
                  <div key={i} className="stats-table-row">
                    <span className="provider-name">{usage.provider_name}</span>
                    <span>{safeNum(usage.current_usage)}</span>
                    <span>{safeNum(usage.daily_limit)}</span>
                    <span>
                      <div className="mini-progress-bar">
                        <div
                          className="mini-progress-fill"
                          style={{ width: `${safeNum(usage.usage_percentage)}%` }}
                        />
                      </div>
                      <span className="percentage">{safeNum(usage.usage_percentage)}%</span>
                    </span>
                    <span>{safeNum(usage.remaining_usage)}</span>
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