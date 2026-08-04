import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Sparkles, LayoutGrid, X, Heart, Share2, Bug, RefreshCw, Trash2, Shield, Copy, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getUserReadings } from '../lib/readingService';
import { isAdmin } from '../lib/adminService';
import { tarotCards } from '../data/tarotCards';
import './ReadingHistoryScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

interface ReadingCard {
  id: number;
  name: string;
  is_reversed: boolean;
  position?: string;
}

interface Reading {
  id: string;
  user_id: string;
  reading_type: 'daily' | 'three-card' | 'celtic-cross';
  question?: string;
  cards: ReadingCard[];
  created_at: string;
}

// Debug Log Type
type LogType = 'info' | 'success' | 'error' | 'warning' | 'api' | 'db' | 'ui';

interface DebugLog {
  id: number;
  timestamp: string;
  type: LogType;
  message: string;
  data?: any;
}

const logColors: Record<LogType, string> = {
  info: '#60a5fa',
  success: '#10b981',
  error: '#ef4444',
  warning: '#fbbf24',
  api: '#a78bfa',
  db: '#f472b6',
  ui: '#f59e0b'
};

const logIcons: Record<LogType, string> = {
  info: 'ℹ️',
  success: '✅',
  error: '❌',
  warning: '⚠️',
  api: '🌐',
  db: '🗄️',
  ui: '🎯'
};

export default function ReadingHistoryScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'daily' | 'three-card'>('all');
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  // Debug Panel States
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [logFilter, setLogFilter] = useState<LogType | 'all'>('all');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Helper: Add Debug Log
  const addLog = (type: LogType, message: string, data?: any) => {
    const log: DebugLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message,
      data
    };
    setDebugLogs(prev => [log, ...prev].slice(0, 100));
    console.log(`[${type.toUpperCase()}] ${message}`, data || '');
  };

  useEffect(() => {
    addLog('info', 'ReadingHistoryScreen mounted');
    
    if (user) {
      addLog('success', 'User found in context', { userId: user.id, name: user.display_name });
      
      isAdmin(user.id).then(admin => {
        setIsUserAdmin(admin);
        addLog('info', 'Admin check completed', { isAdmin: admin });
      }).catch(err => {
        addLog('error', 'Admin check failed', err);
      });
      
      loadReadings();
      loadBookmarks();
    } else {
      addLog('error', 'No user found in context');
      setLoading(false);
    }
  }, [user]);

  const loadReadings = async () => {
    if (!user) {
      addLog('warning', 'loadReadings called without user');
      return;
    }
    
    setLoading(true);
    addLog('api', 'Fetching readings from Supabase', { userId: user.id, limit: 100 });
    
    try {
      const startTime = Date.now();
      const data = await getUserReadings(user.id, 100);
      const duration = Date.now() - startTime;
      
      addLog('db', 'Readings fetched successfully', { 
        count: data.length, 
        duration: `${duration}ms`,
        sample: data.slice(0, 2)
      });
      
      setReadings(data);
    } catch (error: any) {
      addLog('error', 'Failed to load readings', { 
        error: error.message, 
        stack: error.stack 
      });
    } finally {
      setLoading(false);
      addLog('info', 'Loading finished', { finalCount: readings.length });
    }
  };

  const loadBookmarks = () => {
    addLog('info', 'Loading bookmarks from localStorage');
    const stored = localStorage.getItem('bookmarked_readings');
    if (stored) {
      const parsed = JSON.parse(stored);
      setBookmarkedIds(new Set(parsed));
      addLog('success', 'Bookmarks loaded', { count: parsed.length });
    } else {
      addLog('info', 'No bookmarks found in localStorage');
    }
  };

  const toggleBookmark = (readingId: string) => {
    addLog('ui', 'Toggling bookmark', { readingId, currentBookmarks: [...bookmarkedIds] });
    const newSet = new Set(bookmarkedIds);
    if (newSet.has(readingId)) {
      newSet.delete(readingId);
      addLog('info', 'Bookmark removed', { readingId });
    } else {
      newSet.add(readingId);
      addLog('success', 'Bookmark added', { readingId });
    }
    setBookmarkedIds(newSet);
    localStorage.setItem('bookmarked_readings', JSON.stringify([...newSet]));
  };

  const filteredReadings = readings.filter(r => {
    if (filter === 'all') return true;
    return r.reading_type === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getReadingTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Sparkles size={16} />;
      case 'three-card': return <LayoutGrid size={16} />;
      default: return <Sparkles size={16} />;
    }
  };

  const getReadingTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'Daily Card';
      case 'three-card': return '3-Card Reading';
      default: return 'Reading';
    }
  };

  const getCardImage = (cardName: string) => {
    const card = tarotCards.find(c => c.name.toLowerCase() === cardName.toLowerCase());
    return card?.image_url || null;
  };

  const handleShare = (reading: Reading) => {
    addLog('ui', 'Share button clicked', { readingId: reading.id });
    const text = `My ${getReadingTypeLabel(reading.reading_type)}: ${reading.cards.map(c => c.name).join(', ')}`;
    if (navigator.share) {
      navigator.share({ title: 'My Tarot Reading', text });
      addLog('success', 'Share dialog opened');
    } else {
      navigator.clipboard.writeText(text);
      addLog('success', 'Copied to clipboard', { text });
      alert('Copied to clipboard!');
    }
  };

  const copyAllLogs = () => {
    const text = debugLogs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}${l.data ? '\n' + JSON.stringify(l.data, null, 2) : ''}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addLog('info', 'All logs copied to clipboard');
  };

  const clearLogs = () => {
    setDebugLogs([]);
    addLog('info', 'Debug logs cleared');
  };

  const testSupabaseConnection = async () => {
    addLog('api', 'Testing Supabase connection...');
    try {
      const { supabase } = await import('../lib/supabase');
      if (!supabase) {
        addLog('error', 'Supabase client is null');
        return;
      }
      const startTime = Date.now();
      const { data, error } = await supabase.from('users').select('id').limit(1);
      const duration = Date.now() - startTime;
      
      if (error) {
        addLog('error', 'Supabase connection failed', { error: error.message, duration: `${duration}ms` });
      } else {
        addLog('success', 'Supabase connection successful', { data, duration: `${duration}ms` });
      }
    } catch (err: any) {
      addLog('error', 'Supabase test failed', { error: err.message });
    }
  };

  const filteredLogs = logFilter === 'all' ? debugLogs : debugLogs.filter(l => l.type === logFilter);

  return (
    <div className="reading-history-screen">
      {/* Header */}
      <div className="rh-header">
        {onNavigate && (
          <button className="rh-back-btn" onClick={() => { addLog('ui', 'Navigate back to home'); onNavigate('home'); }}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="rh-header-center">
          <div className="rh-ornament">✦</div>
          <h1 className="rh-title">Reading History</h1>
          <div className="rh-ornament">✦</div>
        </div>
        <div className="rh-header-spacer" />
      </div>

      {/* Filter Tabs */}
      <div className="rh-filter-tabs">
        <button className={`rh-filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => { setFilter('all'); addLog('ui', 'Filter changed to: all'); }}>
          All ({readings.length})
        </button>
        <button className={`rh-filter-tab ${filter === 'daily' ? 'active' : ''}`} onClick={() => { setFilter('daily'); addLog('ui', 'Filter changed to: daily'); }}>
          Daily ({readings.filter(r => r.reading_type === 'daily').length})
        </button>
        <button className={`rh-filter-tab ${filter === 'three-card' ? 'active' : ''}`} onClick={() => { setFilter('three-card'); addLog('ui', 'Filter changed to: three-card'); }}>
          3-Card ({readings.filter(r => r.reading_type === 'three-card').length})
        </button>
      </div>

      {/* Content */}
      <div className="rh-content">
        {loading ? (
          <div className="rh-loading">
            <div className="rh-loading-spinner"></div>
            <p>Loading your readings...</p>
          </div>
        ) : filteredReadings.length === 0 ? (
          <div className="rh-empty">
            <div className="rh-empty-icon">📖</div>
            <h3 className="rh-empty-title">No readings yet</h3>
            <p className="rh-empty-text">
              {filter === 'all' ? "Start your journey by drawing your first card!" : `No ${getReadingTypeLabel(filter).toLowerCase()} readings found.`}
            </p>
            {onNavigate && (
              <button className="rh-empty-btn" onClick={() => { addLog('ui', 'Navigate to daily-card'); onNavigate('daily-card'); }}>
                Draw Your First Card
              </button>
            )}
          </div>
        ) : (
          <div className="rh-readings-list">
            {filteredReadings.map((reading, index) => (
              <motion.div
                key={reading.id}
                className="rh-reading-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => { setSelectedReading(reading); addLog('ui', 'Reading selected', { id: reading.id, type: reading.reading_type }); }}
              >
                <div className="rh-card-header">
                  <div className="rh-card-type">
                    <span className="rh-type-icon">{getReadingTypeIcon(reading.reading_type)}</span>
                    <span className="rh-type-label">{getReadingTypeLabel(reading.reading_type)}</span>
                  </div>
                  <div className="rh-card-date">
                    <Calendar size={12} />
                    <span>{formatDate(reading.created_at)}</span>
                  </div>
                </div>

                {reading.question && (
                  <div className="rh-card-question">
                    <p className="rh-question-text">"{reading.question}"</p>
                  </div>
                )}

                <div className="rh-cards-preview">
                  {reading.cards.map((card, idx) => {
                    const cardImage = getCardImage(card.name);
                    return (
                      <div key={idx} className={`rh-mini-card ${card.is_reversed ? 'reversed' : ''}`}>
                        {cardImage ? (
                          <img src={cardImage} alt={card.name} className="rh-mini-card-image" />
                        ) : (
                          <div className="rh-mini-card-placeholder">
                            <span className="rh-mini-card-name">{card.name}</span>
                          </div>
                        )}
                        <div className="rh-mini-card-info">
                          <span className="rh-mini-card-name">{card.name}</span>
                          {card.is_reversed && <span className="rh-mini-reversed">R</span>}
                        </div>
                        {card.position && <span className="rh-mini-position">{card.position}</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="rh-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`rh-action-btn ${bookmarkedIds.has(reading.id) ? 'bookmarked' : ''}`}
                    onClick={() => toggleBookmark(reading.id)}
                  >
                    <Heart size={16} fill={bookmarkedIds.has(reading.id) ? '#C5A059' : 'none'} />
                  </button>
                  <button className="rh-action-btn" onClick={() => handleShare(reading)}>
                    <Share2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 🐛 SELF-CONTAINED DEBUG PANEL */}
      {isUserAdmin && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, fontFamily: 'monospace' }}>
          <button 
            onClick={() => setShowDebug(!showDebug)}
            style={{
              width: '100%',
              padding: '10px',
              background: showDebug ? '#ef4444' : 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
              color: '#fff',
              border: 'none',
              borderTop: '2px solid #C5A059',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '1px'
            }}
          >
            <Bug size={14} />
            {showDebug ? 'HIDE DEBUG' : `DEBUG (${debugLogs.filter(l => l.type === 'error').length > 0 ? `${debugLogs.filter(l => l.type === 'error').length} ERR` : `${debugLogs.length} LOGS`})`}
          </button>

          <AnimatePresence>
            {showDebug && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: 'rgba(10, 6, 0, 0.98)',
                  backdropFilter: 'blur(10px)',
                  borderTop: '2px solid #C5A059',
                  maxHeight: '70vh',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Header */}
                <div style={{ padding: '12px', borderBottom: '1px solid rgba(197, 160, 89, 0.3)', background: 'rgba(197, 160, 89, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5A059', fontWeight: 'bold', fontSize: '13px' }}>
                      <Shield size={16} />
                      ADMIN DEBUG CONSOLE
                    </div>
                    <button 
                      onClick={() => setShowDebug(false)}
                      style={{ background: 'none', border: 'none', color: '#C5A059', cursor: 'pointer', padding: '4px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Status Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', marginBottom: '8px' }}>
                    <div> User: <span style={{ color: '#10b981' }}>{user?.id?.substring(0, 8) || 'NULL'}...</span></div>
                    <div>🔐 Admin: <span style={{ color: '#10b981' }}>YES</span></div>
                    <div>⏳ Loading: <span style={{ color: loading ? '#fbbf24' : '#10b981' }}>{loading ? 'YES' : 'NO'}</span></div>
                    <div>📚 Total: <span style={{ color: '#60a5fa' }}>{readings.length}</span></div>
                    <div>🔍 Filtered: <span style={{ color: '#60a5fa' }}>{filteredReadings.length}</span></div>
                    <div>❤️ Bookmarked: <span style={{ color: '#f472b6' }}>{bookmarkedIds.size}</span></div>
                    <div>⚙️ Filter: <span style={{ color: '#fbbf24' }}>{filter}</span></div>
                    <div>💾 LocalStorage: <span style={{ color: '#a78bfa' }}>{localStorage.getItem('bookmarked_readings') ? 'YES' : 'NO'}</span></div>
                  </div>

                  {/* Log Filter Tabs */}
                  <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '8px' }}>
                    {(['all', 'info', 'success', 'error', 'warning', 'api', 'db', 'ui'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setLogFilter(type)}
                        style={{
                          padding: '4px 8px',
                          background: logFilter === type ? (type === 'all' ? '#C5A059' : logColors[type]) : 'rgba(255,255,255,0.1)',
                          color: logFilter === type ? '#000' : '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          textTransform: 'uppercase'
                        }}
                      >
                        {type} ({type === 'all' ? debugLogs.length : debugLogs.filter(l => l.type === type).length})
                      </button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={copyAllLogs}
                      style={{ flex: 1, padding: '6px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      {copied ? <><CheckCircle size={10} /> Copied!</> : <><Copy size={10} /> Copy All</>}
                    </button>
                    <button 
                      onClick={clearLogs}
                      style={{ flex: 1, padding: '6px', background: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Trash2 size={10} /> Clear
                    </button>
                    <button 
                      onClick={loadReadings}
                      style={{ flex: 1, padding: '6px', background: '#C5A059', color: '#0a0600', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={10} /> Refresh
                    </button>
                    <button 
                      onClick={testSupabaseConnection}
                      style={{ flex: 1, padding: '6px', background: '#a78bfa', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      🌐 Test API
                    </button>
                  </div>
                </div>

                {/* Logs List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                  {filteredLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '11px' }}>
                      No logs yet...
                    </div>
                  ) : (
                    filteredLogs.map(log => (
                      <div 
                        key={log.id}
                        style={{ 
                          padding: '8px', 
                          marginBottom: '4px', 
                          background: 'rgba(255,255,255,0.03)', 
                          borderLeft: `3px solid ${logColors[log.type]}`,
                          borderRadius: '4px',
                          cursor: log.data ? 'pointer' : 'default'
                        }}
                        onClick={() => log.data && setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '10px' }}>
                          <span style={{ flexShrink: 0 }}>{logIcons[log.type]}</span>
                          <span style={{ color: '#666', flexShrink: 0, fontSize: '9px' }}>{log.timestamp}</span>
                          <span style={{ color: logColors[log.type], fontWeight: 'bold', flexShrink: 0, fontSize: '9px', textTransform: 'uppercase' }}>
                            [{log.type}]
                          </span>
                          <span style={{ color: '#e2e8f0', flex: 1, lineHeight: 1.4 }}>
                            {log.message}
                          </span>
                          {log.data && (
                            <span style={{ flexShrink: 0, color: '#666' }}>
                              {expandedLog === log.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </span>
                          )}
                        </div>
                        
                        {log.data && expandedLog === log.id && (
                          <div style={{ 
                            marginTop: '6px', 
                            padding: '6px', 
                            background: 'rgba(0,0,0,0.5)', 
                            borderRadius: '4px', 
                            fontSize: '9px', 
                            color: '#a78bfa',
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}>
                            {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReading && (
          <motion.div
            className="rh-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setSelectedReading(null); addLog('ui', 'Modal closed'); }}
          >
            <motion.div
              className="rh-modal-content"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rh-modal-header">
                <div className="rh-modal-type">
                  {getReadingTypeIcon(selectedReading.reading_type)}
                  <span>{getReadingTypeLabel(selectedReading.reading_type)}</span>
                </div>
                <button className="rh-modal-close" onClick={() => { setSelectedReading(null); addLog('ui', 'Modal closed via X button'); }}>
                  <X size={20} />
                </button>
              </div>

              <div className="rh-modal-date">
                <Calendar size={14} />
                <span>{new Date(selectedReading.created_at).toLocaleString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}</span>
              </div>

              {selectedReading.question && (
                <div className="rh-modal-question">
                  <p>"{selectedReading.question}"</p>
                </div>
              )}

              <div className="rh-modal-cards">
                {selectedReading.cards.map((card, idx) => {
                  const cardImage = getCardImage(card.name);
                  return (
                    <div key={idx} className={`rh-detail-card ${card.is_reversed ? 'reversed' : ''}`}>
                      {cardImage ? (
                        <img src={cardImage} alt={card.name} className="rh-detail-card-image" />
                      ) : (
                        <div className="rh-detail-card-placeholder">
                          <span>{card.name}</span>
                        </div>
                      )}
                      <div className="rh-detail-card-info">
                        <h4>{card.name}</h4>
                        {card.is_reversed && <span className="rh-detail-reversed">Reversed</span>}
                        {card.position && <span className="rh-detail-position">{card.position}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rh-modal-actions">
                <button
                  className={`rh-modal-action-btn ${bookmarkedIds.has(selectedReading.id) ? 'bookmarked' : ''}`}
                  onClick={() => toggleBookmark(selectedReading.id)}
                >
                  <Heart size={18} fill={bookmarkedIds.has(selectedReading.id) ? '#C5A059' : 'none'} />
                  <span>{bookmarkedIds.has(selectedReading.id) ? 'Saved' : 'Save'}</span>
                </button>
                <button className="rh-modal-action-btn" onClick={() => handleShare(selectedReading)}>
                  <Share2 size={18} />
                  <span>Share</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}