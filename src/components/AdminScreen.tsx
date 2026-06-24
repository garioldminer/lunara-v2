import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Plus, Trash2, RefreshCw, ShieldAlert } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { isAdmin, getAllUsersWithCredits, updateUserCredits, addCreditsToUser, deleteUserCredits } from '../lib/adminService';
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

export default function AdminScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<string>('');
  const [newAmount, setNewAmount] = useState(0);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const admin = await isAdmin(user.id);
        setIsUserAdmin(admin);
        if (admin) {
          loadUsers();
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

  const loadUsers = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getAllUsersWithCredits(user.id);
    setUsers(data);
    setLoading(false);
  };

  const handleUpdateCredits = async (targetUserId: string, featureId: string) => {
    if (!user) return;
    const success = await updateUserCredits(user.id, targetUserId, featureId, newAmount);
    if (success) {
      await loadUsers();
      setEditingUser(null);
      setNewAmount(0);
    }
  };

  const handleAddCredits = async (targetUserId: string, featureId: string, amount: number) => {
    if (!user) return;
    const success = await addCreditsToUser(user.id, targetUserId, featureId, amount);
    if (success) {
      await loadUsers();
    }
  };

  const handleDeleteCredits = async (targetUserId: string, featureId: string) => {
    if (!user) return;
    if (confirm('Are you sure you want to delete these credits?')) {
      const success = await deleteUserCredits(user.id, targetUserId, featureId);
      if (success) {
        await loadUsers();
      }
    }
  };

  // ✅ ჯერ არ ვიცით admin თუ არა
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

  // ✅ არ არის admin - წვდომა აკრძალულია
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
        <button className="admin-refresh-btn" onClick={loadUsers}>
          <RefreshCw size={20} />
        </button>
      </div>

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
    </div>
  );
}