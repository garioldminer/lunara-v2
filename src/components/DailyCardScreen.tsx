import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Briefcase, Star, Share2, Lock, Bookmark, BookOpen, ArrowLeft } from 'lucide-react';
import { tarotCards, TarotCard, SUITS, CARD_BACK_URL } from '../data/tarotCards';
import { saveReading } from '../lib/readingService';
import { logReading } from '../lib/adminService';
import { trackQuestProgress } from '../lib/questService';
import { useUser } from '../context/UserContext';
import { getActiveSubscription } from '../lib/subscriptionService';

interface Props {
  onNavigate?: (screen: string) => void;
}

type FocusArea = 'general' | 'love' | 'career' | 'custom';

interface DailyReading {
  card: TarotCard;
  isReversed: boolean;
  date: string;
  focusArea: FocusArea;
  question?: string;
}

// ============================================
// 🌌 COSMIC BACKGROUND COMPONENT
// ============================================
function CosmicBackground() {
  // ვარსკვლავების გენერაცია
  const stars = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2.5 + 0.5,
    opacity: Math.random() * 0.8 + 0.2,
    delay: `${Math.random() * 5}s`,
    duration: 2 + Math.random() * 4
  })), []);

  // ზოდიაქოს სიმბოლოები
  const zodiacSymbols = useMemo(() => [
    { symbol: '♈', left: '8%', top: '15%', size: 18, delay: 0 },
    { symbol: '♉', left: '85%', top: '25%', size: 16, delay: 1 },
    { symbol: '♊', left: '12%', top: '75%', size: 20, delay: 2 },
    { symbol: '♋', left: '88%', top: '70%', size: 17, delay: 0.5 },
    { symbol: '', left: '5%', top: '45%', size: 19, delay: 1.5 },
    { symbol: '♍', left: '92%', top: '50%', size: 16, delay: 2.5 },
    { symbol: '♎', left: '50%', top: '5%', size: 18, delay: 0.8 },
    { symbol: '♏', left: '50%', top: '92%', size: 17, delay: 1.8 },
  ], []);

  // ტაროს მინი-სიმბოლოები
  const tarotSymbols = useMemo(() => [
    { symbol: '✦', left: '20%', top: '30%', size: 14, delay: 0 },
    { symbol: '☽', left: '75%', top: '40%', size: 16, delay: 1 },
    { symbol: '', left: '30%', top: '85%', size: 13, delay: 2 },
    { symbol: '☀', left: '70%', top: '15%', size: 15, delay: 0.5 },
    { symbol: '🌙', left: '15%', top: '60%', size: 14, delay: 1.5 },
    { symbol: '✧', left: '82%', top: '85%', size: 12, delay: 2.5 },
  ], []);

  // პლანეტები
  const planets = useMemo(() => [
    { left: '25%', top: '20%', size: 8, ringSize: 14, color: '#a78bfa', delay: 0 },
    { left: '78%', top: '60%', size: 6, ringSize: 11, color: '#fbbf24', delay: 1 },
    { left: '40%', top: '75%', size: 7, ringSize: 12, color: '#60a5fa', delay: 2 },
  ], []);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      {/* ღრმა კოსმიური gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(80, 40, 120, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(40, 20, 80, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(100, 50, 150, 0.15) 0%, transparent 60%),
          radial-gradient(ellipse at 50% 0%, rgba(197, 160, 89, 0.08) 0%, transparent 40%),
          linear-gradient(180deg, #0a0515 0%, #050310 50%, #020108 100%)
        `
      }} />

      {/* გალაქტიკის ნისლი 1 - იისფერი */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '50%',
          height: '40%',
          background: 'radial-gradient(ellipse at center, rgba(120, 60, 180, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }}
      />

      {/* გალაქტიკის ნისლი 2 - ურჯი */}
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '45%',
          height: '35%',
          background: 'radial-gradient(ellipse at center, rgba(60, 40, 150, 0.12) 0%, transparent 70%)',
          filter: 'blur(35px)'
        }}
      />

      {/* გალაქტიკის ნისლი 3 - ოქროსფერი აქცენტი */}
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, 10, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '40%',
          left: '30%',
          width: '40%',
          height: '30%',
          background: 'radial-gradient(ellipse at center, rgba(197, 160, 89, 0.08) 0%, transparent 70%)',
          filter: 'blur(30px)'
        }}
      />

      {/* ვარსკვლავები */}
      {stars.map((star) => (
        <motion.div
          key={`star-${star.id}`}
          animate={{ 
            opacity: [star.opacity, star.opacity * 0.2, star.opacity],
            scale: [1, 1.4, 1]
          }}
          transition={{ 
            duration: star.duration, 
            repeat: Infinity, 
            delay: star.delay,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            background: star.size > 2 ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
            boxShadow: star.size > 2 
              ? '0 0 8px rgba(255, 255, 255, 0.9), 0 0 16px rgba(255, 255, 255, 0.5)' 
              : '0 0 4px rgba(255, 255, 255, 0.6)',
          }}
        />
      ))}

      {/* მთვარე - ზედა მარცხენივ */}
      <motion.div
        animate={{ y: [0, -5, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '8%',
          left: '6%',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #f1f5f9 0%, #cbd5e1 40%, #64748b 100%)',
          boxShadow: '0 0 30px rgba(203, 213, 225, 0.4), 0 0 60px rgba(203, 213, 225, 0.2), inset -8px -4px 0 rgba(0,0,0,0.3)',
        }}
      >
        {/* მთვარის კრატერები */}
        <div style={{ position: 'absolute', top: '30%', left: '25%', width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.4)' }} />
        <div style={{ position: 'absolute', top: '55%', left: '50%', width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.3)' }} />
      </motion.div>

      {/* მზე - ზედა მარჯვნივ */}
      <motion.div
        animate={{ y: [0, 5, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '12%',
          right: '8%',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #fef3c7 0%, #fbbf24 40%, #d97706 100%)',
          boxShadow: '0 0 40px rgba(251, 191, 36, 0.6), 0 0 80px rgba(251, 191, 36, 0.3), 0 0 120px rgba(251, 191, 36, 0.15)',
        }}
      />

      {/* პლანეტები */}
      {planets.map((planet, i) => (
        <motion.div
          key={`planet-${i}`}
          animate={{ y: [0, -8, 0], x: [0, 5, 0] }}
          transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut", delay: planet.delay }}
          style={{
            position: 'absolute',
            left: planet.left,
            top: planet.top,
            width: `${planet.size}px`,
            height: `${planet.size}px`,
            borderRadius: '50%',
            background: planet.color,
            boxShadow: `0 0 15px ${planet.color}80`,
          }}
        >
          {/* პლანეტის ring */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotateX(75deg)',
            width: `${planet.ringSize}px`,
            height: `${planet.ringSize}px`,
            borderRadius: '50%',
            border: `1.5px solid ${planet.color}60`,
          }} />
        </motion.div>
      ))}

      {/* ზოდიაქოს სიმბოლოები */}
      {zodiacSymbols.map((z, i) => (
        <motion.div
          key={`zodiac-${i}`}
          animate={{ 
            y: [0, -10, 0],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ 
            duration: 12 + i, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: z.delay
          }}
          style={{
            position: 'absolute',
            left: z.left,
            top: z.top,
            fontSize: `${z.size}px`,
            color: 'rgba(197, 160, 89, 0.25)',
            textShadow: '0 0 10px rgba(197, 160, 89, 0.3)',
            fontWeight: 300,
          }}
        >
          {z.symbol}
        </motion.div>
      ))}

      {/* ტაროს მინი-სიმბოლოები */}
      {tarotSymbols.map((s, i) => (
        <motion.div
          key={`tarot-${i}`}
          animate={{ 
            y: [0, 12, 0],
            rotate: [0, 5, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 8 + i * 2, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: s.delay
          }}
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            fontSize: `${s.size}px`,
            color: 'rgba(251, 191, 36, 0.3)',
            textShadow: '0 0 8px rgba(251, 191, 36, 0.4)',
          }}
        >
          {s.symbol}
        </motion.div>
      ))}

      {/* Shooting Star - იშვიათი ეფექტი */}
      <motion.div
        animate={{ 
          x: ['-100px', '400px'],
          y: ['50px', '200px'],
          opacity: [0, 1, 0]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          repeatDelay: 15,
          ease: "easeOut"
        }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '80px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.6)',
          transform: 'rotate(-15deg)',
        }}
      />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function DailyCardScreen({ onNavigate }: Props) {
  const [dailyReading, setDailyReading] = useState<DailyReading | null>(null);
  const [stage, setStage] = useState<'selecting' | 'revealing' | 'revealed'>('selecting');
  const [selectedFocus, setSelectedFocus] = useState<FocusArea>('general');
  const [customQuestion, setCustomQuestion] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const { user } = useUser();
  const [hasPremium, setHasPremium] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    const today = getTodayDate();
    const stored = localStorage.getItem('dailyCard');
    if (stored) {
      const parsed: DailyReading = JSON.parse(stored);
      if (parsed.date === today) {
        setDailyReading(parsed);
        setSelectedFocus(parsed.focusArea || 'general');
        if (parsed.focusArea === 'custom' && parsed.question) setCustomQuestion(parsed.question);
        setStage('revealed');
        return;
      }
    }
    generateDailyCard();
  }, []);

  useEffect(() => {
    if (user) getActiveSubscription(user.id).then(sub => setHasPremium(!!sub));
  }, [user]);

  const generateDailyCard = () => {
    const today = getTodayDate();
    const dayOfYear = getDayOfYear(new Date());
    const card = tarotCards[dayOfYear % tarotCards.length];
    const newReading: DailyReading = { card, isReversed: Math.random() < 0.5, date: today, focusArea: 'general' };
    localStorage.setItem('dailyCard', JSON.stringify(newReading));
    setDailyReading(newReading);
  };

  const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleFocusSelect = (focus: FocusArea) => {
    setSelectedFocus(focus);
    setShowQuestionInput(focus === 'custom');
    if (focus !== 'custom') setCustomQuestion('');
  };

  const handleReveal = async () => {
    if (!dailyReading) return;
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    setStage('revealing');
    const updatedReading = { ...dailyReading, focusArea: selectedFocus, question: selectedFocus === 'custom' ? customQuestion : undefined };
    setDailyReading(updatedReading);
    localStorage.setItem('dailyCard', JSON.stringify(updatedReading));

    setTimeout(async () => {
      setStage('revealed');
      if (user) {
        try {
          await saveReading({ user_id: user.id, reading_type: 'daily', question: updatedReading.question, cards: [{ id: updatedReading.card.id, name: updatedReading.card.name, is_reversed: updatedReading.isReversed }] });
          await logReading(user.id, 'daily_card', [updatedReading.card.id], `${updatedReading.card.name}${updatedReading.isReversed ? ' (Reversed)' : ''}`);
          await trackQuestProgress(user.id, 'draw_daily_card', 1);
        } catch (error) { console.error('❌ Error saving daily reading:', error); }
      }
    }, 1200);
  };

  const handleShare = () => {
    if (!dailyReading) return;
    const { card, isReversed } = dailyReading;
    const shareText = `🔮 My Daily Card: ${card.name}${isReversed ? ' (Reversed)' : ''}\n\n"${isReversed ? card.reversed_meaning : card.meaning}"\n\nDraw your own card on Lunara App! ✨`;
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(window.location.href || '')}&text=${encodeURIComponent(shareText)}`);
    else navigator.clipboard.writeText(shareText).then(() => alert('Copied to clipboard!'));
  };

  const getCardMeta = (card: TarotCard) => {
    if (card.arcana === 'major') return 'Major Arcana';
    if (card.suit && SUITS[card.suit]) return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    return 'Minor Arcana';
  };

  const getFocusIcon = (focus: FocusArea) => {
    switch (focus) {
      case 'love': return <Heart size={18} />;
      case 'career': return <Briefcase size={18} />;
      case 'custom': return <Sparkles size={18} />;
      default: return <Star size={18} />;
    }
  };

  if (!dailyReading) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        <CosmicBackground />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#C5A059' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Sparkles size={32} />
          </motion.div>
        </div>
      </div>
    );
  }

  const { card, isReversed } = dailyReading;
  const meaning = isReversed ? card.reversed_meaning : card.meaning;
  const keywords = isReversed ? card.reversed_keywords : card.keywords;

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    position: 'relative',
    color: '#fff',
    paddingTop: 'calc(70px + env(safe-area-inset-top, 0px))',
    paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
    paddingLeft: '5px',
    paddingRight: '5px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch'
  };

  const actionBtnStyle: React.CSSProperties = {
    width: '48px', height: '48px', borderRadius: '50%',
    background: 'rgba(10, 8, 20, 0.5)',
    border: '1px solid rgba(197, 160, 89, 0.4)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#C5A059', cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
  };

  return (
    <div style={containerStyle}>
      {/* 🌌 კოსმიური ფონი */}
      <CosmicBackground />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: '5px', paddingRight: '5px', position: 'relative', zIndex: 1 }}>
        <button 
          onClick={() => onNavigate?.('home')}
          style={{ background: 'rgba(10, 8, 20, 0.5)', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A059', cursor: 'pointer', backdropFilter: 'blur(12px)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', background: 'rgba(10, 8, 20, 0.4)', padding: '6px 12px', borderRadius: '20px', backdropFilter: 'blur(8px)' }}>
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </div>
        <div style={{ width: '40px' }} />
      </div>

      <AnimatePresence mode="wait">
        {stage === 'selecting' && (
          <motion.div key="selecting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding: '0 10px', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: '20px', background: 'rgba(10, 8, 20, 0.4)', padding: '20px', borderRadius: '16px', backdropFilter: 'blur(12px)', border: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔮</div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#C5A059' }}>Set Your Intention</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {(['general', 'love', 'career', 'custom'] as FocusArea[]).map((focus) => (
                <motion.button key={focus} whileTap={{ scale: 0.96 }} onClick={() => handleFocusSelect(focus)} style={{ padding: '14px', background: selectedFocus === focus ? 'rgba(197, 160, 89, 0.2)' : 'rgba(10, 8, 20, 0.5)', border: selectedFocus === focus ? '1.5px solid #C5A059' : '1px solid rgba(197, 160, 89, 0.2)', borderRadius: '10px', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                  <div style={{ color: selectedFocus === focus ? '#C5A059' : '#94a3b8' }}>{getFocusIcon(focus)}</div>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{focus.charAt(0).toUpperCase() + focus.slice(1)}</span>
                </motion.button>
              ))}
            </div>
            {showQuestionInput && (
              <textarea value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)} placeholder="Your question..." style={{ width: '100%', marginTop: '12px', padding: '12px', background: 'rgba(10, 8, 20, 0.6)', border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '13px', minHeight: '60px', boxSizing: 'border-box', backdropFilter: 'blur(8px)' }} />
            )}
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleReveal} style={{ width: '100%', marginTop: '16px', padding: '14px', background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)', border: 'none', borderRadius: '10px', color: '#0f0c08', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(197, 160, 89, 0.4)' }}>
              Reveal My Card
            </motion.button>
          </motion.div>
        )}

        {stage === 'revealing' && (
          <motion.div key="revealing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
            <motion.div initial={{ rotateY: 0 }} animate={{ rotateY: 180 }} transition={{ duration: 1.2 }} style={{ width: '220px', height: '308px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 50px rgba(197, 160, 89, 0.4)', border: '2px solid #C5A059' }}>
              <img src={CARD_BACK_URL} alt="Card Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>
          </motion.div>
        )}

        {stage === 'revealed' && (
          <motion.div key="revealed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 1 }}>
            
            {/* კარტი + მარჯვენა სვეტი */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              
              {/* ბარათი - ტივტივებს კოსმოსში */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: '220px',
                  height: '308px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '2px solid rgba(197, 160, 89, 0.8)',
                  boxShadow: isReversed 
                    ? '0 0 40px rgba(167, 139, 250, 0.6), 0 0 80px rgba(167, 139, 250, 0.3), 0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)' 
                    : '0 0 40px rgba(197, 160, 89, 0.6), 0 0 80px rgba(197, 160, 89, 0.3), 0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)',
                  transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)',
                  background: 'radial-gradient(ellipse at center, rgba(40, 20, 60, 0.3) 0%, rgba(5, 5, 10, 0.95) 100%)'
                }}
              >
                {card.image_url ? (
                  <img 
                    src={card.image_url} 
                    alt={card.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2a2215, #1a1510)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#C5A059' }}>{card.number}</span>
                    <span style={{ fontSize: '32px' }}>✦</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#C5A059', textAlign: 'center' }}>{card.name}</span>
                  </div>
                )}

                {isReversed && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', color: '#fff', border: '2px solid #fff', boxShadow: '0 0 10px rgba(167,139,250,0.8)' }}>
                    R
                  </div>
                )}
              </motion.div>

              {/* მარჯვენა სვეტი */}
              <div style={{ width: '48px', display: 'flex', flexDirection: 'column', gap: '14px', marginLeft: '12px' }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => !hasPremium && onNavigate?.('pricing')} style={{ ...actionBtnStyle, background: hasPremium ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 215, 0, 0.15)', borderColor: hasPremium ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 215, 0, 0.5)', color: hasPremium ? '#10b981' : '#FFD700' }}>
                  {hasPremium ? <Sparkles size={20} /> : <Lock size={18} />}
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsBookmarked(!isBookmarked)} style={{ ...actionBtnStyle, color: isBookmarked ? '#C5A059' : '#94a3b8' }}>
                  <Bookmark size={20} fill={isBookmarked ? '#C5A059' : 'none'} />
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare} style={actionBtnStyle}>
                  <Share2 size={20} />
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNavigate?.('reading-history')} style={actionBtnStyle} title="Reading History">
                  <BookOpen size={20} />
                </motion.button>
              </div>
            </div>

            {/* ქვედა ბანერი */}
            <div style={{ 
              background: 'rgba(10, 8, 20, 0.6)', 
              border: '1px solid rgba(197, 160, 89, 0.2)', 
              borderRadius: '16px', 
              padding: '16px', 
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              marginLeft: '5px',
              marginRight: '5px',
              marginBottom: '5px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>{getCardMeta(card)}</div>
                <h2 style={{ margin: '4px 0', fontSize: '22px', color: '#C5A059', fontWeight: '700' }}>{card.name}</h2>
                {isReversed && <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '700', letterSpacing: '0.5px' }}>REVERSED POSITION</span>}
              </div>

              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.3), transparent)', margin: '12px 0' }} />

              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.9)', fontStyle: 'italic', textAlign: 'center' }}>
                  "{meaning}"
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                {keywords.map((keyword: string, idx: number) => (
                  <span key={idx} style={{ background: 'rgba(197, 160, 89, 0.15)', color: '#e2e8f0', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', border: '1px solid rgba(197, 160, 89, 0.25)' }}>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}