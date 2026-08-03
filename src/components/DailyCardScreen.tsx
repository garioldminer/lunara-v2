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
//  REALISTIC COSMIC BACKGROUND
// ============================================
function CosmicBackground() {
  // ვარსკვლავები - რეალისტური ფერებით (ვარსკვლავებს სხვადასხვა ფერი აქვთ ტემპერატურის მიხედვით)
  const stars = useMemo(() => Array.from({ length: 80 }, (_, i) => {
    const colors = ['#ffffff', '#ffe9c4', '#c4d4ff', '#ffd4a3', '#a3c4ff', '#ffcccc'];
    return {
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.3,
      opacity: Math.random() * 0.8 + 0.2,
      delay: `${Math.random() * 5}s`,
      duration: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  }), []);

  // ძალიან პატარა ვარსკვლავები (ვარსკვლავური მტვერი)
  const starDust = useMemo(() => Array.from({ length: 120 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 0.8 + 0.2,
    opacity: Math.random() * 0.5 + 0.1
  })), []);

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
          radial-gradient(ellipse at 20% 30%, rgba(60, 30, 100, 0.4) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(30, 20, 80, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(80, 40, 120, 0.15) 0%, transparent 60%),
          radial-gradient(ellipse at 50% 0%, rgba(197, 160, 89, 0.08) 0%, transparent 40%),
          linear-gradient(180deg, #080415 0%, #040210 50%, #010008 100%)
        `
      }} />

      {/* გალაქტიკის ნისლები (Nebula) */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '50%',
          height: '40%',
          background: 'radial-gradient(ellipse at center, rgba(100, 50, 180, 0.2) 0%, rgba(60, 30, 120, 0.1) 40%, transparent 70%)',
          filter: 'blur(40px)'
        }}
      />

      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '45%',
          height: '35%',
          background: 'radial-gradient(ellipse at center, rgba(50, 30, 150, 0.15) 0%, rgba(30, 20, 100, 0.08) 40%, transparent 70%)',
          filter: 'blur(35px)'
        }}
      />

      <motion.div
        animate={{ x: [0, 20, 0], y: [0, 10, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '40%',
          left: '30%',
          width: '40%',
          height: '30%',
          background: 'radial-gradient(ellipse at center, rgba(197, 160, 89, 0.06) 0%, transparent 70%)',
          filter: 'blur(30px)'
        }}
      />

      {/* ვარსკვლავური მტვერი (ძალიან პატარა ვარსკვლავები) */}
      {starDust.map((star) => (
        <div
          key={`dust-${star.id}`}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            background: '#ffffff',
            opacity: star.opacity
          }}
        />
      ))}

      {/* კაშკაშა ვარსკვლავები */}
      {stars.map((star) => (
        <motion.div
          key={`star-${star.id}`}
          animate={{ 
            opacity: [star.opacity, star.opacity * 0.3, star.opacity],
            scale: [1, 1.3, 1]
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
            background: star.color,
            boxShadow: star.size > 1.5 
              ? `0 0 8px ${star.color}, 0 0 16px ${star.color}80` 
              : `0 0 4px ${star.color}80`,
          }}
        />
      ))}

      {/* 🌙 რეალისტური მთვარე SVG-ით */}
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [0, 1, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '8%',
          left: '6%',
          width: '60px',
          height: '60px',
        }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60">
          <defs>
            <radialGradient id="moonGrad" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#f8f9fa" />
              <stop offset="40%" stopColor="#e9ecef" />
              <stop offset="70%" stopColor="#ced4da" />
              <stop offset="100%" stopColor="#adb5bd" />
            </radialGradient>
            <filter id="moonGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* მთვარის glow */}
          <circle cx="30" cy="30" r="28" fill="rgba(203, 213, 225, 0.15)" filter="url(#moonGlow)" />
          {/* მთვარის სხეული */}
          <circle cx="30" cy="30" r="24" fill="url(#moonGrad)" />
          {/* კრატერები */}
          <circle cx="22" cy="25" r="4" fill="rgba(100, 116, 139, 0.3)" />
          <circle cx="35" cy="32" r="3" fill="rgba(100, 116, 139, 0.25)" />
          <circle cx="28" cy="38" r="2.5" fill="rgba(100, 116, 139, 0.2)" />
          <circle cx="38" cy="22" r="2" fill="rgba(100, 116, 139, 0.3)" />
          <circle cx="20" cy="35" r="1.5" fill="rgba(100, 116, 139, 0.25)" />
          {/* Mare (მუქი აქები) */}
          <ellipse cx="25" cy="28" rx="8" ry="6" fill="rgba(100, 116, 139, 0.15)" />
          <ellipse cx="35" cy="35" rx="6" ry="4" fill="rgba(100, 116, 139, 0.12)" />
        </svg>
      </motion.div>

      {/* ️ რეალისტური მზე SVG-ით */}
      <motion.div
        animate={{ y: [0, 5, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '12%',
          right: '8%',
          width: '50px',
          height: '50px',
        }}
      >
        <svg width="50" height="50" viewBox="0 0 50 50">
          <defs>
            <radialGradient id="sunGrad" cx="40%" cy="40%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="20%" stopColor="#fef3c7" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="80%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            <filter id="sunGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* მზის corona (გარე ნათება) */}
          <circle cx="25" cy="25" r="24" fill="rgba(251, 191, 36, 0.1)" filter="url(#sunGlow)" />
          <circle cx="25" cy="25" r="20" fill="rgba(251, 191, 36, 0.2)" />
          {/* მზის სხეული */}
          <circle cx="25" cy="25" r="16" fill="url(#sunGrad)" />
        </svg>
      </motion.div>

      {/*  სატურნი (პლანეტა ring-ით) */}
      <motion.div
        animate={{ y: [0, -8, 0], x: [0, 4, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '65%',
          right: '12%',
          width: '40px',
          height: '40px',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40">
          <defs>
            <radialGradient id="saturnGrad" cx="40%" cy="40%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
          </defs>
          {/* Ring (უკანა ნაწილი) */}
          <ellipse cx="20" cy="20" rx="18" ry="6" fill="none" stroke="rgba(251, 191, 36, 0.3)" strokeWidth="2" />
          {/* პლანეტის სხეული */}
          <circle cx="20" cy="20" r="10" fill="url(#saturnGrad)" />
          {/* Ring (წინა ნაწილი) */}
          <ellipse cx="20" cy="20" rx="18" ry="6" fill="none" stroke="rgba(251, 191, 36, 0.5)" strokeWidth="2" strokeDasharray="0 18 36" />
        </svg>
      </motion.div>

      {/* 🌍 დედამიწა */}
      <motion.div
        animate={{ y: [0, 6, 0], rotate: [0, -2, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '75%',
          left: '15%',
          width: '30px',
          height: '30px',
        }}
      >
        <svg width="30" height="30" viewBox="0 0 30 30">
          <defs>
            <radialGradient id="earthGrad" cx="40%" cy="40%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="40%" stopColor="#3b82f6" />
              <stop offset="70%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </radialGradient>
          </defs>
          <circle cx="15" cy="15" r="14" fill="url(#earthGrad)" />
          {/* კონტინენტები */}
          <path d="M 10 8 Q 12 10 11 13 Q 9 14 8 12 Q 7 10 10 8" fill="rgba(34, 197, 94, 0.4)" />
          <path d="M 18 12 Q 20 14 19 17 Q 17 18 16 16 Q 15 14 18 12" fill="rgba(34, 197, 94, 0.3)" />
          <path d="M 12 18 Q 14 20 13 22 Q 11 23 10 21 Q 9 19 12 18" fill="rgba(34, 197, 94, 0.35)" />
        </svg>
      </motion.div>

      {/* 🔴 მარსი */}
      <motion.div
        animate={{ y: [0, -5, 0], x: [0, -3, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          top: '25%',
          right: '20%',
          width: '25px',
          height: '25px',
        }}
      >
        <svg width="25" height="25" viewBox="0 0 25 25">
          <defs>
            <radialGradient id="marsGrad" cx="40%" cy="40%">
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </radialGradient>
          </defs>
          <circle cx="12.5" cy="12.5" r="11" fill="url(#marsGrad)" />
          {/* ედაპირის დეტალები */}
          <circle cx="10" cy="11" r="2" fill="rgba(127, 29, 29, 0.3)" />
          <circle cx="15" cy="14" r="1.5" fill="rgba(127, 29, 29, 0.25)" />
        </svg>
      </motion.div>

      {/*  კომეტა კუდით */}
      <motion.div
        animate={{ 
          x: ['-150px', '500px'],
          y: ['80px', '250px'],
          opacity: [0, 1, 1, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          repeatDelay: 20,
          ease: "easeOut"
        }}
        style={{
          position: 'absolute',
          top: '15%',
          left: '5%',
        }}
      >
        <svg width="100" height="30" viewBox="0 0 100 30">
          <defs>
            <linearGradient id="cometTail" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
              <stop offset="70%" stopColor="rgba(255, 255, 255, 0.3)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.8)" />
            </linearGradient>
          </defs>
          {/* კუდი */}
          <path d="M 0 15 Q 40 15 80 15" stroke="url(#cometTail)" strokeWidth="3" fill="none" />
          {/* თავი */}
          <circle cx="85" cy="15" r="4" fill="#ffffff" />
          <circle cx="85" cy="15" r="6" fill="rgba(255, 255, 255, 0.3)" />
        </svg>
      </motion.div>

      {/* 🌌 შორეული გალაქტიკა */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          top: '45%',
          left: '75%',
          width: '80px',
          height: '80px',
          opacity: 0.15,
        }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80">
          <defs>
            <radialGradient id="galaxyGrad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
              <stop offset="30%" stopColor="rgba(200, 180, 255, 0.4)" />
              <stop offset="60%" stopColor="rgba(150, 130, 200, 0.2)" />
              <stop offset="100%" stopColor="rgba(100, 80, 150, 0)" />
            </radialGradient>
          </defs>
          <ellipse cx="40" cy="40" rx="35" ry="15" fill="url(#galaxyGrad)" transform="rotate(-30 40 40)" />
          <ellipse cx="40" cy="40" rx="35" ry="15" fill="url(#galaxyGrad)" transform="rotate(30 40 40)" />
        </svg>
      </motion.div>

      {/* Shooting Star */}
      <motion.div
        animate={{ 
          x: ['-100px', '400px'],
          y: ['50px', '200px'],
          opacity: [0, 1, 0]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          repeatDelay: 18,
          ease: "easeOut"
        }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '100px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent)',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.7)',
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
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              
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