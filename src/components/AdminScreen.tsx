import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Users, Plus, Trash2, RefreshCw, Crown, ShieldAlert, 
  Calendar, Clock, Zap, Key, Activity, CheckCircle, XCircle, 
  AlertCircle, Play, Eye, BarChart3, TrendingUp, DollarSign, Flame,
  Trophy, Bug, ChevronUp, ChevronDown, Edit2, X, Database
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { 
  isAdmin, 
  getAllUsersWithCredits, 
  updateUserCredits, 
  addCreditsToUser, 
  deleteUserCredits,
  getAllSubscriptions,
  createSubscriptionForUser,
  cancelSubscriptionForUser,
  extendSubscription,
  getAllFunctionStatuses,
  getRecentLogs,
  getFunctionLogs,
  cleanupOldLogs,
  getUserAnalyticsOverview,
  FunctionStatus,
  FunctionLog,
  UserAnalyticsOverview
} from '../lib/adminService';
import './AdminScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

interface UserWithCredits {
  id: string;
  display_name: string;
  telegram_id: number;
  username: string | null;
  credits: Array<{
    feature_id: string;
    credits: number;
  }>;
}

interface SubscriptionWithUser {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  created_at: string;
  user: {
    display_name: string;
    telegram_id: number;
    username: string | null;
  };
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

interface DebugLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warn' | 'data';
  source: string;
  message: string;
  data?: any;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

// 🆕 Toast Notification Component
function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      className={`toast toast-${toast.type}`}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10001,
        background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        fontWeight: '500',
        minWidth: '250px'
      }}
    >
      <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8 }}>
        <X size={16} />
      </button>
    </motion.div>
  );
}

export default function AdminScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<string>('');
  const [newAmount, setNewAmount] = useState(0);
  const [activeTab, setActiveTab] = useState<'credits' | 'subscriptions' | 'monitoring' | 'analytics' | 'quests'>('credits');
  
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedDays, setSelectedDays] = useState(30);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingSubId, setExtendingSubId] = useState<string>('');
  const [extendDays, setExtendDays] = useState(30);

  const [functionStatuses, setFunctionStatuses] = useState<FunctionStatus[]>([]);
  const [recentLogs, setRecentLogs] = useState<FunctionLog[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [functionLogs, setFunctionLogs] = useState<FunctionLog[]>([]);

  const [analyticsOverview, setAnalyticsOverview] = useState<UserAnalyticsOverview | null>(null);

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
  
  const [showDebug, setShowDebug] = useState(true);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

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

  // 🆕 ჭკვიანი ტესტი: Quest RPC-ის პირდაპირი შემოწმება
  const testQuestRPC = async () => {
    if (!user || !supabase) return;
    addDebugLog('info', 'DEBUG_ACTION', '🧪 Testing get_user_quests RPC...');
    try {
      const { data, error } = await supabase.rpc('get_user_quests', { p_user_id: user.id });
      if (error) {
        addDebugLog('error', 'DEBUG_ACTION', `❌ RPC Failed: ${error.message}`);
        showToast('Quest RPC Failed: ' + error.message, 'error');
      } else {
        addDebugLog('success', 'DEBUG_ACTION', `✅ RPC Success! Found ${data?.length || 0} quests.`);
        showToast(`Quest RPC works! Found ${data?.length || 0} quests.`, 'success');
      }
    } catch (err: any) {
      addDebugLog('error', 'DEBUG_ACTION', `💥 Exception: ${err.message}`);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        addDebugLog('info', 'ADMIN_CHECK', `Checking admin status for: ${user.id}`);
        const admin = await isAdmin(user.id);
        setIsUserAdmin(admin);
        if (admin) {
          addDebugLog('success', 'ADMIN_CHECK', '✅ Admin access granted');
          await loadData();
        } else {
          addDebugLog('error', 'ADMIN_CHECK', '❌ Admin access denied');
          setLoading(false);
        }
      } else {
        setIsUserAdmin(false);
        setLoading(false);
      }
    };
    checkAdmin();
  }, [user]);

  const loadData = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    addDebugLog('info', 'LOAD', '🔄 Starting admin data load...');
    
    try {
      const [usersData, subsData, statusesData, logsData, analyticsData, questsRes] = await Promise.all([
        getAllUsersWithCredits(user.id),
        getAllSubscriptions(user.id),
        getAllFunctionStatuses(user.id),
        getRecentLogs(user.id, 20),
        getUserAnalyticsOverview(user.id),
        supabase.from('quest_definitions').select('*').order('quest_type', { ascending: true }).order('title', { ascending: true })
      ]);

      setUsers(usersData);
      setSubscriptions(subsData);
      setFunctionStatuses(statusesData);
      setRecentLogs(logsData);
      setAnalyticsOverview(analyticsData);
      
      if (questsRes.error) {
        addDebugLog('error', 'LOAD_QUESTS', `❌ Failed to fetch quests: ${questsRes.error.message}`);
        setQuests([]);
      } else {
        setQuests(questsRes.data || []);
        addDebugLog('success', 'LOAD_QUESTS', `✅ Loaded ${questsRes.data?.length || 0} quests`);
      }
      
      addDebugLog('success', 'LOAD', '✅ All admin data loaded successfully');
    } catch (error) {
      addDebugLog('error', 'LOAD', `❌ Critical error: ${(error as Error).message}`);
    }
    setLoading(false);
  };

  const handleUpdateCredits = async (targetUserId: string, featureId: string) => {
    if (!user) return;
    const success = await updateUserCredits(user.id, targetUserId, featureId, newAmount);
    if (success) {
      addDebugLog('success', 'CREDITS', `Updated ${featureId} credits for user ${targetUserId} to ${newAmount}`);
      showToast('Credits updated successfully!', 'success');
      await loadData();
      setEditingUser(null);
      setNewAmount(0);
    }
  };

  const handleAddCredits = async (targetUserId: string, featureId: string, amount: number) => {
    if (!user) return;
    const success = await addCreditsToUser(user.id, targetUserId, featureId, amount);
    if (success) {
      addDebugLog('success', 'CREDITS', `Added ${amount} ${featureId} credits to user ${targetUserId}`);
      showToast(`Added ${amount} credits!`, 'success');
      await loadData();
    }
  };

  const handleDeleteCredits = async (targetUserId: string, featureId: string) => {
    if (!user) return;
    if (confirm('Are you sure you want to delete these credits?')) {
      const success = await deleteUserCredits(user.id, targetUserId, featureId);
      if (success) {
        addDebugLog('success', 'CREDITS', `Deleted ${featureId} credits for user ${targetUserId}`);
        showToast('Credits deleted.', 'info');
        await loadData();
      }
    }
  };

  const handleCreateSubscription = async () => {
    if (!user || !selectedUserId) return;
    const success = await createSubscriptionForUser(user.id, selectedUserId, selectedPlan, selectedDays);
    if (success) {
      addDebugLog('success', 'SUBS', `Created ${selectedPlan} subscription for user ${selectedUserId}`);
      showToast('Subscription created successfully!', 'success');
      await loadData();
      setShowAddSubscription(false);
      setSelectedUserId('');
      setSelectedPlan('monthly');
      setSelectedDays(30);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!user) return;
    if (confirm('Are you sure you want to cancel this subscription?')) {
      const success = await cancelSubscriptionForUser(user.id, subscriptionId);
      if (success) {
        addDebugLog('success', 'SUBS', `Cancelled subscription ${subscriptionId}`);
        showToast('Subscription cancelled.', 'info');
        await loadData();
      }
    }
  };

  const handleExtendSubscription = async () => {
    if (!user || !extendingSubId) return;
    const success = await extendSubscription(user.id, extendingSubId, extendDays);
    if (success) {
      addDebugLog('success', 'SUBS', `Extended subscription ${extendingSubId} by ${extendDays} days`);
      showToast(`Extended by ${extendDays} days!`, 'success');
      await loadData();
      setShowExtendModal(false);
      setExtendingSubId('');
      setExtendDays(30);
    }
  };

  const handleTestFunction = async (functionName: string) => {
    showToast('Test Function is disabled via UI. Check logs for automated runs.', 'info');
    addDebugLog('info', 'MONITOR', `Manual test requested for ${functionName}. Check automated logs.`);
  };

  const handleViewLogs = async (functionName: string) => {
    if (!user) return;
    setSelectedFunction(functionName);
    const logs = await getFunctionLogs(user.id, functionName, 20);
    setFunctionLogs(logs);
  };

  const handleCleanupLogs = async () => {
    if (!user) return;
    if (confirm('Delete logs older than 30 days?')) {
      const success = await cleanupOldLogs(user.id);
      if (success) {
        addDebugLog('success', 'MONITOR', '✅ Old logs cleaned up');
        showToast('Old logs cleaned up!', 'success');
        await loadData();
      }
    }
  };

  const handleAddQuest = async () => {
    if (!supabase) return;
    addDebugLog('info', 'QUESTS', 'Attempting to add quest', { title: newQuest.title, action_type: newQuest.action_type });
    if (!newQuest.title || !newQuest.action_type) {
      showToast('Title and Action Type are required!', 'error');
      return;
    }
    try {
      const { data, error } = await supabase.from('quest_definitions').insert([newQuest]).select().single();
      if (error) {
        addDebugLog('error', 'QUESTS', `❌ Failed: ${error.message}`);
        showToast('Failed to add quest: ' + error.message, 'error');
      } else {
        addDebugLog('success', 'QUESTS', '✅ Quest added successfully', data);
        showToast('Quest added successfully!', 'success');
        setShowAddQuest(false);
        setNewQuest({ title: '', description: '', action_type: 'draw_daily_card', target_count: 1, reward_xp: 10, reward_coins: 5, quest_type: 'daily', is_active: true });
        await loadData();
      }
    } catch (error) {
      addDebugLog('error', 'QUESTS', '❌ Exception while adding quest', (error as Error).message);
      showToast('An error occurred.', 'error');
    }
  };

  const handleUpdateQuest = async (questId: string) => {
    addDebugLog('info', 'QUESTS', `Opening edit mode for quest: ${questId}`);
    const quest = quests.find(q => q.id === questId);
    if (!quest) {
      showToast('Quest not found!', 'error');
      return;
    }
    setNewQuest({ ...quest });
    setEditingQuest(questId);
    setShowAddQuest(true);
  };

  const handleSaveEditQuest = async () => {
    if (!supabase) return;
    addDebugLog('info', 'QUESTS', `Saving edit for quest: ${editingQuest}`);
    if (!editingQuest || !newQuest.title || !newQuest.action_type) {
      showToast('Title and Action Type are required!', 'error');
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
        addDebugLog('error', 'QUESTS', `❌ Failed: ${error.message}`);
        showToast('Failed to update quest: ' + error.message, 'error');
      } else {
        addDebugLog('success', 'QUESTS', '✅ Quest updated successfully', data);
        showToast('Quest updated successfully!', 'success');
        setShowAddQuest(false);
        setEditingQuest(null);
        setNewQuest({ title: '', description: '', action_type: 'draw_daily_card', target_count: 1, reward_xp: 10, reward_coins: 5, quest_type: 'daily', is_active: true });
        await loadData();
      }
    } catch (error) {
      addDebugLog('error', 'QUESTS', '❌ Exception while updating quest', (error as Error).message);
      showToast('An error occurred.', 'error');
    }
  };

  const handleToggleQuest = async (questId: string, isActive: boolean) => {
    if (!supabase) return;
    addDebugLog('info', 'QUESTS', `Toggling quest ${questId} to ${!isActive}`);
    try {
      const { error } = await supabase.from('quest_definitions').update({ is_active: !isActive }).eq('id', questId);
      if (error) {
        addDebugLog('error', 'QUESTS', `❌ Failed: ${error.message}`);
        showToast('Failed to toggle quest.', 'error');
      } else {
        addDebugLog('success', 'QUESTS', '✅ Quest toggled successfully');
        showToast(`Quest ${!isActive ? 'Enabled' : 'Disabled'}!`, 'success');
        await loadData();
      }
    } catch (error) {
      addDebugLog('error', 'QUESTS', '❌ Exception while toggling quest', (error as Error).message);
      showToast('An error occurred.', 'error');
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    if (!supabase) return;
    addDebugLog('info', 'QUESTS', `Attempting to delete quest: ${questId}`);
    if (!confirm('Are you sure you want to delete this quest?')) {
      addDebugLog('info', 'QUESTS', 'User cancelled deletion');
      return;
    }
    try {
      const { error } = await supabase.from('quest_definitions').delete().eq('id', questId);
      if (error) {
        addDebugLog('error', 'QUESTS', `❌ Failed: ${error.message}`);
        showToast('Failed to delete quest.', 'error');
      } else {
        addDebugLog('success', 'QUESTS', '✅ Quest deleted successfully');
        showToast('Quest deleted.', 'info');
        await loadData();
      }
    } catch (error) {
      addDebugLog('error', 'QUESTS', '❌ Exception while deleting quest', (error as Error).message);
      showToast('An error occurred.', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isUserAdmin === null || loading) {
    return (
      <div className="admin-screen">
        <div className="admin-loading">
          <RefreshCw size={32} className="spin" />
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="admin-screen">
        <div className="admin-error">
          <ShieldAlert size={64} className="error-icon-large" />
          <h2>⛔ Access Denied</h2>
          <p>You do not have permission to access this page.</p>
          <p className="error-detail">This incident will be reported.</p>
          <button onClick={() => onNavigate?.('home')}>Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-screen" style={{ paddingBottom: showDebug ? '360px' : '140px' }}>
      <AnimatePresence>
        {toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="admin-header">
        <button className="admin-back-btn" onClick={() => onNavigate?.('home')}>
          <ArrowLeft size={20} />
        </button>
        <div className="admin-header-center">
          <Users size={24} />
          <h1>Admin Panel</h1>
        </div>
        <button className="admin-refresh-btn" onClick={loadData}>
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="admin-content-area">
        {activeTab === 'credits' && (
          <>
            <div className="admin-stats">
              <div className="stat-card">
                <span className="stat-number">{users.length}</span>
                <span className="stat-label">Total Users</span>
              </div>
            </div>
            <div className="admin-users-list">
              {users.map((targetUser) => (
                <motion.div key={targetUser.id} className="admin-user-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="user-info">
                    <div className="user-avatar">{targetUser.display_name?.charAt(0).toUpperCase() || 'U'}</div>
                    <div className="user-details">
                      <h3>{targetUser.display_name || 'Unknown'}</h3>
                      <p>@{targetUser.username || targetUser.telegram_id}</p>
                    </div>
                  </div>
                  <div className="user-credits">
                    {['celtic_cross', 'horseshoe', 'relationship'].map((featureId) => {
                      const credit = targetUser.credits.find(c => c.feature_id === featureId);
                      const amount = credit?.credits || 0;
                      return (
                        <div key={featureId} className="credit-item">
                          <span className="credit-label">
                            {featureId === 'celtic_cross' && '✝️ Celtic'}
                            {featureId === 'horseshoe' && '🐎 Horseshoe'}
                            {featureId === 'relationship' && '❤️ Relationship'}
                          </span>
                          {editingUser === targetUser.id && editingFeature === featureId ? (
                            <div className="credit-edit">
                              <input type="number" value={newAmount} onChange={(e) => setNewAmount(parseInt(e.target.value) || 0)} min="0" />
                              <button className="save-btn" onClick={() => handleUpdateCredits(targetUser.id, featureId)}>Save</button>
                              <button className="cancel-btn" onClick={() => setEditingUser(null)}>Cancel</button>
                            </div>
                          ) : (
                            <div className="credit-actions">
                              <span className="credit-amount">{amount}</span>
                              <div className="credit-buttons">
                                <button className="add-btn" onClick={() => handleAddCredits(targetUser.id, featureId, 1)} title="Add 1"><Plus size={14} /></button>
                                <button className="add-btn" onClick={() => handleAddCredits(targetUser.id, featureId, 5)} title="Add 5">+5</button>
                                <button className="edit-btn" onClick={() => { setEditingUser(targetUser.id); setEditingFeature(featureId); setNewAmount(amount); }} title="Edit">Edit</button>
                                {amount > 0 && (
                                  <button className="delete-btn" onClick={() => handleDeleteCredits(targetUser.id, featureId)} title="Delete"><Trash2 size={14} /></button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'subscriptions' && (
          <>
            <div className="admin-stats">
              <div className="stat-card"><span className="stat-number">{subscriptions.filter(s => s.status === 'active').length}</span><span className="stat-label">Active</span></div>
              <div className="stat-card"><span className="stat-number">{subscriptions.filter(s => s.status === 'cancelled').length}</span><span className="stat-label">Cancelled</span></div>
              <div className="stat-card"><span className="stat-number">{subscriptions.filter(s => s.status === 'expired').length}</span><span className="stat-label">Expired</span></div>
            </div>
            <button className="add-subscription-btn" onClick={() => setShowAddSubscription(true)}>
              <Plus size={16} /><span>Add Subscription</span>
            </button>
            <div className="subscriptions-list">
              {subscriptions.map((sub) => {
                const daysRemaining = getDaysRemaining(sub.expires_at);
                return (
                  <motion.div key={sub.id} className={`subscription-card ${sub.status}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="subscription-header">
                      <div className="subscription-user">
                        <div className="subscription-avatar">{sub.user.display_name?.charAt(0).toUpperCase() || 'U'}</div>
                        <div className="subscription-user-info">
                          <h4>{sub.user.display_name || 'Unknown'}</h4>
                          <p>@{sub.user.username || sub.user.telegram_id}</p>
                        </div>
                      </div>
                      <div className={`subscription-status ${sub.status}`}>{sub.status.toUpperCase()}</div>
                    </div>
                    <div className="subscription-details">
                      <div className="subscription-detail-row"><Crown size={14} /><span className="detail-label">Plan:</span><span className="detail-value">{sub.plan_type === 'monthly' ? 'Monthly' : 'Yearly'}</span></div>
                      <div className="subscription-detail-row"><Calendar size={14} /><span className="detail-label">Started:</span><span className="detail-value">{formatDate(sub.started_at)}</span></div>
                      <div className="subscription-detail-row"><Calendar size={14} /><span className="detail-label">Expires:</span><span className="detail-value">{formatDate(sub.expires_at)}</span></div>
                      <div className="subscription-detail-row highlight"><Clock size={14} /><span className="detail-label">Remaining:</span><span className={`detail-value ${daysRemaining <= 7 ? 'warning' : ''}`}>{daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}</span></div>
                    </div>
                    {sub.status === 'active' && (
                      <div className="subscription-actions">
                        <button className="extend-btn" onClick={() => { setExtendingSubId(sub.id); setShowExtendModal(true); }}><Plus size={14} /><span>Extend</span></button>
                        <button className="cancel-sub-btn" onClick={() => handleCancelSubscription(sub.id)}><Trash2 size={14} /><span>Cancel</span></button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'monitoring' && (
          <>
            <div className="admin-stats">
              <div className="stat-card"><span className="stat-number">{functionStatuses.length}</span><span className="stat-label">Functions</span></div>
              <div className="stat-card"><span className="stat-number">{functionStatuses.filter(s => s.lastRun?.status === 'success').length}</span><span className="stat-label">✅ Healthy</span></div>
              <div className="stat-card"><span className="stat-number">{functionStatuses.filter(s => s.lastRun?.status === 'error').length}</span><span className="stat-label">❌ Errors</span></div>
              <div className="stat-card"><span className="stat-number">{recentLogs.length}</span><span className="stat-label">Recent Logs</span></div>
            </div>
            <button className="add-subscription-btn" onClick={handleCleanupLogs} style={{ marginBottom: '16px' }}><Trash2 size={16} /><span>Cleanup Old Logs (30+ days)</span></button>
            <div className="admin-users-list">
              {functionStatuses.map((func) => {
                const isHealthy = func.lastRun?.status === 'success';
                const hasError = func.lastRun?.status === 'error';
                const noData = !func.lastRun;
                return (
                  <motion.div key={func.name} className={`admin-user-card ${isHealthy ? 'status-success' : hasError ? 'status-error' : 'status-unknown'}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="user-info">
                      <div className="user-avatar" style={{ background: isHealthy ? '#10b981' : hasError ? '#ef4444' : '#6b7280' }}>
                        {isHealthy ? <CheckCircle size={24} /> : hasError ? <XCircle size={24} /> : <AlertCircle size={24} />}
                      </div>
                      <div className="user-details">
                        <h3>{func.name}</h3>
                        <p style={{ fontSize: '11px', opacity: 0.7 }}>{func.lastRun ? `Last run: ${new Date(func.lastRun.created_at).toLocaleString('en-US')}` : 'Never run'}</p>
                      </div>
                    </div>
                    <div className="user-credits" style={{ marginTop: '12px' }}>
                      <div className="credit-item"><span className="credit-label">Status:</span><span className={`credit-amount ${isHealthy ? 'text-success' : hasError ? 'text-error' : ''}`}>{isHealthy ? '✅ SUCCESS' : hasError ? '❌ ERROR' : noData ? '⚠️ NO DATA' : '???'}</span></div>
                      <div className="credit-item"><span className="credit-label">Success Rate:</span><span className="credit-amount">{func.successRate.toFixed(0)}%</span></div>
                      <div className="credit-item"><span className="credit-label">Total Runs:</span><span className="credit-amount">{func.totalRuns}</span></div>
                      <div className="credit-item"><span className="credit-label">Avg Response:</span><span className="credit-amount">{func.avgResponseTime}ms</span></div>
                    </div>
                    <div className="subscription-actions" style={{ marginTop: '12px' }}>
                      <button className="extend-btn" onClick={() => handleTestFunction(func.name)}><Play size={14} /><span>Test Now</span></button>
                      <button className="cancel-sub-btn" onClick={() => handleViewLogs(func.name)}><Eye size={14} /><span>View Logs</span></button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ color: '#D9B66F', marginBottom: '12px' }}>📝 Recent 20 Logs</h3>
              <div className="admin-users-list">
                {recentLogs.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>No logs available</p> : recentLogs.map((log) => (
                  <motion.div key={log.id} className={`admin-user-card ${log.status === 'success' ? 'status-success' : 'status-error'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {log.status === 'success' ? <CheckCircle size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                        <strong style={{ fontSize: '13px' }}>{log.function_name}</strong>
                      </div>
                      <span style={{ fontSize: '11px', opacity: 0.7 }}>{new Date(log.created_at).toLocaleString('en-US')}</span>
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                      {log.response_time_ms && <span>⏱️ {log.response_time_ms}ms</span>}
                      {log.status_code && <span style={{ marginLeft: '8px' }}>📡 {log.status_code}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <>
            <div className="analytics-overview-grid">
              <motion.div className="analytics-overview-card blue" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><Users size={20} /><div className="analytics-info"><span className="analytics-number">{analyticsOverview?.total_users || 0}</span><span className="analytics-label">Total Users</span></div></motion.div>
              <motion.div className="analytics-overview-card green" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><Activity size={20} /><div className="analytics-info"><span className="analytics-number">{analyticsOverview?.active_today || 0}</span><span className="analytics-label">Active Today</span></div></motion.div>
              <motion.div className="analytics-overview-card gold" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}><Crown size={20} /><div className="analytics-info"><span className="analytics-number">{analyticsOverview?.premium_users || 0}</span><span className="analytics-label">Premium</span></div></motion.div>
              <motion.div className="analytics-overview-card orange" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><Flame size={20} /><div className="analytics-info"><span className="analytics-number">{analyticsOverview?.avg_streak || 0}</span><span className="analytics-label">Avg Streak</span></div></motion.div>
              <motion.div className="analytics-overview-card purple" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}><BarChart3 size={20} /><div className="analytics-info"><span className="analytics-number">{analyticsOverview?.total_readings || 0}</span><span className="analytics-label">Readings</span></div></motion.div>
              <motion.div className="analytics-overview-card emerald" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}><DollarSign size={20} /><div className="analytics-info"><span className="analytics-number">${(analyticsOverview?.total_revenue || 0).toFixed(2)}</span><span className="analytics-label">Revenue</span></div></motion.div>
            </div>
            <motion.button className="view-full-analytics-btn" onClick={() => onNavigate?.('user-analytics')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <TrendingUp size={20} />
              <div className="btn-content"><span className="btn-title">View Full Analytics</span><span className="btn-subtitle">Detailed user statistics, sessions & reading history</span></div>
              <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} />
            </motion.button>
          </>
        )}

        {/* 🆕 გაუმჯობესებული Quests ტაბი */}
        {activeTab === 'quests' && (
          <>
            <div className="admin-stats">
              <div className="stat-card"><span className="stat-number">{quests.length}</span><span className="stat-label">Total Quests</span></div>
              <div className="stat-card"><span className="stat-number">{quests.filter(q => q.quest_type === 'daily').length}</span><span className="stat-label">Daily</span></div>
              <div className="stat-card"><span className="stat-number">{quests.filter(q => q.quest_type === 'weekly').length}</span><span className="stat-label">Weekly</span></div>
              <div className="stat-card"><span className="stat-number">{quests.filter(q => q.quest_type === 'milestone').length}</span><span className="stat-label">Milestone</span></div>
            </div>

            <button className="add-subscription-btn" onClick={() => {
              setEditingQuest(null);
              setNewQuest({ title: '', description: '', action_type: 'draw_daily_card', target_count: 1, reward_xp: 10, reward_coins: 5, quest_type: 'daily', is_active: true });
              setShowAddQuest(true);
              addDebugLog('info', 'UI', 'Opening Add Quest modal');
            }} style={{ marginBottom: '16px' }}>
              <Plus size={16} /><span>Add New Quest</span>
            </button>

            <div className="admin-users-list">
              {quests.length === 0 && (
                <div className="debug-warning" style={{ padding: '20px', textAlign: 'center' }}>⚠️ No quests found. Click "Add New Quest" to create one.</div>
              )}
              {quests.map((quest) => (
                <motion.div key={quest.id} className={`admin-user-card ${quest.is_active ? 'status-success' : 'status-unknown'}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="user-info">
                    <div className="user-avatar" style={{ background: quest.is_active ? '#10b981' : '#6b7280' }}><Trophy size={24} /></div>
                    <div className="user-details">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3>{quest.title}</h3>
                        <span style={{ 
                          fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase',
                          background: quest.quest_type === 'daily' ? 'rgba(59, 130, 246, 0.2)' : quest.quest_type === 'weekly' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: quest.quest_type === 'daily' ? '#60a5fa' : quest.quest_type === 'weekly' ? '#c084fc' : '#fbbf24'
                        }}>
                          {quest.quest_type}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', opacity: 0.7 }}>{quest.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="user-credits" style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    <div className="credit-item" style={{ textAlign: 'center', background: 'rgba(96, 165, 250, 0.1)', padding: '6px', borderRadius: '6px' }}>
                      <span className="credit-label" style={{ display: 'block', fontSize: '9px', marginBottom: '2px' }}>Action</span>
                      <span className="credit-amount" style={{ color: '#60a5fa', fontSize: '10px', wordBreak: 'break-all' }}>{quest.action_type}</span>
                    </div>
                    <div className="credit-item" style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '6px', borderRadius: '6px' }}>
                      <span className="credit-label" style={{ display: 'block', fontSize: '9px', marginBottom: '2px' }}>Target</span>
                      <span className="credit-amount" style={{ fontSize: '14px', fontWeight: 'bold' }}>{quest.target_count}</span>
                    </div>
                    <div className="credit-item" style={{ textAlign: 'center', background: 'rgba(167, 139, 250, 0.1)', padding: '6px', borderRadius: '6px' }}>
                      <span className="credit-label" style={{ display: 'block', fontSize: '9px', marginBottom: '2px' }}>XP</span>
                      <span className="credit-amount" style={{ color: '#a78bfa', fontSize: '14px', fontWeight: 'bold' }}>{quest.reward_xp}</span>
                    </div>
                    <div className="credit-item" style={{ textAlign: 'center', background: 'rgba(251, 191, 36, 0.1)', padding: '6px', borderRadius: '6px' }}>
                      <span className="credit-label" style={{ display: 'block', fontSize: '9px', marginBottom: '2px' }}>Coins</span>
                      <span className="credit-amount" style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 'bold' }}>{quest.reward_coins}</span>
                    </div>
                  </div>
                  <div className="subscription-actions" style={{ marginTop: '12px' }}>
                    <button className="extend-btn" onClick={() => handleUpdateQuest(quest.id)}><Edit2 size={14} /><span>Edit</span></button>
                    <button className="cancel-sub-btn" onClick={() => handleToggleQuest(quest.id, quest.is_active)} style={{ background: quest.is_active ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', borderColor: quest.is_active ? '#ef4444' : '#10b981', color: quest.is_active ? '#ef4444' : '#10b981' }}>
                      {quest.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="cancel-sub-btn" onClick={() => handleDeleteQuest(quest.id)}><Trash2 size={14} /><span>Delete</span></button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ოპტიმიზირებული 2-რიგიანი (3x2) ქვედა ნავიგაცია მობილურისთვის */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(2, auto)',
        gap: '4px',
        padding: '8px',
        background: 'rgba(10, 6, 0, 0.98)',
        borderTop: '1px solid rgba(197, 160, 89, 0.3)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backdropFilter: 'blur(10px)'
      }}>
        {[
          { id: 'credits', icon: Key, label: 'Credits' },
          { id: 'subscriptions', icon: Crown, label: 'Subs' },
          { id: 'monitoring', icon: Activity, label: 'Monitor' },
          { id: 'analytics', icon: BarChart3, label: 'Analytics' },
          { id: 'quests', icon: Trophy, label: 'Quests' },
          { id: 'ai', icon: Zap, label: 'AI', isExternal: true }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => tab.isExternal ? onNavigate?.('ai-management') : setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 4px',
              background: activeTab === tab.id ? 'rgba(197, 160, 89, 0.2)' : 'transparent',
              border: activeTab === tab.id ? '1px solid rgba(197, 160, 89, 0.5)' : '1px solid transparent',
              borderRadius: '8px',
              color: activeTab === tab.id ? '#C5A059' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <tab.icon size={18} />
            <span style={{ fontSize: '10px', fontWeight: activeTab === tab.id ? 'bold' : 'normal' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Modals (Add Sub, Extend, Add Quest, Logs) */}
      {showAddSubscription && (
        <div className="modal-overlay" onClick={() => setShowAddSubscription(false)}>
          <motion.div className="modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
            <h3>Add Subscription</h3>
            <div className="modal-field"><label>Select User:</label><select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}><option value="">-- Select User --</option>{users.map((u) => (<option key={u.id} value={u.id}>{u.display_name || 'Unknown'} (@{u.username || u.telegram_id})</option>))}</select></div>
            <div className="modal-field"><label>Plan Type:</label><div className="plan-selector"><button className={`plan-option ${selectedPlan === 'monthly' ? 'active' : ''}`} onClick={() => setSelectedPlan('monthly')}>Monthly</button><button className={`plan-option ${selectedPlan === 'yearly' ? 'active' : ''}`} onClick={() => setSelectedPlan('yearly')}>Yearly</button></div></div>
            <div className="modal-field"><label>Duration (days):</label><input type="number" value={selectedDays} onChange={(e) => setSelectedDays(parseInt(e.target.value) || 30)} min="1" max="365" /></div>
            <div className="modal-buttons"><button className="modal-btn cancel" onClick={() => setShowAddSubscription(false)}>Cancel</button><button className="modal-btn confirm" onClick={handleCreateSubscription} disabled={!selectedUserId}>Create Subscription</button></div>
          </motion.div>
        </div>
      )}

      {showExtendModal && (
        <div className="modal-overlay" onClick={() => setShowExtendModal(false)}>
          <motion.div className="modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
            <h3>Extend Subscription</h3>
            <div className="modal-field"><label>Additional Days:</label><input type="number" value={extendDays} onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)} min="1" max="365" /></div>
            <div className="modal-buttons"><button className="modal-btn cancel" onClick={() => setShowExtendModal(false)}>Cancel</button><button className="modal-btn confirm" onClick={handleExtendSubscription}>Extend</button></div>
          </motion.div>
        </div>
      )}

      {showAddQuest && (
        <div className="modal-overlay" onClick={() => { setShowAddQuest(false); setEditingQuest(null); }}>
          <motion.div className="modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw' }}>
            <h3>{editingQuest ? 'Edit Quest' : 'Add New Quest'}</h3>
            <div className="modal-field"><label>Title:</label><input type="text" value={newQuest.title} onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })} placeholder="e.g., Daily Card Draw" /></div>
            <div className="modal-field"><label>Description:</label><textarea value={newQuest.description} onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })} placeholder="e.g., Draw your daily tarot card" rows={2} /></div>
            <div className="modal-field"><label>Action Type:</label><select value={newQuest.action_type} onChange={(e) => setNewQuest({ ...newQuest, action_type: e.target.value })}><option value="draw_daily_card">draw_daily_card</option><option value="check_horoscope">check_horoscope</option><option value="complete_reading">complete_reading</option><option value="discover_card">discover_card</option><option value="maintain_streak">maintain_streak</option></select></div>
            <div className="modal-field"><label>Quest Type:</label><select value={newQuest.quest_type} onChange={(e) => setNewQuest({ ...newQuest, quest_type: e.target.value as 'daily' | 'weekly' | 'milestone' })}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="milestone">Milestone</option></select></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="modal-field" style={{ flex: 1 }}><label>Target:</label><input type="number" value={newQuest.target_count} onChange={(e) => setNewQuest({ ...newQuest, target_count: parseInt(e.target.value) || 1 })} min="1" /></div>
              <div className="modal-field" style={{ flex: 1 }}><label>XP:</label><input type="number" value={newQuest.reward_xp} onChange={(e) => setNewQuest({ ...newQuest, reward_xp: parseInt(e.target.value) || 0 })} min="0" /></div>
              <div className="modal-field" style={{ flex: 1 }}><label>Coins:</label><input type="number" value={newQuest.reward_coins} onChange={(e) => setNewQuest({ ...newQuest, reward_coins: parseInt(e.target.value) || 0 })} min="0" /></div>
            </div>
            <div className="modal-buttons"><button className="modal-btn cancel" onClick={() => { setShowAddQuest(false); setEditingQuest(null); }}>Cancel</button><button className="modal-btn confirm" onClick={editingQuest ? handleSaveEditQuest : handleAddQuest}>{editingQuest ? 'Save Changes' : 'Add Quest'}</button></div>
          </motion.div>
        </div>
      )}

      {selectedFunction && (
        <div className="modal-overlay" onClick={() => setSelectedFunction(null)}>
          <motion.div className="modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3>📋 {selectedFunction} - Logs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {functionLogs.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.7 }}>No logs available</p> : functionLogs.map((log) => (
                <div key={log.id} style={{ padding: '10px', background: log.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: `1px solid ${log.status === 'success' ? '#10b981' : '#ef4444'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><strong>{log.status === 'success' ? '✅' : '❌'} {log.status.toUpperCase()}</strong><span style={{ fontSize: '11px', opacity: 0.7 }}>{new Date(log.created_at).toLocaleString('en-US')}</span></div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>⏱️ {log.response_time_ms || 'N/A'}ms | 📡 {log.status_code || 'N/A'}</div>
                  {log.error_message && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>❌ {log.error_message}</div>}
                </div>
              ))}
            </div>
            <div className="modal-buttons" style={{ marginTop: '16px' }}><button className="modal-btn cancel" onClick={() => setSelectedFunction(null)}>Close</button></div>
          </motion.div>
        </div>
      )}

      {/* 🆕 ჭკვიანი და ინფორმაციული Debug პანელი */}
      <div style={{
        position: 'fixed',
        bottom: '110px',
        left: 0,
        right: 0,
        background: 'rgba(10, 6, 0, 0.98)',
        borderTop: '2px solid #fbbf24',
        zIndex: 9998,
        maxHeight: showDebug ? '300px' : '36px',
        transition: 'max-height 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.8)'
      }}>
        <div 
          onClick={() => setShowDebug(!showDebug)}
          style={{
            padding: '6px 12px',
            background: 'rgba(251, 191, 36, 0.1)',
            color: '#fbbf24',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            borderBottom: showDebug ? '1px solid rgba(251, 191, 36, 0.3)' : 'none',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Bug size={12} />
            <span>ADMIN DEBUG</span>
            <span style={{ background: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>DB: {dbStatus === 'connected' ? 'OK' : 'ERR'}</span>
            <span style={{ background: '#fbbf24', color: '#000', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>QUESTS: {quests.length}</span>
            <span style={{ background: isUserAdmin ? '#10b981' : '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>ADMIN: {isUserAdmin ? 'YES' : 'NO'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={(e) => { e.stopPropagation(); setDebugLogs([]); }} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', cursor: 'pointer' }}>Clear</button>
            {showDebug ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
        </div>

        {showDebug && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px', fontSize: '10px', fontFamily: 'monospace' }}>
            {/* 🆕 სწრაფი მოქმედებები */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <button onClick={(e) => { e.stopPropagation(); loadData(); }} style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={10} /> Reload Data
              </button>
              <button onClick={(e) => { e.stopPropagation(); testQuestRPC(); }} style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Database size={10} /> Test Quest RPC
              </button>
            </div>

            {debugLogs.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: '8px' }}>No logs yet. Perform an action to see logs here.</div>}
            {debugLogs.map((log, i) => (
              <div key={i} style={{ padding: '4px 6px', marginBottom: '2px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', borderLeft: `2px solid ${log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : log.type === 'warn' ? '#fbbf24' : '#60a5fa'}` }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: '9px' }}>{log.timestamp}</span>
                  <span style={{ color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : log.type === 'warn' ? '#fbbf24' : '#60a5fa', fontWeight: 'bold', fontSize: '9px' }}>[{log.source}]</span>
                  <span style={{ color: '#e2e8f0', fontSize: '10px' }}>{log.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}