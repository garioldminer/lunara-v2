import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Plus, Trash2, RefreshCw, Crown, ShieldAlert, Calendar, Clock, Zap } from 'lucide-react';
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
  extendSubscription
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
  const [activeTab, setActiveTab] = useState<'credits' | 'subscriptions' | 'ai'>('credits');
  
  // Subscription management states
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedDays, setSelectedDays] = useState(30);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingSubId, setExtendingSubId] = useState<string>('');
  const [extendDays, setExtendDays] = useState(30);

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
    const [usersData, subsData] = await Promise.all([
      getAllUsersWithCredits(user.id),
      getAllSubscriptions(user.id)
    ]);
    setUsers(usersData);
    setSubscriptions(subsData);
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

  // ✅ AI Tab-ზე დაჭერისას - გადავდივართ ცალკე ეკრანზე
  const handleTabClick = (tab: 'credits' | 'subscriptions' | 'ai') => {
    if (tab === 'ai') {
      onNavigate?.('ai-management');
      return;
    }
    setActiveTab(tab);
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

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'credits' ? 'active' : ''}`}
          onClick={() => handleTabClick('credits')}
        >
          <span>💎</span>
          <span>Credits</span>
        </button>
        <button
          className={`admin-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => handleTabClick('subscriptions')}
        >
          <span>👑</span>
          <span>Subscriptions</span>
        </button>
        {/* ✅ ახალი AI Management ტაბი */}
        <button
          className="admin-tab ai-tab"
          onClick={() => handleTabClick('ai')}
        >
          <Zap size={16} />
          <span>🤖 AI</span>
        </button>
      </div>

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

          {/* Add Subscription Button */}
          <button 
            className="add-subscription-btn"
            onClick={() => setShowAddSubscription(true)}
          >
            <Plus size={16} />
            <span>Add Subscription</span>
          </button>

          {/* Subscriptions List */}
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
    </div>
  );
}