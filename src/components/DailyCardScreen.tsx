import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Sparkles, Heart, Briefcase, Star, Share2, Lock } from 'lucide-react';
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
      getActiveSubscription(user.id).then(sub => {
        setHasPremium(!!sub);
      });
    }
  }, [user]);

  const generateDailyCard = () => {
    const today = getTodayDate();
    const dayOfYear = getDayOfYear(new Date());
    const cardIndex = dayOfYear % tarotCards.length;
    const card = tarotCards[cardIndex];
    const isReversed = Math.random() < 0.5;
    
    const newReading: DailyReading = {
      card,
      isReversed,
      date: today,
      focusArea: 'general'
    };
    
    localStorage.setItem('dailyCard', JSON.stringify(newReading));
    setDailyReading(newReading);
  };

  const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const handleFocusSelect = (focus: FocusArea) => {
    setSelectedFocus(focus);
    if (focus === 'custom') {
      setShowQuestionInput(true);
    } else {
      setShowQuestionInput(false);
    }
  };

  const handleReveal = async () => {
    if (!dailyReading) return;

    // Trigger Haptic Feedback
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    setStage('revealing');

    // Update reading with focus area
    const updatedReading = {
      ...dailyReading,
      focusArea: selectedFocus,
      question: selectedFocus === 'custom' ? customQuestion : undefined
    };
    setDailyReading(updatedReading);
    localStorage.setItem('dailyCard', JSON.stringify(updatedReading));

    // Wait for animation
    setTimeout(async () => {
      setStage('revealed');

      // Save to database
      if (user) {
        try {
          await saveReading({
            user_id: user.id,
            reading_type: 'daily',
            question: updatedReading.question,
            cards: [{
              id: updatedReading.card.id,
              name: updatedReading.card.name,
              is_reversed: updatedReading.isReversed
            }]
          });

          await logReading(
            user.id,
            'daily_card',
            [updatedReading.card.id],
            `${updatedReading.card.name}${updatedReading.isReversed ? ' (Reversed)' : ''}`
          );

          // Track quest progress
          const reward = await trackQuestProgress(user.id, 'draw_daily_card', 1);
          if (reward) {
            console.log(`🎉 Quest Completed! Reward: ${reward.coins} coins, ${reward.xp} XP`);
          }
        } catch (error) {
          console.error('❌ Error saving daily reading:', error);
        }
      }
    }, 1500);
  };

  const handleNewReading = () => {
    localStorage.removeItem('dailyCard');
    generateDailyCard();
    setStage('selecting');
    setSelectedFocus('general');
    setCustomQuestion('');
    setShowQuestionInput(false);
  };

  const handleShare = () => {
    if (!dailyReading) return;

    const { card, isReversed } = dailyReading;
    const meaning = isReversed ? card.reversed_meaning : card.meaning;
    const shareText = `🔮 My Daily Card: ${card.name}${isReversed ? ' (Reversed)' : ''}\n\n"${meaning}"\n\n#LunaraApp #DailyTarot`;

    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.openTelegramLink) {
      (window as any).Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=&text=${encodeURIComponent(shareText)}`);
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Card details copied to clipboard!');
    }
  };

  const getCardMeta = (card: TarotCard) => {
    if (card.arcana === 'major') return 'Major Arcana';
    if (card.suit && SUITS[card.suit]) return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    return 'Minor Arcana';
  };

  const getFocusIcon = (focus: FocusArea) => {
    switch (focus) {
      case 'love': return <Heart size={20} />;
      case 'career': return <Briefcase size={20} />;
      case 'custom': return <Sparkles size={20} />;
      default: return <Star size={20} />;
    }
  };

  const getFocusTitle = (focus: FocusArea) => {
    switch (focus) {
      case 'love': return 'Love & Relationships';
      case 'career': return 'Career & Finance';
      case 'custom': return 'Your Question';
      default: return 'General Energy';
    }
  };

  if (!dailyReading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'radial-gradient(ellipse at 50% 0%, #14101c 0%, #0a0600 55%, #07050a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A059' 
      }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Sparkles size={32} />
        </motion.div>
      </div>
    );
  }

  const { card, isReversed } = dailyReading;
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
          {/* STAGE 1: SELECTING FOCUS */}
          {stage === 'selecting' && (
            <motion.div
              key="selecting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '20px 0' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', filter: 'drop-shadow(0 0 15px rgba(197, 160, 89, 0.4))' }}>🔮</div>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#C5A059', marginBottom: '8px' }}>Set Your Intention</h2>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', maxWidth: '320px', margin: '0 auto' }}>
                  Choose a focus area for your daily guidance
                </p>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(['general', 'love', 'career', 'custom'] as FocusArea[]).map((focus) => (
                  <motion.button
                    key={focus}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleFocusSelect(focus)}
                    style={{
                      width: '100%', padding: '16px 20px',
                      background: selectedFocus === focus ? 'rgba(197, 160, 89, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedFocus === focus ? '2px solid #C5A059' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px', color: '#fff',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      cursor: 'pointer', transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ color: selectedFocus === focus ? '#C5A059' : '#94a3b8' }}>
                      {getFocusIcon(focus)}
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: '600', flex: 1 }}>{getFocusTitle(focus)}</span>
                    {selectedFocus === focus && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C5A059' }} />
                    )}
                  </motion.button>
                ))}
              </div>

              {showQuestionInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ width: '100%' }}
                >
                  <textarea
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="What would you like guidance on?"
                    style={{
                      width: '100%', padding: '16px', background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '12px',
                      color: '#fff', fontSize: '14px', fontFamily: 'inherit',
                      resize: 'none', minHeight: '80px', outline: 'none'
                    }}
                  />
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReveal}
                style={{
                  width: '100%', padding: '18px',
                  background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)',
                  border: 'none', borderRadius: '12px',
                  color: '#0f0c08', fontSize: '16px', fontWeight: '700',
                  letterSpacing: '1px', textTransform: 'uppercase',
                  cursor: 'pointer', boxShadow: '0 4px 20px rgba(197, 160, 89, 0.4)',
                  marginTop: '16px'
                }}
              >
                Reveal My Card
              </motion.button>
            </motion.div>
          )}

          {/* STAGE 2: REVEALING (ANIMATION) */}
          {stage === 'revealing' && (
            <motion.div
              key="revealing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 0' }}
            >
              <motion.div
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 180 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                style={{
                  width: '240px', height: '360px', borderRadius: '16px', overflow: 'hidden',
                  boxShadow: '0 0 60px rgba(197, 160, 89, 0.5), 0 10px 40px rgba(0,0,0,0.8)',
                  border: '2px solid #C5A059', transformStyle: 'preserve-3d'
                }}
              >
                <img src={CARD_BACK_URL} alt="Card Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
              </motion.div>
              <p style={{ marginTop: '32px', fontSize: '16px', color: '#C5A059', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Revealing...
              </p>
            </motion.div>
          )}

          {/* STAGE 3: REVEALED */}
          {stage === 'revealed' && (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '40px' }}
            >
              {/* Card Display */}
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <motion.div
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ 
                    width: '240px', height: '360px', borderRadius: '16px', overflow: 'hidden', 
                    boxShadow: isReversed 
                      ? '0 0 40px rgba(167, 139, 250, 0.3), 0 10px 30px rgba(0,0,0,0.6)'
                      : '0 0 40px rgba(197, 160, 89, 0.3), 0 10px 30px rgba(0,0,0,0.6)',
                    border: `2px solid ${isReversed ? '#a78bfa' : '#C5A059'}`,
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
                      position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900', zIndex: 10, 
                      background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', color: '#fff', border: '2px solid #fff', 
                      boxShadow: '0 0 0 2px rgba(167,139,250,0.5), 0 4px 12px rgba(167,139,250,0.8)' 
                    }}
                  >
                    R
                  </motion.div>
                )}
              </div>

              {/* Focus Area Badge */}
              {selectedFocus !== 'general' && (
                <div style={{ 
                  marginBottom: '20px', padding: '8px 16px', background: 'rgba(197, 160, 89, 0.1)', 
                  border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  {getFocusIcon(selectedFocus)}
                  <span style={{ fontSize: '12px', color: '#C5A059', fontWeight: '600' }}>{getFocusTitle(selectedFocus)}</span>
                </div>
              )}

              {/* Custom Question Display */}
              {selectedFocus === 'custom' && customQuestion && (
                <div style={{ 
                  marginBottom: '20px', padding: '12px 20px', background: 'rgba(197, 160, 89, 0.05)', 
                  border: '1px solid rgba(197, 160, 89, 0.2)', borderRadius: '12px', textAlign: 'center', maxWidth: '100%'
                }}>
                  <span style={{ fontSize: '10px', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Question</span>
                  <p style={{ fontSize: '14px', color: '#e2e8f0', fontStyle: 'italic', margin: '4px 0 0 0' }}>"{customQuestion}"</p>
                </div>
              )}

              {/* Card Info Panel */}
              <div style={{ 
                width: '100%', background: 'rgba(26, 21, 16, 0.8)', border: '1px solid rgba(197, 160, 89, 0.2)', 
                borderRadius: '20px', padding: '24px', backdropFilter: 'blur(10px)' 
              }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{getCardMeta(card)}</div>
                  <h2 style={{ margin: 0, fontSize: '26px', color: '#C5A059', fontWeight: '700', letterSpacing: '0.5px' }}>{card.name}</h2>
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
                  <h3 style={{ fontSize: '12px', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px', fontWeight: '700' }}>
                    {isReversed ? 'Reversed Meaning' : 'Meaning'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.7', color: 'rgba(255, 255, 255, 0.85)', fontStyle: 'italic' }}>
                    "{meaning}"
                  </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '12px', color: '#C5A059', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px', fontWeight: '700' }}>Keywords</h3>
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

                {/* Premium Upsell */}
                {!hasPremium && (
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05))',
                    border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '12px', padding: '16px',
                    marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px'
                  }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)'
                    }}>
                      <Lock size={18} style={{ color: '#0f0c08' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFD700', marginBottom: '4px' }}>AI Deep Dive</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Unlock personalized insights for this card</div>
                    </div>
                    <button 
                      onClick={() => onNavigate?.('pricing')}
                      style={{
                        padding: '8px 16px', background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                        border: 'none', borderRadius: '8px', color: '#0f0c08',
                        fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(255, 215, 0, 0.3)'
                      }}
                    >
                      Unlock
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button 
                    onClick={handleShare}
                    style={{
                      flex: 1, padding: '14px', background: 'rgba(197, 160, 89, 0.1)',
                      border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '12px', color: '#C5A059',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(197, 160, 89, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(197, 160, 89, 0.1)'; }}
                  >
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>

                  <button 
                    onClick={handleNewReading}
                    style={{
                      flex: 1, padding: '14px', background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '12px', color: '#C5A059',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(197, 160, 89, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                  >
                    <RotateCcw size={16} />
                    <span>New Card</span>
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