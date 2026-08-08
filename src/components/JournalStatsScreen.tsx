import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, BookOpen, TrendingUp, Award, Calendar, PenTool, Bookmark, Star } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { CosmicScene } from './DailyCardScreen';
import { useUser } from '../context/UserContext';
import { getJournalStats, type JournalStats, MOODS, type Mood } from '../lib/dailyCardService';

interface Props {
  onNavigate?: (screen: string) => void;
}

// ============================================
// HELPER: Get Mood Emoji
// ============================================
function getMoodEmoji(mood: Mood | null): string {
  if (!mood) return '—';
  const found = MOODS.find(m => m.value === mood);
  return found ? found.emoji : '—';
}

function getMoodColor(mood: Mood): string {
  const found = MOODS.find(m => m.value === mood);
  return found ? found.color : '#94a3b8';
}

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({ icon, label, value, color = '#C5A059' }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div style={{
      background: 'rgba(10, 8, 20, 0.6)',
      border: '1px solid rgba(197, 160, 89, 0.2)',
      borderRadius: '12px',
      padding: '14px',
      backdropFilter: 'blur(12px)',
      flex: 1,
      minWidth: '140px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>
        {value}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function JournalStatsScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      setLoading(true);
      const data = await getJournalStats(user.id);
      setStats(data);
      setLoading(false);
    };
    loadStats();
  }, [user]);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    position: 'relative',
    color: '#fff',
    paddingTop: 'calc(70px + env(safe-area-inset-top, 0px))',
    paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
    paddingLeft: '16px',
    paddingRight: '16px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    background: '#000002'
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#000002' }}>
        <Canvas dpr={[1, 1.5]} style={{ position: 'absolute', inset: 0 }}>
          <CosmicScene />
        </Canvas>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#C5A059' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Sparkles size={32} />
          </motion.div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!stats) {
    return (
      <div style={containerStyle}>
        <Canvas dpr={[1, 1.5]} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }} camera={{ position: [0, 0, 35], fov: 60 }}>
          <CosmicScene />
        </Canvas>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          <button onClick={() => onNavigate?.('home')} style={{ background: 'rgba(10, 8, 20, 0.5)', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A059', cursor: 'pointer', backdropFilter: 'blur(12px)' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ margin: 0, fontSize: '18px', color: '#C5A059', fontWeight: 700, letterSpacing: '1px' }}>
            Journal Stats
          </h1>
          <div style={{ width: '40px' }} />
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
          <h2 style={{ fontSize: '20px', color: '#C5A059', marginBottom: '8px' }}>No Readings Yet</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
            Start your daily tarot journey to see your personal statistics and insights.
          </p>
          <button
            onClick={() => onNavigate?.('daily-card')}
            style={{
              marginTop: '24px',
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #C5A059, #8B6914)',
              border: 'none',
              borderRadius: '10px',
              color: '#0f0c08',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(197, 160, 89, 0.4)'
            }}
          >
            Draw Your First Card
          </button>
        </div>
      </div>
    );
  }

  // Calculate mood percentages
  const totalMoods = Object.values(stats.mood_distribution).reduce((a, b) => a + b, 0);
  const moodPercentages = {
    terrible: totalMoods > 0 ? Math.round((stats.mood_distribution.terrible / totalMoods) * 100) : 0,
    bad: totalMoods > 0 ? Math.round((stats.mood_distribution.bad / totalMoods) * 100) : 0,
    okay: totalMoods > 0 ? Math.round((stats.mood_distribution.okay / totalMoods) * 100) : 0,
    good: totalMoods > 0 ? Math.round((stats.mood_distribution.good / totalMoods) * 100) : 0,
    amazing: totalMoods > 0 ? Math.round((stats.mood_distribution.amazing / totalMoods) * 100) : 0,
  };

  // Calculate focus percentages
  const totalFocus = Object.values(stats.focus_breakdown).reduce((a, b) => a + b, 0);
  const focusPercentages = {
    general: totalFocus > 0 ? Math.round((stats.focus_breakdown.general / totalFocus) * 100) : 0,
    love: totalFocus > 0 ? Math.round((stats.focus_breakdown.love / totalFocus) * 100) : 0,
    career: totalFocus > 0 ? Math.round((stats.focus_breakdown.career / totalFocus) * 100) : 0,
    custom: totalFocus > 0 ? Math.round((stats.focus_breakdown.custom / totalFocus) * 100) : 0,
  };

  const medalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <div style={containerStyle}>
      <Canvas dpr={[1, 1.5]} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }} camera={{ position: [0, 0, 35], fov: 60 }}>
        <CosmicScene />
      </Canvas>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => onNavigate?.('home')} style={{ background: 'rgba(10, 8, 20, 0.5)', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A059', cursor: 'pointer', backdropFilter: 'blur(12px)' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: '18px', color: '#C5A059', fontWeight: 700, letterSpacing: '1px' }}>
          Journal Stats
        </h1>
        <div style={{ width: '40px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}
      >
        {/* Overview Cards (2x2 Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <StatCard icon={<BookOpen size={16} />} label="Total Cards" value={stats.total_readings} color="#60a5fa" />
          <StatCard icon={<TrendingUp size={16} />} label="Current Streak" value={`${stats.current_streak}d`} color="#fb923c" />
          <StatCard icon={<Bookmark size={16} />} label="Bookmarked" value={`${stats.bookmark_percentage}%`} color="#a78bfa" />
          <StatCard icon={<Star size={16} />} label="Avg Mood" value={`${getMoodEmoji(stats.most_common_mood)} ${stats.average_mood_score}`} color="#fbbf24" />
        </div>

        {/* Journey Duration */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.1) 0%, rgba(139, 105, 20, 0.05) 100%)',
          border: '1px solid rgba(197, 160, 89, 0.3)',
          borderRadius: '12px',
          padding: '14px',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Calendar size={20} style={{ color: '#C5A059' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>
              Your Journey
            </div>
            <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>
              {stats.days_since_first} days · {stats.total_notes_written} notes written
            </div>
          </div>
          <Award size={20} style={{ color: '#C5A059' }} />
        </div>

        {/* Mood Distribution */}
        <div style={{
          background: 'rgba(10, 8, 20, 0.6)',
          border: '1px solid rgba(197, 160, 89, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(12px)'
        }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#C5A059', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>
            😊 Mood Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {MOODS.map(mood => {
              const percentage = moodPercentages[mood.value];
              return (
                <div key={mood.value} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{mood.emoji}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', width: '60px', flexShrink: 0 }}>{mood.label}</span>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, ${mood.color}, ${mood.color}aa)`,
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600, width: '36px', textAlign: 'right' }}>
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Drawn Cards */}
        <div style={{
          background: 'rgba(10, 8, 20, 0.6)',
          border: '1px solid rgba(197, 160, 89, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(12px)'
        }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#C5A059', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>
            🃏 Most Drawn Cards
          </h3>
          {stats.most_drawn_cards.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
              No data yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.most_drawn_cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: index === 0 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{medalEmoji(index)}</span>
                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{card.name}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#C5A059', fontWeight: 700, background: 'rgba(197, 160, 89, 0.15)', padding: '3px 8px', borderRadius: '12px' }}>
                    {card.count}x
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Focus Area Breakdown */}
        <div style={{
          background: 'rgba(10, 8, 20, 0.6)',
          border: '1px solid rgba(197, 160, 89, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(12px)'
        }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#C5A059', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>
            🎯 Focus Areas
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { key: 'general', emoji: '⭐', label: 'General', color: '#60a5fa' },
              { key: 'love', emoji: '❤️', label: 'Love', color: '#f472b6' },
              { key: 'career', emoji: '💼', label: 'Career', color: '#fbbf24' },
              { key: 'custom', emoji: '✨', label: 'Custom', color: '#a78bfa' }
            ].map(focus => (
              <div
                key={focus.key}
                style={{
                  padding: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{focus.emoji}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>{focus.label}</div>
                <div style={{ fontSize: '16px', color: focus.color, fontWeight: 800 }}>
                  {focusPercentages[focus.key as keyof typeof focusPercentages]}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Stats */}
        <div style={{
          background: 'rgba(10, 8, 20, 0.6)',
          border: '1px solid rgba(197, 160, 89, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(12px)'
        }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#C5A059', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>
            📝 Notes Insights
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Total Written</div>
              <div style={{ fontSize: '18px', color: '#fff', fontWeight: 700 }}>
                {stats.total_notes_written} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>notes</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Avg Length</div>
              <div style={{ fontSize: '18px', color: '#fff', fontWeight: 700 }}>
                {stats.average_note_length} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>chars</span>
              </div>
            </div>
          </div>
          {stats.longest_streak > 0 && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(197, 160, 89, 0.2)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>🏆 Longest Streak</div>
              <div style={{ fontSize: '18px', color: '#fb923c', fontWeight: 700 }}>
                {stats.longest_streak} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>days</span>
              </div>
            </div>
          )}
        </div>

        {/* Back to Home Button */}
        <button
          onClick={() => onNavigate?.('home')}
          style={{
            marginTop: '8px',
            padding: '14px',
            background: 'rgba(10, 8, 20, 0.6)',
            border: '1px solid rgba(197, 160, 89, 0.3)',
            borderRadius: '12px',
            color: '#C5A059',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      </motion.div>
    </div>
  );
}