import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ✅ დავამატეთ ArrowLeft და BookOpen
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
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #14101c 0%, #0a0600 55%, #07050a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A059' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}><Sparkles size={32} /></motion.div>
      </div>
    );
  }

  const { card, isReversed } = dailyReading;
  const meaning = isReversed ? card.reversed_meaning : card.meaning;
  const keywords = isReversed ? card.reversed_keywords : card.keywords;

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at 50% 0%, #14101c 0%, #0a0600 55%, #07050a 100%)',
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
    background: 'rgba(26, 21, 16, 0.6)',
    border: '1px solid rgba(197, 160, 89, 0.3)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#C5A059', cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={containerStyle}>
      {/* ✅ აღდგენილი Header უკან დაბრუნების ღილაკით მარცხნივ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: '5px', paddingRight: '5px' }}>
        <button 
          onClick={() => onNavigate?.('home')}
          style={{ background: 'rgba(197, 160, 89, 0.1)', border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A059', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </div>
        <div style={{ width: '40px' }} /> {/* Spacer ჰედერის დასაბალანსებლად */}
      </div>

      <AnimatePresence mode="wait">
        {stage === 'selecting' && (
          <motion.div key="selecting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding: '0 10px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔮</div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#C5A059' }}>Set Your Intention</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {(['general', 'love', 'career', 'custom'] as FocusArea[]).map((focus) => (
                <motion.button key={focus} whileTap={{ scale: 0.96 }} onClick={() => handleFocusSelect(focus)} style={{ padding: '14px', background: selectedFocus === focus ? 'rgba(197, 160, 89, 0.15)' : 'rgba(255,255,255,0.03)', border: selectedFocus === focus ? '1.5px solid #C5A059' : '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <div style={{ color: selectedFocus === focus ? '#C5A059' : '#94a3b8' }}>{getFocusIcon(focus)}</div>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{focus.charAt(0).toUpperCase() + focus.slice(1)}</span>
                </motion.button>
              ))}
            </div>
            {showQuestionInput && (
              <textarea value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)} placeholder="Your question..." style={{ width: '100%', marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '13px', minHeight: '60px', boxSizing: 'border-box' }} />
            )}
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleReveal} style={{ width: '100%', marginTop: '16px', padding: '14px', background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)', border: 'none', borderRadius: '10px', color: '#0f0c08', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
              Reveal My Card
            </motion.button>
          </motion.div>
        )}

        {stage === 'revealing' && (
          <motion.div key="revealing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <motion.div initial={{ rotateY: 0 }} animate={{ rotateY: 180 }} transition={{ duration: 1.2 }} style={{ width: '220px', height: '308px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 50px rgba(197, 160, 89, 0.4)', border: '2px solid #C5A059' }}>
              <img src={CARD_BACK_URL} alt="Card Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>
          </motion.div>
        )}

        {stage === 'revealed' && (
          <motion.div key="revealed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              
              {/* 3D Portal Frame */}
              <div style={{
                flex: 1,
                background: 'radial-gradient(circle at center, #1a1510 0%, #050403 100%)',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9), inset 0 0 15px rgba(197, 160, 89, 0.15), 0 10px 30px rgba(0,0,0,0.5)',
                border: '1px solid rgba(197, 160, 89, 0.25)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                minHeight: '340px'
              }}>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    width: '100%',
                    maxWidth: '220px',
                    aspectRatio: '5/7',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: isReversed 
                      ? '0 0 35px rgba(167, 139, 250, 0.4), 0 10px 20px rgba(0,0,0,0.6)' 
                      : '0 0 35px rgba(197, 160, 89, 0.4), 0 10px 20px rgba(0,0,0,0.6)',
                    transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                >
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2a2215, #1a1510)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#C5A059' }}>{card.number}</span>
                      <span style={{ fontSize: '32px' }}>✦</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#C5A059', textAlign: 'center' }}>{card.name}</span>
                    </div>
                  )}
                </motion.div>

                {isReversed && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', color: '#fff', border: '2px solid #fff', boxShadow: '0 0 10px rgba(167,139,250,0.8)' }}>
                    R
                  </div>
                )}
              </div>

              {/* ✅ განახლებული მარჯვენა სვეტი: Home-ის მაგივრად History (BookOpen) */}
              <div style={{ 
                width: '48px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '14px', 
                marginLeft: '12px'
              }}>
                {/* Premium AI Button */}
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => !hasPremium && onNavigate?.('pricing')} style={{ ...actionBtnStyle, background: hasPremium ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 215, 0, 0.1)', borderColor: hasPremium ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 215, 0, 0.4)', color: hasPremium ? '#10b981' : '#FFD700' }}>
                  {hasPremium ? <Sparkles size={20} /> : <Lock size={18} />}
                </motion.button>

                {/* Bookmark Button */}
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsBookmarked(!isBookmarked)} style={{ ...actionBtnStyle, color: isBookmarked ? '#C5A059' : '#94a3b8', background: isBookmarked ? 'rgba(197, 160, 89, 0.15)' : 'rgba(26, 21, 16, 0.6)' }}>
                  <Bookmark size={20} fill={isBookmarked ? '#C5A059' : 'none'} />
                </motion.button>

                {/* Share Button */}
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare} style={actionBtnStyle}>
                  <Share2 size={20} />
                </motion.button>

                {/* ✅ ახალი: Reading History / Journal Button */}
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNavigate?.('reading-history')} style={actionBtnStyle} title="Reading History">
                  <BookOpen size={20} />
                </motion.button>
              </div>
            </div>

            {/* ქვედა ტექსტური ბლოკი */}
            <div style={{ 
              background: 'rgba(26, 21, 16, 0.6)', 
              border: '1px solid rgba(197, 160, 89, 0.15)', 
              borderRadius: '16px', 
              padding: '16px', 
              backdropFilter: 'blur(10px)',
              marginLeft: '5px', marginRight: '5px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>{getCardMeta(card)}</div>
                <h2 style={{ margin: '4px 0', fontSize: '22px', color: '#C5A059', fontWeight: '700' }}>{card.name}</h2>
                {isReversed && <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '700', letterSpacing: '0.5px' }}>REVERSED POSITION</span>}
              </div>

              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.3), transparent)', margin: '12px 0' }} />

              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.85)', fontStyle: 'italic', textAlign: 'center' }}>
                  "{meaning}"
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                {keywords.map((keyword: string, idx: number) => (
                  <span key={idx} style={{ background: 'rgba(197, 160, 89, 0.1)', color: '#e2e8f0', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', border: '1px solid rgba(197, 160, 89, 0.2)' }}>
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