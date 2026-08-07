import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bookmark, BookOpen, Calendar, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { tarotCards } from '../data/tarotCards';
import { useUser } from '../context/UserContext';
import { getDailyReadingHistory, toggleBookmark, type DailyReading } from '../lib/dailyCardService';

interface Props {
  onNavigate?: (screen: string) => void;
}

type FilterType = 'all' | 'bookmarked' | 'month';

export default function ReadingHistoryScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [readings, setReadings] = useState<DailyReading[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ============================================
  // LOAD READINGS (50 limit)
  // ============================================
  useEffect(() => {
    const loadReadings = async () => {
      if (!user) return;
      setLoading(true);
      const history = await getDailyReadingHistory(user.id, 50);
      setReadings(history);
      setLoading(false);
    };
    loadReadings();
  }, [user]);

  // ============================================
  // APPLY FILTER
  // ============================================
  const filteredReadings = readings.filter(r => {
    if (filter === 'bookmarked') return r.is_bookmarked;
    if (filter === 'month') {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return r.reading_date >= monthStart;
    }
    return true;
  });

  // ============================================
  // TOGGLE BOOKMARK (DB-driven)
  // ============================================
  const handleToggleBookmark = async (reading: DailyReading) => {
    const newStatus = await toggleBookmark(reading.id);
    if (newStatus !== null) {
      setReadings(prev => prev.map(r => r.id === reading.id ? { ...r, is_bookmarked: newStatus } : r));
    }
  };

  const getCard = (reading: DailyReading) => tarotCards.find(c => c.id === reading.cards[0]?.id);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const counts = {
    all: readings.length,
    bookmarked: readings.filter(r => r.is_bookmarked).length,
    month: readings.filter(r => {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return r.reading_date >= monthStart;
    }).length
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0c08', color: '#fff', paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: '16px' }}>
        <button onClick={() => onNavigate?.('home')} style={{ background: 'rgba(10, 8, 20, 0.5)', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A059', cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: '18px', color: '#C5A059', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} /> My Journal
        </h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 16px', marginBottom: '16px' }}>
        {([
          { id: 'all', label: `All (${counts.all})`, icon: '📖' },
          { id: 'bookmarked', label: `⭐ ${counts.bookmarked}`, icon: '' },
          { id: 'month', label: `Month (${counts.month})`, icon: '📅' },
        ] as { id: FilterType; label: string; icon: string }[]).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ flex: 1, padding: '10px', background: filter === f.id ? 'rgba(197, 160, 89, 0.2)' : 'rgba(10, 8, 20, 0.6)', border: filter === f.id ? '1.5px solid #C5A059' : '1px solid rgba(197, 160, 89, 0.2)', borderRadius: '10px', color: filter === f.id ? '#C5A059' : '#94a3b8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            {f.icon && <span>{f.icon}</span>} {f.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>
            <Sparkles size={32} />
          </motion.div>
          <p>Loading your journal...</p>
        </div>
      ) : filteredReadings.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌙</div>
          <h3 style={{ color: '#C5A059', margin: '0 0 8px' }}>
            {filter === 'all' ? 'No readings yet' : `No ${filter} readings`}
          </h3>
          <p style={{ fontSize: '13px', margin: 0 }}>
            {filter === 'all' 
              ? 'Draw your first daily card to start your journal!' 
              : filter === 'bookmarked'
              ? 'Bookmark readings to see them here'
              : 'No readings this month yet'}
          </p>
          {filter === 'all' && (
            <button onClick={() => onNavigate?.('daily-card')} style={{ marginTop: '16px', padding: '12px 24px', background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)', border: 'none', borderRadius: '10px', color: '#0f0c08', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              Draw Card
            </button>
          )}
        </div>
      ) : (
        /* Reading list */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 16px' }}>
          {filteredReadings.map(reading => {
            const card = getCard(reading);
            if (!card) return null;
            const isExpanded = expandedId === reading.id;
            const isReversed = reading.cards[0]?.is_reversed;

            return (
              <motion.div key={reading.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(10, 8, 20, 0.6)', border: '1px solid rgba(197, 160, 89, 0.2)', borderRadius: '14px', overflow: 'hidden' }}>
                {/* Reading header (clickable to expand) */}
                <div onClick={() => setExpandedId(isExpanded ? null : reading.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer' }}>
                  {/* Mini card image */}
                  <div style={{ width: '50px', height: '75px', borderRadius: '6px', overflow: 'hidden', border: '1.5px solid #C5A059', flexShrink: 0, position: 'relative' }}>
                    <img src={card.image_url} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isReversed ? 'rotate(180deg)' : 'none' }} />
                    {isReversed && (
                      <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#a78bfa', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 900, transform: 'rotate(-180deg)' }}>R</div>
                    )}
                  </div>
                  
                  {/* Reading info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#C5A059' }}>{card.name}</span>
                      {isReversed && <span style={{ fontSize: '9px', color: '#a78bfa', fontWeight: 700 }}>(R)</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={10} /> {formatDate(reading.reading_date)}
                      {reading.focus_area && reading.focus_area !== 'general' && (
                        <span style={{ color: '#a78bfa', marginLeft: '6px' }}>• {reading.focus_area}</span>
                      )}
                    </div>
                    {reading.notes && !isExpanded && (
                      <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        "{reading.notes}"
                      </div>
                    )}
                  </div>

                  {/* Bookmark button */}
                  <button onClick={(e) => { e.stopPropagation(); handleToggleBookmark(reading); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: reading.is_bookmarked ? '#C5A059' : '#64748b', padding: '4px' }}>
                    <Bookmark size={18} fill={reading.is_bookmarked ? '#C5A059' : 'none'} />
                  </button>

                  {/* Expand indicator */}
                  {isExpanded ? <ChevronUp size={16} style={{ color: '#94a3b8' }} /> : <ChevronDown size={16} style={{ color: '#94a3b8' }} />}
                </div>

                {/* Expanded content (inline) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ borderTop: '1px solid rgba(197, 160, 89, 0.2)' }}>
                      <div style={{ padding: '12px' }}>
                        {reading.question && (
                          <div style={{ fontSize: '12px', color: '#60a5fa', marginBottom: '8px', fontStyle: 'italic' }}>
                            ❓ {reading.question}
                          </div>
                        )}
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '8px' }}>
                          "{isReversed ? card.reversed_meaning : card.meaning}"
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {(isReversed ? card.reversed_keywords : card.keywords).map((k: string, i: number) => (
                            <span key={i} style={{ background: 'rgba(197, 160, 89, 0.15)', color: '#e2e8f0', padding: '3px 8px', borderRadius: '10px', fontSize: '10px', border: '1px solid rgba(197, 160, 89, 0.25)' }}>{k}</span>
                          ))}
                        </div>
                        {reading.notes ? (
                          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                            📝 {reading.notes}
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>No notes for this reading</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}