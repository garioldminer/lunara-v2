import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Sparkles, LayoutGrid } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getUserReadings } from '../lib/readingService';
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

  useEffect(() => {
    if (user) {
      loadReadings();
    }
  }, [user]);

  const loadReadings = async () => {
    if (!user) return;
    
    setLoading(true);
    const data = await getUserReadings(user.id, 100);
    setReadings(data);
    setLoading(false);
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

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getReadingTypeIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Sparkles size={16} />;
      case 'three-card':
        return <LayoutGrid size={16} />;
      default:
        return <Sparkles size={16} />;
    }
  };

  const getReadingTypeLabel = (type: string) => {
    switch (type) {
      case 'daily':
        return 'Daily Card';
      case 'three-card':
        return '3-Card Reading';
      default:
        return 'Reading';
    }
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
        <button
          className={`rh-filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({readings.length})
        </button>
        <button
          className={`rh-filter-tab ${filter === 'daily' ? 'active' : ''}`}
          onClick={() => setFilter('daily')}
        >
          Daily ({readings.filter(r => r.reading_type === 'daily').length})
        </button>
        <button
          className={`rh-filter-tab ${filter === 'three-card' ? 'active' : ''}`}
          onClick={() => setFilter('three-card')}
        >
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
              {filter === 'all' 
                ? "Start your journey by drawing your first card!"
                : `No ${getReadingTypeLabel(filter).toLowerCase()} readings found.`}
            </p>
            {onNavigate && (
              <button 
                className="rh-empty-btn"
                onClick={() => onNavigate('daily-card')}
              >
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
              >
                {/* Card Header */}
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

                {/* Question */}
                {reading.question && (
                  <div className="rh-card-question">
                    <p className="rh-question-text">"{reading.question}"</p>
                  </div>
                )}

                {/* Cards Preview */}
                <div className="rh-cards-preview">
                  {reading.cards.map((card, idx) => (
                    <div 
                      key={idx} 
                      className={`rh-mini-card ${card.is_reversed ? 'reversed' : ''}`}
                    >
                      <div className="rh-mini-card-content">
                        <span className="rh-mini-card-name">{card.name}</span>
                        {card.is_reversed && (
                          <span className="rh-mini-reversed">R</span>
                        )}
                      </div>
                      {card.position && (
                        <span className="rh-mini-position">{card.position}</span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}