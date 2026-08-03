import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Heart, Briefcase, Star, Share2, Lock } from 'lucide-react';
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

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    const today = getTodayDate();
    const stored = localStorage.getItem('dailyCard');
    
    if (stored) {
      const parsed: DailyReading = JSON.parse(stored);
      if (parsed.date === today) {
        setDailyReading(parsed);
        setSelectedFocus(parsed.focusArea || 'general');
        if (parsed.focusArea === 'custom' && parsed.question) {
          setCustomQuestion(parsed.question);
        }
        setStage('revealed');
        return;
      }
    }
    generateDailyCard();
  }, []);

  useEffect(() => {
    if (user) {
      getActiveSubscription(user.id).then(sub => setHasPremium(!!sub));
    }
  }, [user]);

  const generateDailyCard = () => {
    const today = getTodayDate();
    const dayOfYear = getDayOfYear(new Date());
    const cardIndex = dayOfYear % tarotCards.length;
    const card = tarotCards[cardIndex];
    const isReversed = Math.random() < 0.5;
    
    const newReading: DailyReading = { card, isReversed, date: today, focusArea: 'general' };
    localStorage.setItem('dailyCard', JSON.stringify(newReading));
    setDailyReading(newReading);
  };

  const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
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

    const updatedReading = {
      ...dailyReading,
      focusArea: selectedFocus,
      question: selectedFocus === 'custom' ? customQuestion : undefined
    };
    setDailyReading(updatedReading);
    localStorage.setItem('dailyCard', JSON.stringify(updatedReading));

    setTimeout(async () => {
      setStage('revealed');
      if (user) {
        try {
          await saveReading({
            user_id: user.id,
            reading_type: 'daily',
            question: updatedReading.question,
            cards: [{ id: updatedReading.card.id, name: updatedReading.card.name, is_reversed: updatedReading.isReversed }]
          });
          await logReading(user.id, 'daily_card', [updatedReading.card.id], `${updatedReading.card.name}${updatedReading.isReversed ? ' (Reversed)' : ''}`);
          const reward = await trackQuestProgress(user.id, 'draw_daily_card', 1);
          if (reward) console.log(`🎉 Quest Completed! Reward: ${reward.coins} coins, ${reward.xp} XP`);
        } catch (error) {
          console.error('❌ Error saving daily reading:', error);
        }
      }
    }, 1200);
  };

  const handleNewReading = () => {
    onNavigate?.('home');
  };

  const handleShare = () => {
    if (!dailyReading) return;
    const { card, isReversed } = dailyReading;
    const meaning = isReversed ? card.reversed_meaning : card.meaning;
    const shareText = `🔮 My Daily Card: ${card.name}${isReversed ? ' (Reversed)' : ''}\n\n"${meaning}"\n\nDraw your own card on Lunara App! ✨`;

    if (typeof window !== 'undefined') {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(window.location.href || '')}&text=${encodeURIComponent(shareText)}`);
      } else {
        navigator.clipboard.writeText(shareText).then(() => alert('Copied to clipboard!')).catch(() => {});
      }
    }
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

  const getFocusTitle = (focus: FocusArea) => {
    switch (focus) {
      case 'love': return 'Love';
      case 'career': return 'Career';
      case 'custom': return 'Custom';
      default: return 'General';
    }
  };

  if (!dailyReading) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #14101c 0%, #0a0600 55%, #07050a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A059' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Sparkles size={32} />
        </motion.div>
      </div>
    );
  }

  const { card, isReversed } = dailyReading;
  const meaning = isReversed ? card.reversed_meaning : card.meaning;
  const keywords = isReversed ? card.reversed_keywords : card.keywords;

  // ✅ Telegram Header-ისთვის მორგებული უსაფრთხო პადინგი
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at 50% 0%, #14101c 0%, #0a0600 55%, #07050a 100%)',
    color: '#fff',
    paddingTop: 'calc(75px + env(safe-area-inset-top, 0px))', // ✅ გარანტირებული დაცვა
    paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
    paddingLeft: '16px',
    paddingRight: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <button 
          onClick={() => onNavigate?.('home')}
          style={{ background: 'rgba(197, 160, 89, 0.1)', border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A059', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#C5A059', letterSpacing: '2px', textTransform: 'uppercase' }}>Daily Card</h1>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div style={{ width: '40px' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '480px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          
          {/* STAGE 1: SELECTING FOCUS (Compact 2x2 Grid) */}
          {stage === 'selecting' && (
            <motion.div key="selecting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px', filter: 'drop-shadow(0 0 10px rgba(197, 160, 89, 0.4))' }}>🔮</div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#C5A059', marginBottom: '4px' }}>Set Your Intention</h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4', maxWidth: '280px', margin: '0 auto' }}>Choose a focus for your guidance</p>
              </div>

              {/* ✅ 2x2 Grid ზოგავს უამრავ ვერტიკალურ სივრცეს */}
              <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {(['general', 'love', 'career', 'custom'] as FocusArea[]).map((focus) => (
                  <motion.button
                    key={focus}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleFocusSelect(focus)}
                    style={{
                      padding: '12px 8px',
                      background: selectedFocus === focus ? 'rgba(197, 160, 89, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedFocus === focus ? '1.5px solid #C5A059' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px', color: '#fff',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ color: selectedFocus === focus ? '#C5A059' : '#94a3b8' }}>{getFocusIcon(focus)}</div>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{getFocusTitle(focus)}</span>
                  </motion.button>
                ))}
              </div>

              {showQuestionInput && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ width: '100%' }}>
                  <textarea
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="What would you like to know?"
                    style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '13px', resize: 'none', minHeight: '60px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </motion.div>
              )}

              <motion.button whileTap={{ scale: 0.98 }} onClick={handleReveal} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)', border: 'none', borderRadius: '10px', color: '#0f0c08', fontSize: '15px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 15px rgba(197, 160, 89, 0.3)' }}>
                Reveal My Card
              </motion.button>
            </motion.div>
          )}

          {/* STAGE 2: REVEALING */}
          {stage === 'revealing' && (
            <motion.div key="revealing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              {/* ✅ ბანქოს კარტის რეალისტური პროპორცია (5:7) */}
              <motion.div 
                initial={{ rotateY: 0 }} 
                animate={{ rotateY: 180 }} 
                transition={{ duration: 1.2, ease: 'easeInOut' }} 
                style={{ 
                  width: '220px', 
                  height: '308px', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  boxShadow: '0 0 50px rgba(197, 160, 89, 0.4), 0 10px 30px rgba(0,0,0,0.8)', 
                  border: '2px solid #C5A059' 
                }}
              >
                <img src={CARD_BACK_URL} alt="Card Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
              </motion.div>
              <p style={{ marginTop: '24px', fontSize: '14px', color: '#C5A059', letterSpacing: '2px', textTransform: 'uppercase' }}>Revealing...</p>
            </motion.div>
          )}

          {/* STAGE 3: REVEALED (Compact Layout) */}
          {stage === 'revealed' && (
            <motion.div key="revealed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              {/* Card Display */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <motion.div 
                  initial={{ rotateY: 90, opacity: 0 }} 
                  animate={{ rotateY: 0, opacity: 1 }} 
                  transition={{ duration: 0.6, ease: 'easeOut' }} 
                  style={{ 
                    width: '220px', 
                    height: '308px', 
                    borderRadius: '12px', 
                    overflow: 'hidden', 
                    boxShadow: isReversed ? '0 0 30px rgba(167, 139, 250, 0.3), 0 10px 20px rgba(0,0,0,0.6)' : '0 0 30px rgba(197, 160, 89, 0.3), 0 10px 20px rgba(0,0,0,0.6)',
                    border: `2px solid ${isReversed ? '#a78bfa' : '#C5A059'}`,
                    transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                >
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2a2215, #1a1510)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#C5A059' }}>{card.number}</span>
                      <span style={{ fontSize: '28px' }}>✦</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#C5A059', textAlign: 'center', padding: '0 12px' }}>{card.name}</span>
                    </div>
                  )}
                </motion.div>
                {isReversed && (
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ delay: 0.3, type: 'spring' }} 
                    style={{ 
                      position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', zIndex: 10, 
                      background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', color: '#fff', border: '2px solid #fff', 
                      boxShadow: '0 0 0 2px rgba(167,139,250,0.5), 0 4px 12px rgba(167,139,250,0.8)' 
                    }}
                  >
                    R
                  </motion.div>
                )}
              </div>

              {/* Info Panel */}
              <div style={{ width: '100%', background: 'rgba(26, 21, 16, 0.8)', border: '1px solid rgba(197, 160, 89, 0.2)', borderRadius: '16px', padding: '16px', backdropFilter: 'blur(10px)' }}>
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>{getCardMeta(card)}</div>
                  <h2 style={{ margin: 0, fontSize: '22px', color: '#C5A059', fontWeight: '700' }}>{card.name}</h2>
                  {isReversed && <span style={{ display: 'inline-block', marginTop: '6px', background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', border: '1px solid rgba(167, 139, 250, 0.3)' }}>REVERSED</span>}
                </div>

                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.3), transparent)', margin: '12px 0' }} />

                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '11px', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: '700' }}>{isReversed ? 'Reversed Meaning' : 'Meaning'}</h3>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.85)', fontStyle: 'italic' }}>"{meaning}"</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '11px', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '700' }}>Keywords</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {keywords.map((keyword: string, idx: number) => (
                      <span key={idx} style={{ background: 'rgba(197, 160, 89, 0.1)', color: '#e2e8f0', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', border: '1px solid rgba(197, 160, 89, 0.2)' }}>{keyword}</span>
                    ))}
                  </div>
                </div>

                {/* Premium Upsell */}
                {!hasPremium && (
                  <div style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05))', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '10px', padding: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700, #FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 10px rgba(255, 215, 0, 0.4)' }}>
                      <Lock size={16} style={{ color: '#0f0c08' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#FFD700', marginBottom: '2px' }}>AI Deep Dive</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Unlock personalized insights</div>
                    </div>
                    <button onClick={() => onNavigate?.('pricing')} style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #FFD700, #FFA500)', border: 'none', borderRadius: '6px', color: '#0f0c08', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>Unlock</button>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleShare} style={{ flex: 1, padding: '12px', background: 'rgba(197, 160, 89, 0.1)', border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '10px', color: '#C5A059', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Share2 size={14} /> <span>Share</span>
                  </button>
                  <button onClick={handleNewReading} style={{ flex: 1, padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '10px', color: '#C5A059', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <ArrowLeft size={14} /> <span>Home</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}