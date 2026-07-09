import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Users, Plus, Trash2, RefreshCw, Crown, ShieldAlert, 
  Calendar, Clock, Zap, Key, Activity, CheckCircle, XCircle, 
  AlertCircle, Play, Eye, BarChart3, TrendingUp, DollarSign, Flame
} from 'lucide-react';
import { useUser } from '../context/UserContext';
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

export default function AdminScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<string>('');
  const [newAmount, setNewAmount] = useState(0);
  const [activeTab, setActiveTab] = useState<'credits' | 'subscriptions' | 'monitoring' | 'analytics'>('credits');
  
  // Subscription management states
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedDays, setSelectedDays] = useState(30);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingSubId, setExtendingSubId] = useState<string>('');
  const [extendDays, setExtendDays] = useState(30);

  // Monitoring states
  const [functionStatuses, setFunctionStatuses] = useState<FunctionStatus[]>([]);
  const [recentLogs, setRecentLogs] = useState<FunctionLog[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [functionLogs, setFunctionLogs] = useState<FunctionLog[]>([]);

  // 🆕 Analytics states
  const [analyticsOverview, setAnalyticsOverview] = useState<UserAnalyticsOverview | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const admin = await isAdmin(user.id);
        setIsUserAdmin(admin);
        if (admin) {
          await loadData();
        } else {
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
    if (!user) return;
    setLoading(true);
    const [usersData, subsData, statusesData, logsData, analyticsData] = await Promise.all([
      getAllUsersWithCredits(user.id),
      getAllSubscriptions(user.id),
      getAllFunctionStatuses(user.id),
      getRecentLogs(user.id, 20),
      getUserAnalyticsOverview(user.id)
    ]);
    setUsers(usersData);
    setSubscriptions(subsData);
    setFunctionStatuses(statusesData);
    setRecentLogs(logsData);
    setAnalyticsOverview(analyticsData);
    setLoading(false);
  };

  const handleUpdateCredits = async (targetUserId: string, featureId: string) => {
    if (!user) return;
    const success = await updateUserCredits(user.id, targetUserId, featureId, newAmount);
    if (success) {
      await loadData();
      setEditingUser(null);
      setNewAmount(0);
    }
  };

  const handleAddCredits = async (targetUserId: string, featureId: string, amount: number) => {
    if (!user) return;
    const success = await addCreditsToUser(user.id, targetUserId, featureId, amount);
    if (success) {
      await loadData();
    }
  };

  const handleDeleteCredits = async (targetUserId: string, featureId: string) => {
    if (!user) return;
    if (confirm('Are you sure you want to delete these credits?')) {
      const success = await deleteUserCredits(user.id, targetUserId, featureId);
      if (success) {
        await loadData();
      }
    }
  };

  const handleCreateSubscription = async () => {
    if (!user || !selectedUserId) return;
    const success = await createSubscriptionForUser(user.id, selectedUserId, selectedPlan, selectedDays);
    if (success) {
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
        await loadData();
      }
    }
  };

  const handleExtendSubscription = async () => {
    if (!user || !extendingSubId) return;
    const success = await extendSubscription(user.id, extendingSubId, extendDays);
    if (success) {
      await loadData();
      setShowExtendModal(false);
      setExtendingSubId('');
      setExtendDays(30);
    }
  };

  // ✅ Monitoring handlers - დროებით გამორთულია CORS პრობლემის გამო
  const handleTestFunction = async (functionName: string) => {
    alert(
      `⚠️ Test Function დროებით გამორთულია\n\n` +
      `მიზეზი: CORS პოლიტიკა ბლოკავს Telegram-იდან გამოძახებას\n\n` +
      `Function მაინც მუშაობს:\n` +
      `✅ ავტომატურად გაეშვება ყოველდღე 00:01 UTC-ზე\n` +
      `✅ ლოგები იწერება function_logs ცხრილში\n` +
      `✅ ნახეთ "View Logs" ღილაკით\n\n` +
      `Function URL:\n` +
      `https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/${functionName}`
    );
  };

  const handleViewLogs = async (functionName: string) => {
    if (!user) return;
    setSelectedFunction(functionName);
    const logs = await getFunctionLogs(user.id, functionName, 20);
    setFunctionLogs(logs);
  };

  const handleCleanupLogs = async () => {
    if (!user) return;
    if (confirm('წავშალოთ 30 დღეზე მეტი ლოგები?')) {
      const success = await cleanupOldLogs(user.id);
      if (success) {
        await loadData();
        alert('✅ ძველი ლოგები წაიშალა');
      }
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

  // ჯერ არ ვიცით admin თუ არა
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

  // არ არის admin
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
    <div className="admin-screen">
      {/* Header */}
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

      {/* Content Area */}
      <div className="admin-content-area">
        {/* Credits Tab */}
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
                <motion.div
                  key={targetUser.id}
                  className="admin-user-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="user-info">
                    <div className="user-avatar">
                      {targetUser.display_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
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
                              <input
                                type="number"
                                value={newAmount}
                                onChange={(e) => setNewAmount(parseInt(e.target.value) || 0)}
                                min="0"
                              />
                              <button
                                className="save-btn"
                                onClick={() => handleUpdateCredits(targetUser.id, featureId)}
                              >
                                Save
                              </button>
                              <button
                                className="cancel-btn"
                                onClick={() => setEditingUser(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="credit-actions">
                              <span className="credit-amount">{amount}</span>
                              <div className="credit-buttons">
                                <button
                                  className="add-btn"
                                  onClick={() => handleAddCredits(targetUser.id, featureId, 1)}
                                  title="Add 1"
                                >
                                  <Plus size={14} />
                                </button>
                                <button
                                  className="add-btn"
                                  onClick={() => handleAddCredits(targetUser.id, featureId, 5)}
                                  title="Add 5"
                                >
                                  +5
                                </button>
                                <button
                                  className="edit-btn"
                                  onClick={() => {
                                    setEditingUser(targetUser.id);
                                    setEditingFeature(featureId);
                                    setNewAmount(amount);
                                  }}
                                  title="Edit"
                                >
                                  Edit
                                </button>
                                {amount > 0 && (
                                  <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteCredits(targetUser.id, featureId)}
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
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

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <>
            <div className="admin-stats">
              <div className="stat-card">
                <span className="stat-number">{subscriptions.filter(s => s.status === 'active').length}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{subscriptions.filter(s => s.status === 'cancelled').length}</span>
                <span className="stat-label">Cancelled</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{subscriptions.filter(s => s.status === 'expired').length}</span>
                <span className="stat-label">Expired</span>
              </div>
            </div>

            <button 
              className="add-subscription-btn"
              onClick={() => setShowAddSubscription(true)}
            >
              <Plus size={16} />
              <span>Add Subscription</span>
            </button>

            <div className="subscriptions-list">
              {subscriptions.map((sub) => {
                const daysRemaining = getDaysRemaining(sub.expires_at);
                
                return (
                  <motion.div
                    key={sub.id}
                    className={`subscription-card ${sub.status}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="subscription-header">
                      <div className="subscription-user">
                        <div className="subscription-avatar">
                          {sub.user.display_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="subscription-user-info">
                          <h4>{sub.user.display_name || 'Unknown'}</h4>
                          <p>@{sub.user.username || sub.user.telegram_id}</p>
                        </div>
                      </div>
                      <div className={`subscription-status ${sub.status}`}>
                        {sub.status.toUpperCase()}
                      </div>
                    </div>

                    <div className="subscription-details">
                      <div className="subscription-detail-row">
                        <Crown size={14} />
                        <span className="detail-label">Plan:</span>
                        <span className="detail-value">
                          {sub.plan_type === 'monthly' ? 'Monthly' : 'Yearly'}
                        </span>
                      </div>
                      <div className="subscription-detail-row">
                        <Calendar size={14} />
                        <span className="detail-label">Started:</span>
                        <span className="detail-value">{formatDate(sub.started_at)}</span>
                      </div>
                      <div className="subscription-detail-row">
                        <Calendar size={14} />
                        <span className="detail-label">Expires:</span>
                        <span className="detail-value">{formatDate(sub.expires_at)}</span>
                      </div>
                      <div className="subscription-detail-row highlight">
                        <Clock size={14} />
                        <span className="detail-label">Remaining:</span>
                        <span className={`detail-value ${daysRemaining <= 7 ? 'warning' : ''}`}>
                          {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                        </span>
                      </div>
                    </div>

                    {sub.status === 'active' && (
                      <div className="subscription-actions">
                        <button
                          className="extend-btn"
                          onClick={() => {
                            setExtendingSubId(sub.id);
                            setShowExtendModal(true);
                          }}
                        >
                          <Plus size={14} />
                          <span>Extend</span>
                        </button>
                        <button
                          className="cancel-sub-btn"
                          onClick={() => handleCancelSubscription(sub.id)}
                        >
                          <Trash2 size={14} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* 🆕 Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <>
            <div className="admin-stats">
              <div className="stat-card">
                <span className="stat-number">{functionStatuses.length}</span>
                <span className="stat-label">Functions</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {functionStatuses.filter(s => s.lastRun?.status === 'success').length}
                </span>
                <span className="stat-label">✅ Healthy</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {functionStatuses.filter(s => s.lastRun?.status === 'error').length}
                </span>
                <span className="stat-label">❌ Errors</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{recentLogs.length}</span>
                <span className="stat-label">Recent Logs</span>
              </div>
            </div>

            <button 
              className="add-subscription-btn"
              onClick={handleCleanupLogs}
              style={{ marginBottom: '16px' }}
            >
              <Trash2 size={16} />
              <span>Cleanup Old Logs (30+ days)</span>
            </button>

            <div className="admin-users-list">
              {functionStatuses.map((func) => {
                const isHealthy = func.lastRun?.status === 'success';
                const hasError = func.lastRun?.status === 'error';
                const noData = !func.lastRun;

                return (
                  <motion.div
                    key={func.name}
                    className={`admin-user-card ${isHealthy ? 'status-success' : hasError ? 'status-error' : 'status-unknown'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="user-info">
                      <div className="user-avatar" style={{
                        background: isHealthy ? '#10b981' : hasError ? '#ef4444' : '#6b7280'
                      }}>
                        {isHealthy ? <CheckCircle size={24} /> : 
                         hasError ? <XCircle size={24} /> : 
                         <AlertCircle size={24} />}
                      </div>
                      <div className="user-details">
                        <h3>{func.name}</h3>
                        <p style={{ fontSize: '11px', opacity: 0.7 }}>
                          {func.lastRun 
                            ? `ბოლო: ${new Date(func.lastRun.created_at).toLocaleString('ka-GE')}`
                            : 'არასდროს გაშვებულა'}
                        </p>
                      </div>
                    </div>

                    <div className="user-credits" style={{ marginTop: '12px' }}>
                      <div className="credit-item">
                        <span className="credit-label">სტატუსი:</span>
                        <span className={`credit-amount ${isHealthy ? 'text-success' : hasError ? 'text-error' : ''}`}>
                          {isHealthy ? '✅ SUCCESS' : hasError ? '❌ ERROR' : noData ? '⚠️ NO DATA' : '???'}
                        </span>
                      </div>
                      <div className="credit-item">
                        <span className="credit-label">Success Rate:</span>
                        <span className="credit-amount">{func.successRate.toFixed(0)}%</span>
                      </div>
                      <div className="credit-item">
                        <span className="credit-label">Total Runs:</span>
                        <span className="credit-amount">{func.totalRuns}</span>
                      </div>
                      <div className="credit-item">
                        <span className="credit-label">Avg Response:</span>
                        <span className="credit-amount">{func.avgResponseTime}ms</span>
                      </div>
                      {func.lastRun?.response_time_ms && (
                        <div className="credit-item">
                          <span className="credit-label">Last Response:</span>
                          <span className="credit-amount">{func.lastRun.response_time_ms}ms</span>
                        </div>
                      )}
                      {func.lastRun?.error_message && (
                        <div className="credit-item">
                          <span className="credit-label">Error:</span>
                          <span className="credit-amount text-error" style={{ fontSize: '11px' }}>
                            {func.lastRun.error_message.substring(0, 100)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="subscription-actions" style={{ marginTop: '12px' }}>
                      <button
                        className="extend-btn"
                        onClick={() => handleTestFunction(func.name)}
                      >
                        <Play size={14} />
                        <span>Test Now</span>
                      </button>
                      <button
                        className="cancel-sub-btn"
                        onClick={() => handleViewLogs(func.name)}
                      >
                        <Eye size={14} />
                        <span>View Logs</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Recent Logs Section */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ color: '#D9B66F', marginBottom: '12px' }}>📝 ბოლო 20 ლოგი</h3>
              <div className="admin-users-list">
                {recentLogs.length === 0 ? (
                  <p style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
                    ლოგები არ არის
                  </p>
                ) : (
                  recentLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      className={`admin-user-card ${log.status === 'success' ? 'status-success' : 'status-error'}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ padding: '10px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {log.status === 'success' ? <CheckCircle size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                          <strong style={{ fontSize: '13px' }}>{log.function_name}</strong>
                        </div>
                        <span style={{ fontSize: '11px', opacity: 0.7 }}>
                          {new Date(log.created_at).toLocaleString('ka-GE')}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                        {log.response_time_ms && <span>⏱️ {log.response_time_ms}ms</span>}
                        {log.status_code && <span style={{ marginLeft: '8px' }}>📡 {log.status_code}</span>}
                        {log.triggered_by && <span style={{ marginLeft: '8px' }}>🔹 {log.triggered_by}</span>}
                      </div>
                      {log.error_message && (
                        <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                          ❌ {log.error_message.substring(0, 150)}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* 🆕 Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
            {/* Overview Cards */}
            <div className="analytics-overview-grid">
              <motion.div 
                className="analytics-overview-card blue"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Users size={20} />
                <div className="analytics-info">
                  <span className="analytics-number">{analyticsOverview?.total_users || 0}</span>
                  <span className="analytics-label">Total Users</span>
                </div>
              </motion.div>

              <motion.div 
                className="analytics-overview-card green"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Activity size={20} />
                <div className="analytics-info">
                  <span className="analytics-number">{analyticsOverview?.active_today || 0}</span>
                  <span className="analytics-label">Active Today</span>
                </div>
              </motion.div>

              <motion.div 
                className="analytics-overview-card gold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Crown size={20} />
                <div className="analytics-info">
                  <span className="analytics-number">{analyticsOverview?.premium_users || 0}</span>
                  <span className="analytics-label">Premium</span>
                </div>
              </motion.div>

              <motion.div 
                className="analytics-overview-card orange"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Flame size={20} />
                <div className="analytics-info">
                  <span className="analytics-number">{analyticsOverview?.avg_streak || 0}</span>
                  <span className="analytics-label">Avg Streak</span>
                </div>
              </motion.div>

              <motion.div 
                className="analytics-overview-card purple"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <BarChart3 size={20} />
                <div className="analytics-info">
                  <span className="analytics-number">{analyticsOverview?.total_readings || 0}</span>
                  <span className="analytics-label">Readings</span>
                </div>
              </motion.div>

              <motion.div 
                className="analytics-overview-card emerald"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <DollarSign size={20} />
                <div className="analytics-info">
                  <span className="analytics-number">${(analyticsOverview?.total_revenue || 0).toFixed(2)}</span>
                  <span className="analytics-label">Revenue</span>
                </div>
              </motion.div>
            </div>

            {/* View Full Analytics Button */}
            <motion.button 
              className="view-full-analytics-btn"
              onClick={() => onNavigate?.('user-analytics')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <TrendingUp size={20} />
              <div className="btn-content">
                <span className="btn-title">View Full Analytics</span>
                <span className="btn-subtitle">Detailed user statistics, sessions & reading history</span>
              </div>
              <ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} />
            </motion.button>

            {/* Quick Stats Info */}
            <div className="analytics-info-card">
              <h3>📊 What you'll see in Full Analytics</h3>
              <ul>
                <li>👤 <strong>Complete user list</strong> with search & filters</li>
                <li>♈ <strong>Big Three</strong> (Sun/Moon/Rising signs)</li>
                <li>💎 <strong>Gems balance</strong> & subscription status</li>
                <li>🔥 <strong>Streak tracking</strong> (current & longest)</li>
                <li>📚 <strong>Reading history</strong> for each user</li>
                <li>⏱️ <strong>Session duration</strong> & last active time</li>
                <li>🎫 <strong>Credits breakdown</strong> per user</li>
                <li>🔍 <strong>Advanced filters</strong> (Premium/Free/Active)</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* ქვედა ნავიგაციის პანელი */}
      <div className="admin-bottom-nav">
        <button
          className={`admin-nav-btn ${activeTab === 'credits' ? 'active' : ''}`}
          onClick={() => setActiveTab('credits')}
        >
          <Key size={20} />
          <span>Credits</span>
        </button>
        <button
          className={`admin-nav-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <Crown size={20} />
          <span>Subs</span>
        </button>
        <button
          className={`admin-nav-btn ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <Activity size={20} />
          <span>Monitor</span>
        </button>
        <button
          className={`admin-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={20} />
          <span>Analytics</span>
        </button>
        <button
          className="admin-nav-btn ai-nav-btn"
          onClick={() => onNavigate?.('ai-management')}
        >
          <Zap size={20} />
          <span>AI</span>
        </button>
      </div>

      {/* Add Subscription Modal */}
      {showAddSubscription && (
        <div className="modal-overlay" onClick={() => setShowAddSubscription(false)}>
          <motion.div
            className="modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Add Subscription</h3>
            
            <div className="modal-field">
              <label>Select User:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Select User --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name || 'Unknown'} (@{u.username || u.telegram_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label>Plan Type:</label>
              <div className="plan-selector">
                <button
                  className={`plan-option ${selectedPlan === 'monthly' ? 'active' : ''}`}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={`plan-option ${selectedPlan === 'yearly' ? 'active' : ''}`}
                  onClick={() => setSelectedPlan('yearly')}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="modal-field">
              <label>Duration (days):</label>
              <input
                type="number"
                value={selectedDays}
                onChange={(e) => setSelectedDays(parseInt(e.target.value) || 30)}
                min="1"
                max="365"
              />
            </div>

            <div className="modal-buttons">
              <button
                className="modal-btn cancel"
                onClick={() => setShowAddSubscription(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn confirm"
                onClick={handleCreateSubscription}
                disabled={!selectedUserId}
              >
                Create Subscription
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Extend Subscription Modal */}
      {showExtendModal && (
        <div className="modal-overlay" onClick={() => setShowExtendModal(false)}>
          <motion.div
            className="modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Extend Subscription</h3>
            
            <div className="modal-field">
              <label>Additional Days:</label>
              <input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)}
                min="1"
                max="365"
              />
            </div>

            <div className="modal-buttons">
              <button
                className="modal-btn cancel"
                onClick={() => setShowExtendModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn confirm"
                onClick={handleExtendSubscription}
              >
                Extend
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Function Logs Modal */}
      {selectedFunction && (
        <div className="modal-overlay" onClick={() => setSelectedFunction(null)}>
          <motion.div
            className="modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <h3>📋 {selectedFunction} - ლოგები</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {functionLogs.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.7 }}>ლოგები არ არის</p>
              ) : (
                functionLogs.map((log) => (
                  <div 
                    key={log.id} 
                    style={{
                      padding: '10px',
                      background: log.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '8px',
                      border: `1px solid ${log.status === 'success' ? '#10b981' : '#ef4444'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong>{log.status === 'success' ? '✅' : '❌'} {log.status.toUpperCase()}</strong>
                      <span style={{ fontSize: '11px', opacity: 0.7 }}>
                        {new Date(log.created_at).toLocaleString('ka-GE')}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>
                      ⏱️ {log.response_time_ms || 'N/A'}ms | 
                      📡 {log.status_code || 'N/A'} | 
                      🔹 {log.triggered_by}
                    </div>
                    {log.error_message && (
                      <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                        ❌ {log.error_message}
                      </div>
                    )}
                    {log.response_data && (
                      <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', maxHeight: '80px', overflow: 'auto' }}>
                        📦 {JSON.stringify(log.response_data).substring(0, 200)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="modal-buttons" style={{ marginTop: '16px' }}>
              <button
                className="modal-btn cancel"
                onClick={() => setSelectedFunction(null)}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}