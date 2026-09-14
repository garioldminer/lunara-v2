import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Share2, Bookmark, BookOpen, ArrowLeft, Shield, Copy, CheckCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { tarotCards, TarotCard, SUITS, CARD_BACK_URL } from '../data/tarotCards';
import { logReading } from '../lib/adminService';
import { trackQuestProgress } from '../lib/questService';
import { useUser } from '../context/UserContext';
import { getActiveSubscription } from '../lib/subscriptionService';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import {
  getTodayReading,
  getDailyCard,
  updateDailyNotes,
  toggleBookmark,
  updateStreakOnReading,
  updateMood,
  MOODS,
  type DailyReading,
  type FocusArea,
  type Mood
} from '../lib/dailyCardService';
import { getStreakInfo, type StreakInfo } from '../lib/streakService';

interface Props {
  onNavigate?: (screen: string) => void;
}

type LogType = 'info' | 'success' | 'error' | 'warning' | 'api' | 'db' | 'ui';

interface DebugLog {
  id: number;
  timestamp: string;
  type: LogType;
  message: string;
  data?: any;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

const logColors: Record<LogType, string> = {
  info: '#60a5fa', success: '#10b981', error: '#ef4444',
  warning: '#fbbf24', api: '#a78bfa', db: '#f472b6', ui: '#f59e0b'
};

const logIcons: Record<LogType, string> = {
  info: 'ℹ️', success: '✅', error: '❌',
  warning: '⚠️', api: '🌐', db: '🗄️', ui: ''
};

// ============================================
// CSS COSMIC BACKGROUND (უფრო სწრაფი ვიდრე Three.js)
// ============================================
function CosmicBackground() {
  // 60 static + animated stars
  const stars = useMemo(() => {
    const list = [];
    for (let i = 0; i < 60; i++) {
      list.push({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.7
      });
    }
    return list;
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0a0600 40%, #000002 100%)',
      overflow: 'hidden'
    }}>
      {/* Nebula glows */}
      <div style={{
        position: 'absolute', top: '10%', left: '20%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 70%)',
        filter: 'blur(40px)', borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '10%', width: '350px', height: '350px',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12), transparent 70%)',
        filter: 'blur(50px)', borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '60%', width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent 70%)',
        filter: 'blur(40px)', borderRadius: '50%'
      }} />

      {/* Twinkling stars */}
      {stars.map(star => (
        <motion.div
          key={star.id}
          animate={{ opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3] }}
          transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            background: star.size > 1.5 ? '#fff' : 'rgba(255, 255, 255, 0.8)',
            boxShadow: star.size > 1.5 ? `0 0 ${star.size * 3}px rgba(255,255,255,0.6)` : 'none'
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 10000, pointerEvents: 'none'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={{
          background: toast.type === 'success'
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.98), rgba(5, 150, 105, 0.98))'
            : toast.type === 'error'
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.98), rgba(220, 38, 38, 0.98))'
            : 'linear-gradient(135deg, rgba(251, 191, 36, 0.98), rgba(245, 158, 11, 0.98))',
          color: '#fff', padding: '12px 20px', borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600',
          maxWidth: '320px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <span style={{ fontSize: '18px' }}>
          {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
        </span>
        <span>{toast.message}</span>
      </motion.div>
    </div>
  );
}

// ============================================
// FOCUS AREA CONFIG
// ============================================
const FOCUS_AREAS: { id: FocusArea; label: string; icon: string; gradient: string; color: string; description: string }[] = [
  { 
    id: 'general', label: 'General', icon: '⭐',
    gradient: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)',
    color: '#C5A059', description: 'Overall guidance'
  },
  { 
    id: 'love', label: 'Love', icon: '❤️',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    color: '#ec4899', description: 'Relationships'
  },
  { 
    id: 'career', label: 'Career', icon: '💼',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    color: '#3b82f6', description: 'Work & Goals'
  },
  { 
    id: 'custom', label: 'Custom', icon: '✨',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    color: '#8b5cf6', description: 'Your question'
  }
];

// ============================================
// MAIN COMPONENT
// ============================================
export default function DailyCardScreen({ onNavigate }: Props) {
  const { user } = useUser();

  const [dailyReading, setDailyReading] = useState<DailyReading | null>(null);
  const [stage, setStage] = useState<'loading' | 'selecting' | 'revealing' | 'revealed'>('loading');
  const [selectedFocus, setSelectedFocus] = useState<FocusArea>('general');
  const [customQuestion, setCustomQuestion] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [hasPremium, setHasPremium] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [moodSaving, setMoodSaving] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);

  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [logFilter, setLogFilter] = useState<LogType | 'all'>('all');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const [authUid, setAuthUid] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'checking' | 'active' | 'inactive'>('checking');

  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);

  const addLog = (type: LogType, message: string, data?: any) => {
    const log: DebugLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type, message, data
    };
    setDebugLogs(prev => [log, ...prev].slice(0, 100));
    logger.log(`[${type.toUpperCase()}] ${message}`, data || '');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const loadStreak = async () => {
      if (!user) return;
      try {
        const info = await getStreakInfo(user.id);
        if (info) {
          setStreakInfo(info);
          addLog('info', 'Streak loaded', { 
            current: info.current_streak, 
            next: info.next_milestone?.name || 'None' 
          });
        }
      } catch (err: any) {
        addLog('error', 'Streak load failed', { error: err.message });
      }
    };
    loadStreak();
  }, [user]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setAuthStatus('inactive');
        addLog('error', 'Supabase not initialized');
        return;
      }
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (error) {
          setAuthStatus('inactive');
          addLog('error', 'Auth error', { message: error.message });
        } else if (authUser) {
          setAuthStatus('active');
          setAuthUid(authUser.id);
          addLog('success', 'Supabase Auth active', { uid: authUser.id });
        } else {
          setAuthStatus('inactive');
          addLog('error', 'No active session');
        }
      } catch (err: any) {
        setAuthStatus('inactive');
        addLog('error', 'Auth check failed', { message: err.message });
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    addLog('info', 'DailyCardScreen mounted');

    if (user) {
      addLog('success', 'User found in context', { userId: user.id, name: user.display_name });

      const isAdmin = user.is_admin === true;
      setIsUserAdmin(isAdmin);
      addLog('info', 'Admin check completed', { isAdmin, authUid: user.id });

      getActiveSubscription(user.id).then(sub => {
        setHasPremium(!!sub);
        addLog('info', 'Subscription check', { hasPremium: !!sub });
      });
    } else {
      addLog('error', 'No user in context');
    }
  }, [user]);

  useEffect(() => {
    const loadTodayReading = async () => {
      if (!user) return;

      addLog('api', 'Loading today reading from DB');
      const existing = await getTodayReading(user.id);

      if (existing) {
        addLog('success', 'Today reading found in DB', existing);
        setDailyReading(existing);
        setSelectedFocus(existing.focus_area || 'general');
        setCustomQuestion(existing.question || '');
        setNotes(existing.notes || '');
        setSelectedMood(existing.mood || null);
        if (existing.reflection_prompt) {
          addLog('info', 'Reflection prompt loaded', { prompt: existing.reflection_prompt });
        }
        setStage('revealed');
      } else {
        addLog('info', 'No reading for today - showing focus selection');
        setDailyReading(null);
        setStage('selecting');
      }
    };

    loadTodayReading();
  }, [user]);

  useEffect(() => {
    if (!dailyReading || !notes) return;
    if (notes === dailyReading.notes) return;

    const timer = setTimeout(async () => {
      setNotesSaving(true);
      const success = await updateDailyNotes(dailyReading.id, notes);
      if (success) {
        addLog('success', 'Notes auto-saved');
        setDailyReading(prev => prev ? { ...prev, notes } : null);
      }
      setNotesSaving(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, dailyReading?.id]);

  const handleFocusSelect = (focus: FocusArea) => {
    setSelectedFocus(focus);
    setShowQuestionInput(focus === 'custom');
    if (focus !== 'custom') setCustomQuestion('');
    addLog('ui', 'Focus area selected', { focus });
  };

  const handleReveal = async () => {
    if (!user || isCreating) return;

    setIsCreating(true);
    addLog('ui', 'Reveal button clicked');

    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    setStage('revealing');

    const question = selectedFocus === 'custom' ? customQuestion : undefined;
    const reading = await getDailyCard(user.id, selectedFocus, question);

    if (!reading) {
      addLog('error', 'Failed to create reading');
      showToast('Failed to draw your card. Please try again.', 'error');
      setIsCreating(false);
      setStage('selecting');
      return;
    }

    addLog('success', 'Reading created in DB', reading);
    setDailyReading(reading);
    setNotes(reading.notes || '');
    setSelectedMood(null);

    try {
      await logReading(user.id, 'daily_card', [reading.cards[0].id], `${reading.cards[0].name}${reading.cards[0].is_reversed ? ' (Reversed)' : ''}`);
      await trackQuestProgress(user.id, 'draw_daily_card', 1);
      addLog('success', 'Quest progress tracked');
      
      const streakResult = await updateStreakOnReading();
      if (streakResult.success) {
        addLog('success', 'Streak updated via Edge Function', { 
          current_streak: streakResult.current_streak,
          longest_streak: streakResult.longest_streak,
          streak_incremented: streakResult.streak_incremented
        });
        if (streakResult.streak_incremented) {
          showToast(`🔥 Streak: ${streakResult.current_streak} days!`, 'success');
          
          const newInfo = await getStreakInfo(user.id);
          if (newInfo) setStreakInfo(newInfo);
        } else {
          addLog('info', 'Streak already updated today');
        }
      } else {
        addLog('warning', 'Streak update failed', { error: streakResult.error });
      }
    } catch (err: any) {
      addLog('error', 'Quest/Streak tracking failed', { error: err.message });
    }

    setTimeout(() => {
      setStage('revealed');
      setIsCreating(false);
      showToast(`Your card: ${reading.cards[0].name} ✨`, 'success');
    }, 1200);
  };

  const handleShare = () => {
    if (!dailyReading) return;
    addLog('ui', 'Share button clicked');

    const cardData = dailyReading.cards[0];
    const tarotCard = tarotCards.find(c => c.id === cardData.id);
    if (!tarotCard) return;

    const shareText = `✨ My Daily Card: ${cardData.name}${cardData.is_reversed ? ' (Reversed)' : ''}\n\n"${cardData.is_reversed ? tarotCard.reversed_meaning : tarotCard.meaning}"\n\nDraw your own card on Lunara App! 🌙`;

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(window.location.href || '')}&text=${encodeURIComponent(shareText)}`);
      showToast('Share dialog opened', 'info');
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('Copied to clipboard!', 'success');
    }
  };

  const handleToggleBookmark = async () => {
    if (!dailyReading) return;

    const newStatus = await toggleBookmark(dailyReading.id);
    if (newStatus !== null) {
      setDailyReading(prev => prev ? { ...prev, is_bookmarked: newStatus } : null);
      showToast(newStatus ? 'Added to favorites ⭐' : 'Removed from favorites', 'success');
      addLog('success', `Bookmark ${newStatus ? 'added' : 'removed'}`);
    }
  };

  const handleAIInsight = () => {
    if (!hasPremium) {
      showToast('AI Insight is a Premium feature ✨', 'info');
      onNavigate?.('pricing');
    } else {
      showToast('AI Insight coming soon! 🤖', 'info');
    }
  };

  const getCardMeta = (card: TarotCard) => {
    if (card.arcana === 'major') return 'Major Arcana';
    if (card.suit && SUITS[card.suit]) return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    return 'Minor Arcana';
  };

  const copyAllLogs = () => {
    const authInfo = `Auth Status: ${authStatus}\nAuth UID: ${authUid || 'NULL'}\nUser ID: ${user?.id || 'NULL'}\n\n`;
    const text = authInfo + debugLogs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}${l.data ? '\n' + JSON.stringify(l.data, null, 2) : ''}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addLog('info', 'All logs copied to clipboard');
  };

  const clearLogs = () => {
    setDebugLogs([]);
    addLog('info', 'Debug logs cleared');
  };

  const filteredLogs = logFilter === 'all' ? debugLogs : debugLogs.filter(l => l.type === logFilter);

  // LOADING SCREEN (lightweight - no Three.js)
  if (!user || stage === 'loading') {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#000002' }}>
        <CosmicBackground />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#C5A059' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Sparkles size={32} />
          </motion.div>
        </div>
      </div>
    );
  }

  const currentCard = dailyReading ? tarotCards.find(c => c.id === dailyReading.cards[0].id) : null;
  const isReversed = dailyReading?.cards[0].is_reversed || false;
  const meaning = currentCard ? (isReversed ? currentCard.reversed_meaning : currentCard.meaning) : '';
  const keywords = currentCard ? (isReversed ? currentCard.reversed_keywords : currentCard.keywords) : [];

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh', position: 'relative', color: '#fff',
    paddingLeft: '5px', paddingRight: '5px',
    display: 'flex', flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowY: 'auto', WebkitOverflowScrolling: 'touch'
  };

  const actionBtnStyle: React.CSSProperties = {
    width: '52px', height: '52px', borderRadius: '50%',
    background: 'rgba(10, 8, 20, 0.6)',
    border: '1px solid rgba(197, 160, 89, 0.4)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#C5A059', cursor: 'pointer',
    transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
  };

  return (
    <div style={containerStyle}>
      <CosmicBackground />

      <AnimatePresence>
        {toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* 🎯 HEADER ROW: Back + Date + Streak (ერთ ხაზზე, არაფერი ეჯახება) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '16px', 
        paddingLeft: '5px', 
        paddingRight: '10px', 
        position: 'relative', 
        zIndex: 1,
        marginTop: '10px'
      }}>
        <button onClick={() => onNavigate?.('home')} style={{ 
          background: 'rgba(10, 8, 20, 0.5)', 
          border: '1px solid rgba(197, 160, 89, 0.4)', 
          borderRadius: '50%', 
          width: '40px', 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#C5A059', 
          cursor: 'pointer', 
          backdropFilter: 'blur(12px)', 
          WebkitBackdropFilter: 'blur(12px)', 
          flexShrink: 0 
        }}>
          <ArrowLeft size={20} />
        </button>

        {/* Date badge - integrated into header */}
        <div style={{
          padding: '6px 10px',
          background: 'rgba(10, 8, 20, 0.6)',
          border: '1px solid rgba(197, 160, 89, 0.2)',
          borderRadius: '10px',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '9px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short' })}
          </div>
          <div style={{ fontSize: '14px', color: '#C5A059', fontWeight: '700', lineHeight: 1 }}>
            {new Date().getDate()}
          </div>
        </div>

        {streakInfo && streakInfo.current_streak > 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(10, 8, 20, 0.6)', border: '1px solid rgba(251, 146, 60, 0.3)', borderRadius: '12px', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', minWidth: 0 }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>🔥</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fb923c', flexShrink: 0 }}>
              {streakInfo.current_streak}d
            </span>
            <div style={{ flex: 1, height: '4px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', minWidth: '40px' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${streakInfo.percent_to_next}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #fb923c, #fbbf24)', boxShadow: '0 0 8px rgba(251, 146, 60, 0.5)' }}
              />
            </div>
            {streakInfo.next_milestone && (
              <span style={{ fontSize: '12px', flexShrink: 0 }}>
                {streakInfo.next_milestone.icon_emoji}
              </span>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, fontSize: '15px', color: '#C5A059', fontWeight: 700, letterSpacing: '0.5px' }}>
            Daily Card
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {stage === 'selecting' && (
          <motion.div key="selecting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding: '0 10px', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: '24px', background: 'rgba(10, 8, 20, 0.6)', padding: '24px 16px', borderRadius: '20px', backdropFilter: 'blur(12px)', border: '1px solid rgba(197, 160, 89, 0.2)' }}>
              <motion.div 
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '48px', marginBottom: '12px' }}
              >
                🌙
              </motion.div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#C5A059', margin: '0 0 6px 0' }}>Set Your Intention</h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Choose a focus for today's reading</p>
            </div>

            {/* HORIZONTAL FOCUS BANNERS */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '16px',
              scrollSnapType: 'x mandatory'
            }}>
              {FOCUS_AREAS.map((focus) => {
                const isSelected = selectedFocus === focus.id;
                return (
                  <motion.button
                    key={focus.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFocusSelect(focus.id)}
                    style={{
                      flex: '1 1 0',
                      minWidth: '90px',
                      padding: '16px 8px',
                      background: isSelected 
                        ? focus.gradient 
                        : 'rgba(10, 8, 20, 0.6)',
                      border: isSelected 
                        ? 'none'
                        : '1px solid rgba(197, 160, 89, 0.2)',
                      borderRadius: '14px',
                      color: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      scrollSnapAlign: 'start',
                      boxShadow: isSelected 
                        ? `0 8px 25px ${focus.color}40, 0 0 0 2px ${focus.color}` 
                        : 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: `radial-gradient(circle at center, ${focus.color}40, transparent)`,
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                    <motion.div
                      animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 1, repeat: isSelected ? Infinity : 0 }}
                      style={{ 
                        fontSize: '28px',
                        position: 'relative',
                        zIndex: 1,
                        filter: isSelected ? `drop-shadow(0 0 8px ${focus.color})` : 'none'
                      }}
                    >
                      {focus.icon}
                    </motion.div>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '700',
                      position: 'relative',
                      zIndex: 1,
                      textShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'
                    }}>
                      {focus.label}
                    </div>
                    <div style={{ 
                      fontSize: '9px', 
                      color: isSelected ? 'rgba(255,255,255,0.9)' : '#94a3b8',
                      position: 'relative',
                      zIndex: 1,
                      textAlign: 'center',
                      lineHeight: 1.2
                    }}>
                      {focus.description}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {showQuestionInput && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <textarea 
                  value={customQuestion} 
                  onChange={(e) => setCustomQuestion(e.target.value)} 
                  placeholder="What's on your mind today?" 
                  style={{ 
                    width: '100%', 
                    marginBottom: '16px', 
                    padding: '14px', 
                    background: 'rgba(10, 8, 20, 0.6)', 
                    border: '1.5px solid rgba(139, 92, 246, 0.4)', 
                    borderRadius: '12px', 
                    color: '#fff', 
                    fontSize: '13px', 
                    minHeight: '70px', 
                    boxSizing: 'border-box', 
                    backdropFilter: 'blur(8px)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }} 
                />
              </motion.div>
            )}

            <motion.button 
              whileTap={{ scale: 0.98 }} 
              whileHover={{ scale: 1.01 }}
              onClick={handleReveal} 
              disabled={isCreating} 
              style={{ 
                width: '100%', 
                padding: '16px', 
                background: isCreating 
                  ? 'rgba(197, 160, 89, 0.5)' 
                  : 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)', 
                border: 'none', 
                borderRadius: '14px', 
                color: '#0f0c08', 
                fontSize: '16px', 
                fontWeight: '800', 
                letterSpacing: '0.5px',
                cursor: isCreating ? 'not-allowed' : 'pointer', 
                boxShadow: isCreating ? 'none' : '0 8px 30px rgba(197, 160, 89, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isCreating ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles size={18} />
                  </motion.div>
                  Drawing your card...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Reveal My Card
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {stage === 'revealing' && (
          <motion.div key="revealing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '400px', position: 'relative', zIndex: 1 }}>
            <div style={{ perspective: '1000px', width: '220px', height: '330px' }}>
              <motion.div
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 180 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Front (back of card) */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backfaceVisibility: 'hidden',
                  border: '2px solid #C5A059',
                  boxShadow: '0 0 50px rgba(197, 160, 89, 0.4)'
                }}>
                  <img src={CARD_BACK_URL} alt="Card Back" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                {/* Back (hidden side during flip) */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: '#0a0600'
                }} />
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ marginTop: '20px', color: '#C5A059', fontSize: '13px', fontWeight: '600', letterSpacing: '1px' }}
            >
              ✨ The universe is choosing your card...
            </motion.div>
          </motion.div>
        )}

        {stage === 'revealed' && currentCard && (
          <motion.div key="revealed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 1, padding: '0 10px' }}>
            
            {/* CARD + GLOW */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              marginBottom: '20px',
              perspective: '1000px'
            }}>
              {/* Glow burst */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 2, opacity: [0, 0.8, 0] }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '300px',
                  height: '300px',
                  borderRadius: '50%',
                  background: isReversed 
                    ? 'radial-gradient(circle, rgba(167, 139, 250, 0.5), transparent 70%)'
                    : 'radial-gradient(circle, rgba(197, 160, 89, 0.5), transparent 70%)',
                  pointerEvents: 'none',
                  zIndex: 0
                }}
              />

              <motion.div
                initial={{ rotateY: 180, scale: 0.8 }}
                animate={{ rotateY: 0, scale: 1, y: [0, -10, 0] }}
                transition={{ 
                  rotateY: { duration: 0.8, ease: 'easeOut' },
                  scale: { duration: 0.5, ease: 'easeOut' },
                  y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }
                }}
                style={{
                  width: '220px', 
                  height: '330px', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  position: 'relative',
                  border: '2px solid rgba(197, 160, 89, 0.9)',
                  boxShadow: isReversed 
                    ? '0 0 40px rgba(167, 139, 250, 0.6), 0 0 80px rgba(167, 139, 250, 0.3), 0 10px 30px rgba(0,0,0,0.8)' 
                    : '0 0 40px rgba(197, 160, 89, 0.6), 0 0 80px rgba(197, 160, 89, 0.3), 0 10px 30px rgba(0,0,0,0.8)',
                  transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)',
                  background: '#0a0600',
                  zIndex: 1
                }}
              >
                <img src={currentCard.image_url} alt={currentCard.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {isReversed && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '12px', 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '12px', 
                    fontWeight: '900', 
                    background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', 
                    color: '#fff', 
                    border: '2px solid #fff', 
                    boxShadow: '0 0 10px rgba(167,139,250,0.8)', 
                    transform: 'rotate(-180deg)' 
                  }}>
                    R
                  </div>
                )}
              </motion.div>

              {/* ACTION BUTTONS - ქვემოთ ერთ ხაზზე */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginTop: '16px',
                zIndex: 1
              }}>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAIInsight}
                  style={{ 
                    ...actionBtnStyle, 
                    background: hasPremium ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 215, 0, 0.15)', 
                    borderColor: hasPremium ? 'rgba(167, 139, 250, 0.5)' : 'rgba(255, 215, 0, 0.5)', 
                    color: hasPremium ? '#a78bfa' : '#FFD700' 
                  }}
                  title="AI Insight"
                >
                  <Sparkles size={22} />
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={handleToggleBookmark} style={{ 
                  ...actionBtnStyle, 
                  color: dailyReading?.is_bookmarked ? '#C5A059' : '#94a3b8',
                  boxShadow: dailyReading?.is_bookmarked ? '0 0 15px rgba(197, 160, 89, 0.4)' : '0 4px 15px rgba(0,0,0,0.3)'
                }}>
                  <Bookmark size={22} fill={dailyReading?.is_bookmarked ? '#C5A059' : 'none'} />
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare} style={actionBtnStyle}>
                  <Share2 size={22} />
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNavigate?.('reading-history')} style={actionBtnStyle} title="Reading History">
                  <BookOpen size={22} />
                </motion.button>
              </div>
            </div>

            {/* CARD INFO */}
            <div style={{ background: 'rgba(10, 8, 20, 0.6)', border: '1px solid rgba(197, 160, 89, 0.2)', borderRadius: '16px', padding: '16px', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', marginBottom: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>{getCardMeta(currentCard)}</div>
                <h2 style={{ margin: '4px 0', fontSize: '22px', color: '#C5A059', fontWeight: '700' }}>{currentCard.name}</h2>
                {isReversed && <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '700', letterSpacing: '0.5px' }}>REVERSED POSITION</span>}
              </div>
              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.3), transparent)', margin: '12px 0' }} />
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.9)', fontStyle: 'italic', textAlign: 'center' }}>"{meaning}"</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
                {keywords.map((keyword: string, idx: number) => (
                  <span key={idx} style={{ background: 'rgba(197, 160, 89, 0.15)', color: '#e2e8f0', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', border: '1px solid rgba(197, 160, 89, 0.25)' }}>
                    {keyword}
                  </span>
                ))}
              </div>

              {dailyReading?.reflection_prompt && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => {
                    if (notes.trim()) return;
                    setNotes(dailyReading.reflection_prompt || '');
                    showToast('💭 Prompt added to your notes! Edit as you wish.', 'info');
                    addLog('ui', 'Prompt filled into notes', { prompt: dailyReading.reflection_prompt });
                  }}
                  style={{
                    marginTop: '8px',
                    marginBottom: '16px',
                    padding: '14px',
                    background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(124, 58, 237, 0.05) 100%)',
                    border: '1px solid rgba(167, 139, 250, 0.25)',
                    borderRadius: '12px',
                    cursor: notes.trim() ? 'default' : 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    opacity: notes.trim() ? 0.6 : 1
                  }}
                  whileHover={notes.trim() ? {} : { scale: 1.02, borderColor: 'rgba(167, 139, 250, 0.5)' }}
                  whileTap={notes.trim() ? {} : { scale: 0.98 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>💭</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', color: '#a78bfa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>
                        Reflection Prompt
                      </div>
                      <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5, fontStyle: 'italic', fontWeight: 400 }}>
                        "{dailyReading.reflection_prompt}"
                      </div>
                      {!notes.trim() && (
                        <div style={{ fontSize: '9px', color: '#a78bfa', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.5px' }}>
                          <span>✨</span> Tap to start your reflection with this prompt
                        </div>
                      )}
                      {notes.trim() && (
                        <div style={{ fontSize: '9px', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>✓</span> Prompt used in your notes
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                  How are you feeling?
                  {moodSaving && <span style={{ fontSize: '9px', color: '#fbbf24' }}>Saving...</span>}
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {MOODS.map((mood) => (
                    <motion.button
                      key={mood.value}
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={async () => {
                        if (!dailyReading) return;
                        setSelectedMood(mood.value);
                        setMoodSaving(true);
                        const success = await updateMood(dailyReading.id, mood.value);
                        if (success) {
                          addLog('success', `Mood saved: ${mood.label}`);
                          showToast(`${mood.emoji} Mood recorded!`, 'success');
                        } else {
                          addLog('error', 'Mood save failed');
                          showToast('Failed to save mood', 'error');
                        }
                        setMoodSaving(false);
                      }}
                      style={{
                        width: '48px',
                        height: '56px',
                        borderRadius: '12px',
                        background: selectedMood === mood.value 
                          ? `linear-gradient(135deg, ${mood.color}30, ${mood.color}15)` 
                          : 'rgba(255,255,255,0.05)',
                        border: selectedMood === mood.value 
                          ? `2px solid ${mood.color}` 
                          : '2px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{mood.emoji}</span>
                      <span style={{ fontSize: '8px', color: selectedMood === mood.value ? mood.color : '#94a3b8', fontWeight: selectedMood === mood.value ? 700 : 500 }}>
                        {mood.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  📝 Your Notes
                  {notesSaving && <span style={{ fontSize: '9px', color: '#fbbf24' }}>Saving...</span>}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your thoughts about this card..."
                  style={{
                    width: '100%', minHeight: '80px', padding: '10px',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(197, 160, 89, 0.2)',
                    borderRadius: '8px', color: '#fff', fontSize: '13px',
                    fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isUserAdmin && (
        <div style={{ position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 9999, fontFamily: 'monospace' }}>
          <button onClick={() => setShowDebug(!showDebug)} style={{ width: '50px', height: '50px', background: showDebug ? '#ef4444' : 'rgba(197, 160, 89, 0.9)', border: 'none', borderRadius: '8px 0 0 8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', fontSize: '20px' }}>
            {showDebug ? '✕' : '🐛'}
          </button>

          {showDebug && (
            <div style={{ position: 'absolute', right: '50px', top: '0', width: '350px', maxHeight: '80vh', background: 'rgba(10, 6, 0, 0.98)', backdropFilter: 'blur(10px)', border: '2px solid #C5A059', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px', borderBottom: '1px solid rgba(197, 160, 89, 0.3)', background: 'rgba(197, 160, 89, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5A059', fontWeight: 'bold', fontSize: '13px' }}>
                    <Shield size={16} /> ADMIN DEBUG
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', marginBottom: '8px' }}>
                  <div>🔑 Auth: <span style={{ color: authStatus === 'active' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{authStatus === 'active' ? 'ACTIVE ✅' : 'INACTIVE ❌'}</span></div>
                  <div>👤 UID: <span style={{ color: authUid ? '#10b981' : '#ef4444', fontSize: '9px' }}>{authUid ? `${authUid.substring(0, 8)}...` : 'NULL'}</span></div>
                  <div>📊 Stage: <span style={{ color: '#fbbf24' }}>{stage}</span></div>
                  <div>💾 Reading ID: <span style={{ color: dailyReading ? '#10b981' : '#ef4444', fontSize: '9px' }}>{dailyReading?.id?.substring(0, 8) || 'None'}</span></div>
                  <div>🃏 Card: <span style={{ color: '#60a5fa' }}>{currentCard?.name || 'None'}</span></div>
                  <div>🎭 Mood: <span style={{ color: '#a78bfa' }}>{selectedMood || 'None'}</span></div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    📝 Prompt: <span style={{ color: '#f472b6', fontSize: '9px' }}>
                      {dailyReading?.reflection_prompt ? `"${dailyReading.reflection_prompt.substring(0, 40)}..."` : 'None'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '8px' }}>
                  {(['all', 'info', 'success', 'error', 'warning', 'api', 'db', 'ui'] as const).map(type => (
                    <button key={type} onClick={() => setLogFilter(type)} style={{ padding: '4px 8px', background: logFilter === type ? (type === 'all' ? '#C5A059' : logColors[type]) : 'rgba(255,255,255,0.1)', color: logFilter === type ? '#000' : '#fff', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                      {type} ({type === 'all' ? debugLogs.length : debugLogs.filter(l => l.type === type).length})
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={copyAllLogs} style={{ flex: 1, padding: '6px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    {copied ? <><CheckCircle size={10} /> Copied!</> : <><Copy size={10} /> Copy All</>}
                  </button>
                  <button onClick={clearLogs} style={{ flex: 1, padding: '6px', background: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Trash2 size={10} /> Clear
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {filteredLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '11px' }}>No logs yet...</div>
                ) : (
                  filteredLogs.map(log => (
                    <div key={log.id} style={{ padding: '8px', marginBottom: '4px', background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${logColors[log.type]}`, borderRadius: '4px', cursor: log.data ? 'pointer' : 'default' }} onClick={() => log.data && setExpandedLog(expandedLog === log.id ? null : log.id)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '10px' }}>
                        <span style={{ flexShrink: 0 }}>{logIcons[log.type]}</span>
                        <span style={{ color: '#666', flexShrink: 0, fontSize: '9px' }}>{log.timestamp}</span>
                        <span style={{ color: logColors[log.type], fontWeight: 'bold', flexShrink: 0, fontSize: '9px', textTransform: 'uppercase' }}>[{log.type}]</span>
                        <span style={{ color: '#e2e8f0', flex: 1, lineHeight: 1.4 }}>{log.message}</span>
                        {log.data && <span style={{ flexShrink: 0, color: '#666' }}>{expandedLog === log.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>}
                      </div>
                      {log.data && expandedLog === log.id && (
                        <div style={{ marginTop: '6px', padding: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', fontSize: '9px', color: '#a78bfa', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}