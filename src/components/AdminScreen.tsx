import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Plus, Minus, Trash2, RefreshCw } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { isAdmin, getAllUsersWithCredits, updateUserCredits, addCreditsToUser, deleteUserCredits } from '../lib/adminService';
import { PremiumFeatureId } from '../lib/premiumService';
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
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<string>('');
  const [newAmount, setNewAmount] = useState(0);

  useEffect(() => {
    if (user) {
      setIsUserAdmin(isAdmin(user.id));
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllUsersWithCredits();
    setUsers(data);
    setLoading(false);
  };

  const handleUpdateCredits = async (userId: string, featureId: string) => {
    const success = await updateUserCredits(userId, featureId, newAmount);
    if (success) {
      await loadUsers();
      setEditingUser(null);
      setNewAmount(0);
    }
  };

  const handleAddCredits = async (userId: string, featureId: string, amount: number) => {
    const success = await addCreditsToUser(userId, featureId, amount);
    if (success) {
      await loadUsers();
    }
  };

  const handleDeleteCredits = async (userId: string, featureId: string) => {
    if (confirm('Are you sure you want to delete these credits?')) {
      const success = await deleteUserCredits(userId, featureId);
      if (success) {
        await loadUsers();
      }
    }
  };

  if (!isUserAdmin) {
    return (
      <div className="admin-screen">
        <div className="admin-error">
          <h2>⛔ Access Denied</h2>
          <p>You do not have permission to access this page.</p>
          <button onClick={() => onNavigate?.('home')}>Go Home</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-screen">
        <div className="admin-loading">
          <RefreshCw size={32} className="spin" />
          <p>Loading users...</p>
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
        {users.map((user) => (
          <motion.div
            key={user.id}
            className="admin-user-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="user-info">
              <div className="user-avatar">
                {user.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <h3>{user.display_name || 'Unknown'}</h3>
                <p>@{user.username || user.telegram_id}</p>
              </div>
            </div>

            <div className="user-credits">
              {['celtic_cross', 'horseshoe', 'relationship'].map((featureId) => {
                const credit = user.credits.find(c => c.feature_id === featureId);
                const amount = credit?.credits || 0;

                return (
                  <div key={featureId} className="credit-item">
                    <span className="credit-label">
                      {featureId === 'celtic_cross' && '✝️ Celtic'}
                      {featureId === 'horseshoe' && '🐎 Horseshoe'}
                      {featureId === 'relationship' && '❤️ Relationship'}
                    </span>

                    {editingUser === user.id && editingFeature === featureId ? (
                      <div className="credit-edit">
                        <input
                          type="number"
                          value={newAmount}
                          onChange={(e) => setNewAmount(parseInt(e.target.value) || 0)}
                          min="0"
                        />
                        <button
                          className="save-btn"
                          onClick={() => handleUpdateCredits(user.id, featureId)}
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
                            onClick={() => handleAddCredits(user.id, featureId, 1)}
                            title="Add 1"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            className="add-btn"
                            onClick={() => handleAddCredits(user.id, featureId, 5)}
                            title="Add 5"
                          >
                            +5
                          </button>
                          <button
                            className="edit-btn"
                            onClick={() => {
                              setEditingUser(user.id);
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
                              onClick={() => handleDeleteCredits(user.id, featureId)}
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