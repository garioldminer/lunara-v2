import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserCheck, Crown, Flame, DollarSign,
  Search, X, Eye, Clock, Calendar,
  Gem, Moon as MoonIcon, Sun, TrendingUp,
  Activity, Zap, Star, BookOpen, ChevronRight
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { 
  getAllUserAnalytics, 
  getUserAnalyticsOverview,
  getUserReadingHistory,
  getUserSessionHistory,
  type UserAnalytics as UserAnalyticsType,
  type UserAnalyticsOverview
} from '../lib/adminService';
import './UserAnalytics.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function UserAnalytics({ onNavigate }: Props) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<UserAnalyticsType[]>([]);
  const [overview, setOverview] = useState<UserAnalyticsOverview | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'premium' | 'free' | 'active'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'gems' | 'streak' | 'readings'>('newest');
  
  // Modal
  const [selectedUser, setSelectedUser] = useState<UserAnalyticsType | null>(null);
  const [readingHistory, setReadingHistory] = useState<any[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const [analyticsData, overviewData] = await Promise.all([
        getAllUserAnalytics(user.id),
        getUserAnalyticsOverview(user.id)
      ]);
      
      setAnalytics(analyticsData);
      setOverview(overviewData);
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
    }
    
    setLoading(false);
  };

  const handleViewDetails = async (userAnalytics: UserAnalyticsType) => {
    if (!user) return;
    setSelectedUser(userAnalytics);
    setLoadingDetails(true);
    
    try {
      const [readings, sessions] = await Promise.all([
        getUserReadingHistory(user.id, userAnalytics.id, 10),
        getUserSessionHistory(user.id, userAnalytics.id, 10)
      ]);
      
      setReadingHistory(readings);
      setSessionHistory(sessions);
    } catch (error) {
      console.error('❌ Error loading user details:', error);
    }
    
    setLoadingDetails(false);
  };

  // Filter & Search Logic
  const filteredAnalytics = analytics
    .filter(u => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          u.display_name?.toLowerCase().includes(query) ||
          u.username?.toLowerCase().includes(query) ||
          u.telegram_id?.toString().includes(query)
        );
      }
      return true;
    })
    .filter(u => {
      // Type filter
      if (filterType === 'premium') return u.subscription_status === 'active';
      if (filterType === 'free') return u.subscription_status !== 'active';
      if (filterType === 'active') {
        const today = new Date().toISOString().split('T')[0];
        return u.last_active_at?.startsWith(today);
      }
      return true;
    })
    .sort((a, b) => {
      // Sort
      switch (sortBy) {
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'gems': return b.gems - a.gems;
        case 'streak': return b.current_streak - a.current_streak;
        case 'readings': return b.total_readings - a.total_readings;
        default: return 0;
      }
    });

  // Helper functions
  const formatTimeAgo = (dateStr: string | null): string => {
    if (!dateStr) return 'არასდროს';
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'ახლახანს';
    if (minutes < 60) return `${minutes} წუთის წინ`;
    if (hours < 24) return `${hours} საათის წინ`;
    if (days < 7) return `${days} დღის წინ`;
    return date.toLocaleDateString('ka-GE');
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}წმ`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}წთ`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}სთ ${minutes}წთ`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysLeft = (expiresAt: string | null): number => {
    if (!expiresAt) return 0;
    const expires = new Date(expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="ua-screen">
        <div className="ua-loading">
          <div className="ua-spinner"></div>
          <p>Loading User Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ua-screen">
      {/* Header */}
      <div className="ua-header">
        <button className="ua-back-btn" onClick={() => onNavigate?.('admin')}>
          ←
        </button>
        <div className="ua-header-center">
          <Users size={24} />
          <h1>User Analytics</h1>
        </div>
        <button className="ua-refresh-btn" onClick={loadData}>
          🔄
        </button>
      </div>

      {/* Overview Cards */}
      <div className="ua-overview">
        <div className="ua-overview-card blue">
          <div className="ua-overview-icon">
            <Users size={20} />
          </div>
          <div className="ua-overview-info">
            <span className="ua-overview-number">{overview?.total_users || 0}</span>
            <span className="ua-overview-label">Total Users</span>
          </div>
        </div>

        <div className="ua-overview-card green">
          <div className="ua-overview-icon">
            <UserCheck size={20} />
          </div>
          <div className="ua-overview-info">
            <span className="ua-overview-number">{overview?.active_today || 0}</span>
            <span className="ua-overview-label">Active Today</span>
          </div>
        </div>

        <div className="ua-overview-card gold">
          <div className="ua-overview-icon">
            <Crown size={20} />
          </div>
          <div className="ua-overview-info">
            <span className="ua-overview-number">{overview?.premium_users || 0}</span>
            <span className="ua-overview-label">Premium</span>
          </div>
        </div>

        <div className="ua-overview-card orange">
          <div className="ua-overview-icon">
            <Flame size={20} />
          </div>
          <div className="ua-overview-info">
            <span className="ua-overview-number">{overview?.avg_streak || 0}</span>
            <span className="ua-overview-label">Avg Streak</span>
          </div>
        </div>

        <div className="ua-overview-card purple">
          <div className="ua-overview-icon">
            <BookOpen size={20} />
          </div>
          <div className="ua-overview-info">
            <span className="ua-overview-number">{overview?.total_readings || 0}</span>
            <span className="ua-overview-label">Readings</span>
          </div>
        </div>

        <div className="ua-overview-card emerald">
          <div className="ua-overview-icon">
            <DollarSign size={20} />
          </div>
          <div className="ua-overview-info">
            <span className="ua-overview-number">${(overview?.total_revenue || 0).toFixed(2)}</span>
            <span className="ua-overview-label">Revenue</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="ua-controls">
        <div className="ua-search-box">
          <Search size={16} className="ua-search-icon" />
          <input
            type="text"
            placeholder="Search user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ua-search-input"
          />
          {searchQuery && (
            <button className="ua-search-clear" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="ua-filters">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as any)}
            className="ua-select"
          >
            <option value="all">👥 All Users</option>
            <option value="premium">👑 Premium</option>
            <option value="free">🆓 Free</option>
            <option value="active">🟢 Active Today</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="ua-select"
          >
            <option value="newest">📅 Newest</option>
            <option value="oldest">📅 Oldest</option>
            <option value="gems">💎 Most Gems</option>
            <option value="streak">🔥 Top Streak</option>
            <option value="readings">📊 Most Readings</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="ua-results-count">
        <span>📊 {filteredAnalytics.length} user{filteredAnalytics.length !== 1 ? 's' : ''}</span>
      </div>

      {/* User List */}
      <div className="ua-user-list">
        {filteredAnalytics.length === 0 ? (
          <div className="ua-empty">
            <Users size={48} />
            <p>No users found</p>
          </div>
        ) : (
          filteredAnalytics.map((u) => (
            <motion.div
              key={u.id}
              className="ua-user-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* User Header */}
              <div className="ua-user-header">
                <div className="ua-user-avatar">
                  {u.display_name?.charAt(0).toUpperCase() || 'U'}
                  {u.subscription_status === 'active' && (
                    <div className="ua-premium-badge">
                      <Crown size={8} />
                    </div>
                  )}
                </div>
                <div className="ua-user-info">
                  <h3>{u.display_name || 'Unknown'}</h3>
                  <p>@{u.username || u.telegram_id}</p>
                </div>
                <div className="ua-user-badges">
                  {u.onboarding_completed ? (
                    <span className="ua-badge green">✅</span>
                  ) : (
                    <span className="ua-badge red">❌</span>
                  )}
                  {u.subscription_status === 'active' && (
                    <span className="ua-badge gold">👑</span>
                  )}
                </div>
              </div>

              {/* Big Three */}
              {(u.sun_sign || u.moon_sign || u.rising_sign) && (
                <div className="ua-big-three">
                  {u.sun_sign && (
                    <span className="ua-sign">
                      ☀️ <strong>{u.sun_sign}</strong>
                    </span>
                  )}
                  {u.moon_sign && (
                    <span className="ua-sign">
                      🌙 <strong>{u.moon_sign}</strong>
                    </span>
                  )}
                  {u.rising_sign && (
                    <span className="ua-sign">
                      ⬆️ <strong>{u.rising_sign}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Stats Grid */}
              <div className="ua-stats-grid">
                <div className="ua-stat">
                  <Gem size={12} />
                  <span>{u.gems?.toLocaleString()} 💎</span>
                </div>
                <div className="ua-stat">
                  <Flame size={12} />
                  <span>{u.current_streak}d streak</span>
                </div>
                <div className="ua-stat">
                  <BookOpen size={12} />
                  <span>{u.total_readings} reads</span>
                </div>
                <div className="ua-stat">
                  <Clock size={12} />
                  <span>{formatTimeAgo(u.last_active_at)}</span>
                </div>
              </div>

              {/* Subscription Info */}
              {u.subscription_status === 'active' && (
                <div className="ua-subscription-info">
                  <Crown size={12} />
                  <span>
                    {u.subscription_plan === 'yearly' ? 'Yearly' : 'Monthly'} • 
                    {getDaysLeft(u.subscription_expires_at)} days left
                  </span>
                </div>
              )}

              {/* Session Duration */}
              {u.total_session_time > 0 && (
                <div className="ua-session-info">
                  <Activity size={12} />
                  <span>
                    Total: {formatDuration(u.total_session_time)}
                    {u.last_session_duration && ` • Last: ${formatDuration(u.last_session_duration)}`}
                  </span>
                </div>
              )}

              {/* View Details Button */}
              <button 
                className="ua-view-details-btn"
                onClick={() => handleViewDetails(u)}
              >
                <Eye size={14} />
                <span>View Details</span>
                <ChevronRight size={14} />
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            className="ua-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUser(null)}
          >
            <motion.div 
              className="ua-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="ua-modal-header">
                <div className="ua-modal-avatar">
                  {selectedUser.display_name?.charAt(0).toUpperCase() || 'U'}
                  {selectedUser.subscription_status === 'active' && (
                    <div className="ua-premium-badge large">
                      <Crown size={12} />
                    </div>
                  )}
                </div>
                <div className="ua-modal-user-info">
                  <h2>{selectedUser.display_name || 'Unknown'}</h2>
                  <p>@{selectedUser.username || selectedUser.telegram_id}</p>
                </div>
                <button className="ua-modal-close" onClick={() => setSelectedUser(null)}>
                  <X size={20} />
                </button>
              </div>

              {loadingDetails ? (
                <div className="ua-modal-loading">
                  <div className="ua-spinner"></div>
                  <p>Loading details...</p>
                </div>
              ) : (
                <div className="ua-modal-content">
                  {/* Basic Info */}
                  <div className="ua-section">
                    <h3>📋 Basic Information</h3>
                    <div className="ua-info-grid">
                      <div className="ua-info-item">
                        <span className="ua-info-label">🆔 User ID</span>
                        <span className="ua-info-value mono">{selectedUser.id.substring(0, 8)}...</span>
                      </div>
                      <div className="ua-info-item">
                        <span className="ua-info-label">📱 Telegram ID</span>
                        <span className="ua-info-value">{selectedUser.telegram_id}</span>
                      </div>
                      <div className="ua-info-item">
                        <span className="ua-info-label">📅 Registered</span>
                        <span className="ua-info-value">{formatDate(selectedUser.created_at)}</span>
                      </div>
                      <div className="ua-info-item">
                        <span className="ua-info-label">🕐 Last Active</span>
                        <span className="ua-info-value">{formatTimeAgo(selectedUser.last_active_at)}</span>
                      </div>
                      <div className="ua-info-item">
                        <span className="ua-info-label">⏱️ Total Time</span>
                        <span className="ua-info-value">{formatDuration(selectedUser.total_session_time)}</span>
                      </div>
                      <div className="ua-info-item">
                        <span className="ua-info-label">✅ Onboarding</span>
                        <span className="ua-info-value">
                          {selectedUser.onboarding_completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Astrological Profile */}
                  <div className="ua-section">
                    <h3>♈ Astrological Profile</h3>
                    <div className="ua-astro-grid">
                      {selectedUser.sun_sign && (
                        <div className="ua-astro-card sun">
                          <Sun size={20} />
                          <div>
                            <span className="ua-astro-label">Sun Sign</span>
                            <span className="ua-astro-value">{selectedUser.sun_sign}</span>
                          </div>
                        </div>
                      )}
                      {selectedUser.moon_sign && (
                        <div className="ua-astro-card moon">
                          <MoonIcon size={20} />
                          <div>
                            <span className="ua-astro-label">Moon Sign</span>
                            <span className="ua-astro-value">{selectedUser.moon_sign}</span>
                          </div>
                        </div>
                      )}
                      {selectedUser.rising_sign && (
                        <div className="ua-astro-card rising">
                          <TrendingUp size={20} />
                          <div>
                            <span className="ua-astro-label">Rising Sign</span>
                            <span className="ua-astro-value">{selectedUser.rising_sign}</span>
                          </div>
                        </div>
                      )}
                      {!selectedUser.sun_sign && !selectedUser.moon_sign && !selectedUser.rising_sign && (
                        <div className="ua-empty-section">
                          <p>No astrological data yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Status */}
                  <div className="ua-section">
                    <h3>💰 Financial Status</h3>
                    <div className="ua-financial-grid">
                      <div className="ua-financial-card">
                        <Gem size={20} />
                        <div>
                          <span className="ua-financial-label">Gems</span>
                          <span className="ua-financial-value">{selectedUser.gems?.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="ua-financial-card">
                        <Crown size={20} />
                        <div>
                          <span className="ua-financial-label">Subscription</span>
                          <span className="ua-financial-value">
                            {selectedUser.subscription_status === 'active' 
                              ? `${selectedUser.subscription_plan === 'yearly' ? 'Yearly' : 'Monthly'}`
                              : 'Free'}
                          </span>
                        </div>
                      </div>
                      {selectedUser.subscription_status === 'active' && (
                        <>
                          <div className="ua-financial-card">
                            <Calendar size={20} />
                            <div>
                              <span className="ua-financial-label">Expires</span>
                              <span className="ua-financial-value">
                                {selectedUser.subscription_expires_at 
                                  ? formatDate(selectedUser.subscription_expires_at)
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="ua-financial-card highlight">
                            <Clock size={20} />
                            <div>
                              <span className="ua-financial-label">Days Left</span>
                              <span className="ua-financial-value">
                                {getDaysLeft(selectedUser.subscription_expires_at)} days
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="ua-section">
                    <h3>🎫 Credits</h3>
                    <div className="ua-credits-grid">
                      <div className="ua-credit-item">
                        <span>✝️ Celtic Cross</span>
                        <span className="ua-credit-value">{selectedUser.celtic_cross_credits}</span>
                      </div>
                      <div className="ua-credit-item">
                        <span>🐎 Horseshoe</span>
                        <span className="ua-credit-value">{selectedUser.horseshoe_credits}</span>
                      </div>
                      <div className="ua-credit-item">
                        <span>❤️ Relationship</span>
                        <span className="ua-credit-value">{selectedUser.relationship_credits}</span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="ua-section">
                    <h3>📈 Activity Stats</h3>
                    <div className="ua-activity-grid">
                      <div className="ua-activity-card">
                        <Flame size={24} />
                        <div>
                          <span className="ua-activity-value">{selectedUser.current_streak}</span>
                          <span className="ua-activity-label">Current Streak</span>
                        </div>
                      </div>
                      <div className="ua-activity-card">
                        <Star size={24} />
                        <div>
                          <span className="ua-activity-value">{selectedUser.longest_streak}</span>
                          <span className="ua-activity-label">Longest Streak</span>
                        </div>
                      </div>
                      <div className="ua-activity-card">
                        <BookOpen size={24} />
                        <div>
                          <span className="ua-activity-value">{selectedUser.total_readings}</span>
                          <span className="ua-activity-label">Total Readings</span>
                        </div>
                      </div>
                      <div className="ua-activity-card">
                        <Zap size={24} />
                        <div>
                          <span className="ua-activity-value">{selectedUser.today_readings}</span>
                          <span className="ua-activity-label">Today</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reading History */}
                  <div className="ua-section">
                    <h3>📚 Recent Readings ({readingHistory.length})</h3>
                    {readingHistory.length === 0 ? (
                      <div className="ua-empty-section">
                        <p>No readings yet</p>
                      </div>
                    ) : (
                      <div className="ua-history-list">
                        {readingHistory.map((reading, i) => (
                          <div key={i} className="ua-history-item">
                            <div className="ua-history-icon">
                              <BookOpen size={14} />
                            </div>
                            <div className="ua-history-info">
                              <span className="ua-history-type">{reading.reading_type}</span>
                              <span className="ua-history-date">
                                {new Date(reading.created_at).toLocaleString('ka-GE')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Session History */}
                  <div className="ua-section">
                    <h3>⏱️ Session History ({sessionHistory.length})</h3>
                    {sessionHistory.length === 0 ? (
                      <div className="ua-empty-section">
                        <p>No sessions recorded yet</p>
                      </div>
                    ) : (
                      <div className="ua-history-list">
                        {sessionHistory.map((session, i) => (
                          <div key={i} className="ua-history-item">
                            <div className="ua-history-icon">
                              <Clock size={14} />
                            </div>
                            <div className="ua-history-info">
                              <span className="ua-history-type">
                                {formatDuration(session.duration_seconds || 0)}
                              </span>
                              <span className="ua-history-date">
                                {new Date(session.started_at).toLocaleString('ka-GE')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="ua-modal-footer">
                <button 
                  className="ua-modal-close-btn"
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}