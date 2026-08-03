import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Sparkles } from 'lucide-react';
import { tarotCards, TarotCard, SUITS, CARD_BACK_URL } from '../data/tarotCards';
import QuestionInput from './QuestionInput';
import { saveReading } from '../lib/readingService';
import { logReading } from '../lib/adminService';
import { trackQuestProgress } from '../lib/questService';
import { useUser } from '../context/UserContext';

interface Props {
  onNavigate?: (screen: string) => void;
}

interface DailyReading {
  card: TarotCard;
  isReversed: boolean;
  date: string;
  question?: string;
}

export default function DailyCardScreen({ onNavigate }: Props) {
  const [dailyReading, setDailyReading] = useState<DailyReading | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const { user } = useUser();

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
        if (parsed.question) {
          setIsRevealed(true);
          setShowQuestion(false);
        } else {
          setShowQuestion(true);
        }
        return;
      }
    }
    generateDailyCard();
  }, []);

  const generateDailyCard = () => {
    const today = getTodayDate();
    const dayOfYear = getDayOfYear(new Date());
    const cardIndex = dayOfYear % tarotCards.length;
    const card = tarotCards[cardIndex];
    const isReversed = Math.random() < 0.5;
    
    const newReading: DailyReading = { card, isReversed, date: today };
    localStorage.setItem('dailyCard', JSON.stringify(newReading));
    setDailyReading(newReading);
  };

  const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const handleQuestionSubmit = (question: string) => {
    if (dailyReading) {
      const updatedReading = { ...dailyReading, question };
      setDailyReading(updatedReading);
      localStorage.setItem('dailyCard', JSON.stringify(updatedReading));
    }
    setShowQuestion(false);
  };

  const handleReveal = async () => {
    setIsRevealed(true);
    
    if (user && dailyReading) {
      await saveReading({
        user_id: user.id,
        reading_type: 'daily',
        question: dailyReading.question,
        cards: [{ id: dailyReading.card.id, name: dailyReading.card.name, is_reversed: dailyReading.isReversed }]
      });

      try {
        await logReading(user.id, 'daily_card', [dailyReading.card.id], `${dailyReading.card.name}${dailyReading.isReversed ? ' (Reversed)' : ''}`);
        console.log('✅ [Reading] Daily card logged:', dailyReading.card.name);
      } catch (error) {
        console.error('❌ [Reading] Error logging daily card:', error);
      }

      try {
        const reward = await trackQuestProgress(user.id, 'draw_daily_card', 1);
        if (reward) {
          console.log(`🎉 Quest Completed! Reward: ${reward.coins} coins, ${reward.xp} XP`);
        }
      } catch (error) {
        console.error('❌ [Quest] Error updating daily card quest:', error);
      }
    }
  };

  const handleNewQuestion = () => {
    if (dailyReading) {
      const updatedReading = { ...dailyReading, question: undefined };
      setDailyReading(updatedReading);
      localStorage.setItem('dailyCard', JSON.stringify(updatedReading));
    }
    setIsRevealed(false);
    setShowQuestion(true);
  };

  const getCardMeta = (card: TarotCard) => {
    if (card.arcana === 'major') return 'Major Arcana';
    if (card.suit && SUITS[card.suit]) return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    return 'Minor Arcana';
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

  const { card, isReversed, question } = dailyReading;
  const meaning = isReversed ? card.reversed_meaning : card.meaning;
  const keywords = isReversed ? card.reversed_keywords : card.keywords;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(ellipse at 50% 0%, #14101c 0%, #0a0600 55%, #07050a 100%)',
      color: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={() => onNavigate?.('home')}
          style={{ 
            background: 'rgba(197, 160, 89, 0.1)', border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '50%', 
            width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: '#C5A059', cursor: 'pointer', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(197, 160, 89, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(197, 160, 89, 0.1)')}
        >
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#C5A059', letterSpacing: '2px', textTransform: 'uppercase' }}>Daily Card</h1>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div style={{ width: '44px' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '480px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          {showQuestion ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              style={{ 
                textAlign: 'center', padding: '32px 24px', background: 'rgba(26, 21, 16, 0.6)',
                border: '1px solid rgba(197, 160, 89, 0.15)', borderRadius: '20px', backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px', filter: 'drop-shadow(0 0 15px rgba(197, 160, 89, 0.4))' }}>🔮</div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#C5A059', marginBottom: '8px' }}>Ask Your Question</h2>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5' }}>
                Take a moment to focus on what you'd like guidance about today.
              </p>
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <QuestionInput onSubmit={handleQuestionSubmit} />
              </div>
            </motion.div>
          ) : !isRevealed ? (
            <motion.div 
              key="hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px' }}
            >
              {question && (
                <div style={{ 
                  marginBottom: '24px', padding: '16px', background: 'rgba(197, 160, 89, 0.05)', 
                  border: '1px solid rgba(197, 160, 89, 0.2)', borderRadius: '12px', width: '100%', textAlign: 'center'
                }}>
                  <span style={{ fontSize: '11px', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Your Question</span>
                  <p style={{ fontSize: '15px', color: '#e2e8f0', fontStyle: 'italic', margin: 0 }}>"{question}"</p>
                </div>
              )}
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReveal}
                style={{ 
                  width: '240px', height: '360px', borderRadius: '16px', overflow: 'hidden', 
                  boxShadow: '0 0 40px rgba(197, 160, 89, 0.2), 0 10px 30px rgba(0,0,0,0.5)',
                  cursor: 'pointer', border: '2px solid #C5A059', position: 'relative'
                }}
              >
                <img src={CARD_BACK_URL} alt="Card Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.1), transparent)', pointerEvents: 'none' }} />
              </motion.div>
              
              <p style={{ marginTop: '24px', fontSize: '14px', color: '#94a3b8', letterSpacing: '0.5px' }}>
                Tap the card to reveal your destiny
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="revealed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '40px' }}
            >
              {question && (
                <div style={{ 
                  marginBottom: '20px', padding: '12px 20px', background: 'rgba(197, 160, 89, 0.05)', 
                  border: '1px solid rgba(197, 160, 89, 0.2)', borderRadius: '20px', textAlign: 'center', maxWidth: '100%'
                }}>
                  <span style={{ fontSize: '10px', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Question</span>
                  <p style={{ fontSize: '14px', color: '#e2e8f0', fontStyle: 'italic', margin: '4px 0 0 0' }}>"{question}"</p>
                </div>
              )}

              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <motion.div
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: isReversed ? 180 : 0, opacity: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ 
                    width: '240px', height: '360px', borderRadius: '16px', overflow: 'hidden', 
                    boxShadow: '0 0 40px rgba(197, 160, 89, 0.3), 0 10px 30px rgba(0,0,0,0.6)',
                    border: '2px solid #C5A059', transformStyle: 'preserve-3d',
                    transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                >
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2a2215, #1a1510)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#C5A059' }}>{card.number}</span>
                      <span style={{ fontSize: '36px' }}>✦</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#C5A059', textAlign: 'center', padding: '0 16px' }}>{card.name}</span>
                    </div>
                  )}
                </motion.div>

                {isReversed && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    style={{ 
                      position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', zIndex: 10, 
                      background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', color: '#fff', border: '2px solid #fff', 
                      boxShadow: '0 0 0 2px rgba(167,139,250,0.5), 0 4px 12px rgba(167,139,250,0.8)' 
                    }}
                  >
                    R
                  </motion.div>
                )}
              </div>

              <div style={{ width: '100%', background: 'rgba(26, 21, 16, 0.8)', border: '1px solid rgba(197, 160, 89, 0.2)', borderRadius: '20px', padding: '24px', backdropFilter: 'blur(10px)' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{getCardMeta(card)}</div>
                  <h2 style={{ margin: 0, fontSize: '24px', color: '#C5A059', fontWeight: '700', letterSpacing: '0.5px' }}>{card.name}</h2>
                  {isReversed && (
                    <span style={{ 
                      display: 'inline-block', marginTop: '8px', background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', 
                      padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                      border: '1px solid rgba(167, 139, 250, 0.3)', letterSpacing: '0.5px'
                    }}>
                      REVERSED
                    </span>
                  )}
                </div>

                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.3), transparent)', margin: '20px 0' }} />

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '13px', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} /> {isReversed ? 'Reversed Meaning' : 'Meaning'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.85)', fontStyle: 'italic' }}>
                    "{meaning}"
                  </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '13px', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Keywords</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {keywords.map((keyword: string, idx: number) => (
                      <span key={idx} style={{ 
                        background: 'rgba(197, 160, 89, 0.1)', color: '#e2e8f0', padding: '6px 14px', borderRadius: '20px', 
                        fontSize: '12px', fontWeight: '500', border: '1px solid rgba(197, 160, 89, 0.2)'
                      }}>
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'rgba(197, 160, 89, 0.05)', border: '1px solid rgba(197, 160, 89, 0.15)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#b3a68c', textAlign: 'center' }}>
                    {isReversed 
                      ? `Today's energy invites you to reflect on ${keywords[0]}. Consider where you might be holding back or need to approach situations differently.`
                      : `Today's energy supports ${keywords[0]}. Embrace this quality as you move through your day.`
                    }
                  </p>
                </div>

                <button 
                  onClick={handleNewQuestion}
                  style={{
                    width: '100%', padding: '14px', background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '12px', color: '#C5A059',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(197, 160, 89, 0.1)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <RotateCcw size={16} />
                  <span>Ask New Question</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}