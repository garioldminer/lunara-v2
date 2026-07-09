import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Lock, Star } from 'lucide-react';
import { tarotCards, TarotCard, SUITS, CARD_BACK_URL } from '../data/tarotCards';
import QuestionInput from './QuestionInput';
import PremiumPaywall from './PremiumPaywall';
import { isPremium, PremiumFeatureId, getAvailableCredits, decrementCredit } from '../lib/premiumService';
import { saveReading } from '../lib/readingService';
import { logReading } from '../lib/adminService';
import { useUser } from '../context/UserContext';
import './RelationshipReadingScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

type ReadingPhase = 'intro' | 'question' | 'revealing' | 'complete';

interface ReadingCard {
  card: TarotCard;
  isReversed: boolean;
  position: string;
  revealed: boolean;
}

const RELATIONSHIP_POSITIONS = [
  { key: 'you', label: 'You', subtitle: 'Your feelings & energy', short: '1' },
  { key: 'partner', label: 'Partner', subtitle: 'Their feelings & energy', short: '2' },
  { key: 'connection', label: 'Connection', subtitle: 'Your bond together', short: '3' },
  { key: 'challenges', label: 'Challenges', subtitle: 'What tests your relationship', short: '4' },
  { key: 'strengths', label: 'Strengths', subtitle: 'What makes you strong', short: '5' },
  { key: 'future', label: 'Future', subtitle: 'Where this is heading', short: '6' },
];

export default function RelationshipReadingScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [phase, setPhase] = useState<ReadingPhase>('intro');
  const [reading, setReading] = useState<ReadingCard[]>([]);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [activeFeature] = useState<PremiumFeatureId>('relationship');

  const checkAccess = async (): Promise<boolean> => {
    if (!user) return false;
    const hasPremium = await isPremium(user.id);
    if (hasPremium) return true;
    const credits = await getAvailableCredits(user.id);
    return (credits[activeFeature] || 0) > 0;
  };

  const handleBeginReading = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }
    const hasAccess = await checkAccess();
    if (hasAccess) {
      setPhase('question');
    } else {
      setShowPaywall(true);
    }
  };

  const handleQuestionSubmit = async (q: string) => {
    if (!user) return;

    const hasPremium = await isPremium(user.id);
    
    if (!hasPremium) {
      const credits = await getAvailableCredits(user.id);
      const remaining = credits[activeFeature] || 0;

      if (remaining <= 0) {
        setShowPaywall(true);
        return;
      }

      const success = await decrementCredit(user.id, activeFeature);
      
      if (!success) {
        alert('Failed to use credit. Please try again.');
        return;
      }

      setCreditsRemaining(remaining - 1);
      console.log(`✅ Credit decremented for ${activeFeature}. Remaining:`, remaining - 1);
    }

    setQuestion(q);
    setPhase('revealing');
    startReading();
  };

  const startReading = () => {
    const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 6);
    
    const newReading: ReadingCard[] = selected.map((card, idx) => ({
      card,
      isReversed: Math.random() < 0.5,
      position: RELATIONSHIP_POSITIONS[idx].key,
      revealed: false
    }));
    
    setReading(newReading);
    setActiveCard(null);

    newReading.forEach((_, idx) => {
      setTimeout(() => revealCard(idx), 600 + idx * 400);
    });
    
    setTimeout(() => {
      setPhase('complete');
      
      if (user) {
        saveReading({
          user_id: user.id,
          reading_type: 'relationship',
          question: question,
          cards: newReading.map(rc => ({
            id: rc.card.id,
            name: rc.card.name,
            is_reversed: rc.isReversed,
            position: rc.position
          }))
        });

        // 🆕 ეტაპი 3: ჩაწერა reading_history ცხრილში
        try {
          logReading(
            user.id,
            'relationship',
            newReading.map(rc => rc.card.id),
            newReading.map(rc => `${rc.card.name}${rc.isReversed ? ' (R)' : ''}`).join(', ')
          ).then(() => {
            console.log('✅ [Reading] Relationship logged:', newReading.map(rc => rc.card.name).join(', '));
          }).catch(err => {
            console.error('❌ [Reading] Error logging relationship:', err);
          });
        } catch (error) {
          console.error('❌ [Reading] Error:', error);
        }
      }
    }, 600 + 6 * 400 + 500);
  };

  const revealCard = (index: number) => {
    setReading(prev => prev.map((r, i) => i === index ? { ...r, revealed: true } : r));
  };

  const handleNewReading = async () => {
    setReading([]);
    setActiveCard(null);
    setQuestion('');
    setCreditsRemaining(null);
    
    const hasAccess = await checkAccess();
    if (hasAccess) {
      setPhase('question');
    } else {
      setShowPaywall(true);
    }
  };

  const getCardMeta = (card: TarotCard) => {
    if (card.arcana === 'major') return 'Major Arcana';
    if (card.suit && SUITS[card.suit]) {
      return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    }
    return 'Minor Arcana';
  };

  const getPositionInterpretation = (position: string, card: TarotCard, isReversed: boolean) => {
    const meaning = isReversed ? card.reversed_meaning : card.meaning;
    const interpretations: Record<string, string> = {
      you: `This card represents your energy, feelings, and attitude in this relationship. ${meaning}`,
      partner: `This reveals your partner's energy, feelings, and perspective on the relationship. ${meaning}`,
      connection: `This shows the nature of your bond and what connects you two together. ${meaning}`,
      challenges: `This reveals the challenges and tests your relationship is facing or will face. ${meaning}`,
      strengths: `This highlights the strengths and positive aspects that make your relationship strong. ${meaning}`,
      future: `This indicates where your relationship is heading and the likely outcome. ${meaning}`,
    };
    return interpretations[position] || meaning;
  };

  const topRow = reading.slice(0, 3);
  const bottomRow = reading.slice(3, 6);

  return (
    <div className="relationship-reading-screen">
      <div className="rr-header">
        {onNavigate && (
          <button className="rr-back-btn" onClick={() => onNavigate('home')}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="rr-header-center">
          <div className="rr-ornament">❤️</div>
          <h1 className="rr-title">Relationship</h1>
          <div className="rr-ornament">✦</div>
        </div>
        <div className="rr-header-spacer" />
      </div>

      {phase === 'intro' && (
        <motion.div 
          className="rr-intro"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="rr-intro-icon">❤️</div>
          <h2 className="rr-intro-title">Love & Connection</h2>
          <p className="rr-intro-text">
            The Relationship spread reveals 6 key aspects of your love life: your energy, your partner's energy, your connection, challenges, strengths, and the future of your relationship.
          </p>
          <div className="rr-price-badge">
            <Lock size={14} />
            <span>Premium Reading</span>
          </div>
          <button 
            className="rr-begin-btn" 
            onClick={handleBeginReading}
          >
            <span>Begin Reading</span>
            <span className="rr-btn-ornament">✦</span>
          </button>
        </motion.div>
      )}

      {phase === 'question' && (
        <motion.div
          className="rr-question-phase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="rr-question-icon">💕</div>
          <h2 className="rr-question-title">Ask About Your Relationship</h2>
          <p className="rr-question-text">
            Focus on your partner or relationship. The cards will reveal deep insights about your connection.
          </p>
          <QuestionInput onSubmit={handleQuestionSubmit} />
        </motion.div>
      )}

      {(phase === 'revealing' || phase === 'complete') && (
        <div className="rr-reading">
          {question && (
            <div className="rr-question-display">
              <span className="rr-question-label">Your question:</span>
              <p className="rr-question-text-display">"{question}"</p>
            </div>
          )}

          <div className="rr-cards-container">
            <div className="rr-cards-row">
              {topRow.map((readingCard, idx) => {
                const realIndex = idx;
                return (
                  <motion.div
                    key={realIndex}
                    className={`rr-card-slot ${readingCard.revealed ? 'revealed' : ''} ${activeCard === realIndex ? 'active' : ''}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: realIndex * 0.1, duration: 0.4 }}
                    onClick={() => phase === 'complete' && setActiveCard(activeCard === realIndex ? null : realIndex)}
                  >
                    <div className="rr-position-label">{RELATIONSHIP_POSITIONS[realIndex].short}</div>
                    
                    <motion.div
                      className="rr-card-wrapper"
                      initial={{ rotateY: 0, translateY: 0, scale: 1 }}
                      animate={readingCard.revealed ? {
                        rotateY: 180,
                        translateY: [0, -12, 0],
                        scale: [1, 1.03, 1]
                      } : {
                        rotateY: 0,
                        translateY: 0,
                        scale: 1
                      }}
                      transition={{
                        rotateY: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
                        translateY: { duration: 0.8, ease: "easeInOut" },
                        scale: { duration: 0.8, ease: "easeInOut" }
                      }}
                    >
                      <div className="rr-card-back">
                        <img src={CARD_BACK_URL} alt="Card Back" className="rr-card-back-image" draggable={false} />
                      </div>
                      <div className="rr-card-front">
                        <div className="rr-card-front-content">
                          {readingCard.card.image_url ? (
                            <img 
                              src={readingCard.card.image_url} 
                              alt={readingCard.card.name} 
                              className="rr-card-image" 
                              style={{ transform: readingCard.isReversed ? 'rotate(180deg)' : 'none' }} 
                            />
                          ) : (
                            <div className="rr-card-placeholder">
                              <span className="rr-placeholder-num">{readingCard.card.number}</span>
                              <span className="rr-placeholder-name">{readingCard.card.name}</span>
                            </div>
                          )}
                          {readingCard.isReversed && <div className="rr-reversed-badge">R</div>}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            <div className="rr-cards-row rr-cards-row-bottom">
              {bottomRow.map((readingCard, idx) => {
                const realIndex = idx + 3;
                return (
                  <motion.div
                    key={realIndex}
                    className={`rr-card-slot ${readingCard.revealed ? 'revealed' : ''} ${activeCard === realIndex ? 'active' : ''}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: realIndex * 0.1, duration: 0.4 }}
                    onClick={() => phase === 'complete' && setActiveCard(activeCard === realIndex ? null : realIndex)}
                  >
                    <motion.div
                      className="rr-card-wrapper"
                      initial={{ rotateY: 0, translateY: 0, scale: 1 }}
                      animate={readingCard.revealed ? {
                        rotateY: 180,
                        translateY: [0, -12, 0],
                        scale: [1, 1.03, 1]
                      } : {
                        rotateY: 0,
                        translateY: 0,
                        scale: 1
                      }}
                      transition={{
                        rotateY: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
                        translateY: { duration: 0.8, ease: "easeInOut" },
                        scale: { duration: 0.8, ease: "easeInOut" }
                      }}
                    >
                      <div className="rr-card-back">
                        <img src={CARD_BACK_URL} alt="Card Back" className="rr-card-back-image" draggable={false} />
                      </div>
                      <div className="rr-card-front">
                        <div className="rr-card-front-content">
                          {readingCard.card.image_url ? (
                            <img 
                              src={readingCard.card.image_url} 
                              alt={readingCard.card.name} 
                              className="rr-card-image" 
                              style={{ transform: readingCard.isReversed ? 'rotate(180deg)' : 'none' }} 
                            />
                          ) : (
                            <div className="rr-card-placeholder">
                              <span className="rr-placeholder-num">{readingCard.card.number}</span>
                              <span className="rr-placeholder-name">{readingCard.card.name}</span>
                            </div>
                          )}
                          {readingCard.isReversed && <div className="rr-reversed-badge">R</div>}
                        </div>
                      </div>
                    </motion.div>

                    <div className="rr-position-label">{RELATIONSHIP_POSITIONS[realIndex].short}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {phase === 'complete' && (
              <motion.div 
                className="rr-interpretation"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="rr-ornament-line">✦ ─── ✦</div>
                
                {activeCard !== null ? (
                  <motion.div 
                    key={activeCard}
                    className="rr-single-interpretation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="rr-interp-position">
                      {RELATIONSHIP_POSITIONS[activeCard].label}
                    </div>
                    <h3 className="rr-interp-card-name">
                      {reading[activeCard].card.name}
                    </h3>
                    {reading[activeCard].isReversed && (
                      <div className="rr-interp-reversed">(Reversed)</div>
                    )}
                    <p className="rr-interp-meta">
                      {getCardMeta(reading[activeCard].card)}
                    </p>
                    <p className="rr-interp-text">
                      {getPositionInterpretation(
                        reading[activeCard].position, 
                        reading[activeCard].card,
                        reading[activeCard].isReversed
                      )}
                    </p>
                    <div className="rr-interp-keywords">
                      {(reading[activeCard].isReversed 
                        ? reading[activeCard].card.reversed_keywords 
                        : reading[activeCard].card.keywords
                      ).map((kw, i) => (
                        <span key={i} className="rr-keyword">{kw}</span>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="rr-all-interpretations">
                    <p className="rr-tap-hint">Tap a card for detailed interpretation</p>
                    {reading.map((rc, idx) => (
                      <div key={idx} className="rr-interp-block">
                        <div className="rr-interp-header">
                          <span className="rr-interp-position-small">{RELATIONSHIP_POSITIONS[idx].label}</span>
                          <span className="rr-interp-dot">·</span>
                          <span className="rr-interp-card-name-small">{rc.card.name}</span>
                          {rc.isReversed && <span className="rr-interp-reversed-small">(R)</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {creditsRemaining !== null && creditsRemaining > 0 && (
                  <motion.div 
                    className="rr-credits-banner"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Star size={16} fill="#C5A059" />
                    <span>{creditsRemaining} reading{creditsRemaining !== 1 ? 's' : ''} remaining</span>
                  </motion.div>
                )}

                <button className="rr-new-reading-btn" onClick={handleNewReading}>
                  <RotateCcw size={16} />
                  <span>New Reading</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <PremiumPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        highlightedFeature="relationship"
        onPurchase={() => {
          setShowPaywall(false);
          setPhase('question');
        }}
        onUse={() => {
          setShowPaywall(false);
          setPhase('question');
        }}
      />
    </div>
  );
}