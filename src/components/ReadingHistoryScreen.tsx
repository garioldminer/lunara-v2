import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Sparkles, LayoutGrid, X, Heart, Share2, Bug, RefreshCw, Trash2, Shield } from 'lucide-react';
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

export default function ReadingHistoryScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'daily' | 'three-card'>('all');
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  
  // 🐛 Debug States - მხოლოდ ადმინისტრატორისთვის
  const [showDebug, setShowDebug] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      // შევამოწმოთ არის თუ არა მომხმარებელი ადმინი
      isAdmin(user.id).then(admin => {
        setIsUserAdmin(admin);
        console.log('🔐 Admin status:', admin);
      }).catch(err => {
        console.error('❌ Admin check failed:', err);
      });
      
      loadReadings();
      loadBookmarks();
    } else {
      setLoading(false);
      setDebugError('No user found in context');
    }
  }, [user]);

  const loadReadings = async () => {
    if (!user) return;
    setLoading(true);
    setDebugError(null);
    try {
      console.log('🔍 Fetching readings for user:', user.id);
      const data = await getUserReadings(user.id, 100);
      console.log('✅ Readings fetched:', data.length);
      setReadings(data);
    } catch (error: any) {
      console.error('❌ Failed to load readings:', error);
      setDebugError(error.message || 'Failed to fetch readings');
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = () => {
    const stored = localStorage.getItem('bookmarked_readings');
    if (stored) {
      setBookmarkedIds(new Set(JSON.parse(stored)));
    }
  };

  const toggleBookmark = (readingId: string) => {
    const newSet = new Set(bookmarkedIds);
    if (newSet.has(readingId)) {
      newSet.delete(readingId);
    } else {
      newSet.add(readingId);
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
    const text = `My ${getReadingTypeLabel(reading.reading_type)}: ${reading.cards.map(c => c.name).join(', ')}`;
    if (navigator.share) {
      navigator.share({ title: 'My Tarot Reading', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  const clearDebugData = () => {
    localStorage.removeItem('bookmarked_readings');
    setBookmarkedIds(new Set());
    setReadings([]);
    loadReadings();
  };

  return (
    <div className="reading-history-screen">
      {/* Header */}
      <div className="rh-header">
        {onNavigate && (
          <button className="rh-back-btn" onClick={() => onNavigate('home')}>
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
        <button className={`rh-filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All ({readings.length})
        </button>
        <button className={`rh-filter-tab ${filter === 'daily' ? 'active' : ''}`} onClick={() => setFilter('daily')}>
          Daily ({readings.filter(r => r.reading_type === 'daily').length})
        </button>
        <button className={`rh-filter-tab ${filter === 'three-card' ? 'active' : ''}`} onClick={() => setFilter('three-card')}>
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
              <button className="rh-empty-btn" onClick={() => onNavigate('daily-card')}>
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
                onClick={() => setSelectedReading(reading)}
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

      {/* 🐛 ADMIN-ONLY DEBUG PANEL */}
      {isUserAdmin && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}>
          <button 
            onClick={() => setShowDebug(!showDebug)}
            style={{
              width: '100%',
              padding: '8px',
              background: showDebug ? '#ef4444' : 'rgba(0,0,0,0.8)',
              color: '#fff',
              border: 'none',
              borderTop: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <Bug size={14} />
            {showDebug ? 'HIDE DEBUG' : 'SHOW DEBUG PANEL'}
          </button>

          <AnimatePresence>
            {showDebug && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  background: 'rgba(15, 12, 8, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderTop: '2px solid #C5A059',
                  padding: '16px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                  maxHeight: '50vh',
                  overflowY: 'auto'
                }}
              >
                <h4 style={{ color: '#C5A059', margin: '0 0 8px 0', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} /> ADMIN DEBUG CONSOLE
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div>👤 User ID: <span style={{ color: '#10b981' }}>{user?.id?.substring(0, 8) || 'NULL'}...</span></div>
                  <div> Admin: <span style={{ color: '#10b981' }}>YES</span></div>
                  <div>⏳ Loading: <span style={{ color: loading ? '#fbbf24' : '#10b981' }}>{loading ? 'YES' : 'NO'}</span></div>
                  <div>📚 Total Readings: <span style={{ color: '#60a5fa' }}>{readings.length}</span></div>
                  <div>🔍 Filtered: <span style={{ color: '#60a5fa' }}>{filteredReadings.length}</span></div>
                  <div>❤️ Bookmarked: <span style={{ color: '#f472b6' }}>{bookmarkedIds.size}</span></div>
                  <div>⚙️ Filter: <span style={{ color: '#fbbf24' }}>{filter}</span></div>
                  <div> LocalStorage: <span style={{ color: '#a78bfa' }}>{localStorage.getItem('bookmarked_readings') ? 'YES' : 'NO'}</span></div>
                </div>
                
                {debugError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '8px', borderRadius: '4px', color: '#fca5a5', marginBottom: '12px' }}>
                    ❌ ERROR: {debugError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={loadReadings}
                    style={{ flex: 1, padding: '8px', background: '#C5A059', color: '#0a0600', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <RefreshCw size={12} /> Refresh Data
                  </button>
                  <button 
                    onClick={clearDebugData}
                    style={{ flex: 1, padding: '8px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Trash2 size={12} /> Clear Local
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {/* END ADMIN DEBUG PANEL */}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReading && (
          <motion.div
            className="rh-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedReading(null)}
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
                <button className="rh-modal-close" onClick={() => setSelectedReading(null)}>
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