import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Lock } from 'lucide-react';
import { tarotCards, TarotCard, SUITS, CARD_BACK_URL } from '../data/tarotCards';
import QuestionInput from './QuestionInput';
import PremiumPaywall from './PremiumPaywall';
import { isPremium, PremiumFeatureId, getAvailableCredits, decrementCredit } from '../lib/premiumService';
import { saveReading } from '../lib/readingService';
import { useUser } from '../context/UserContext';
import './CelticCrossReadingScreen.css';

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

const CELTIC_CROSS_POSITIONS = [
  { key: 'present', label: 'Present', subtitle: 'Current situation', short: '1' },
  { key: 'challenge', label: 'Challenge', subtitle: 'What crosses you', short: '2' },
  { key: 'past', label: 'Past', subtitle: 'Foundation', short: '3' },
  { key: 'future', label: 'Future', subtitle: 'Recent past', short: '4' },
  { key: 'above', label: 'Above', subtitle: 'Conscious goal', short: '5' },
  { key: 'below', label: 'Below', subtitle: 'Subconscious', short: '6' },
  { key: 'advice', label: 'Advice', subtitle: 'Your attitude', short: '7' },
  { key: 'external', label: 'External', subtitle: 'Environment', short: '8' },
  { key: 'hopes', label: 'Hopes/Fears', subtitle: 'Inner feelings', short: '9' },
  { key: 'outcome', label: 'Outcome', subtitle: 'Final result', short: '10' },
];

export default function CelticCrossReadingScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [phase, setPhase] = useState<ReadingPhase>('intro');
  const [reading, setReading] = useState<ReadingCard[]>([]);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [showPaywall, setShowPaywall] = useState(false);

  const handleQuestionSubmit = (q: string) => {
    setQuestion(q);
    setPhase('revealing');
    startReading();
  };

  const handleBeginReading = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    // შეამოწმე Premium სტატუსი (subscription)
    const hasPremium = await isPremium(user.id);

    if (hasPremium) {
      // Premium მომხმარებელი - პირდაპირ კითხვაზე
      setPhase('question');
      return;
    }

    // შეამოწმე credits (single reading)
    const credits = await getAvailableCredits(user.id);
    const celticCrossCredits = credits['celtic_cross'] || 0;

    if (celticCrossCredits > 0) {
      // აქვს credits - პირდაპირ კითხვაზე
      setPhase('question');
      return;
    }

    // არც subscription და არც credits - აჩვენე Paywall
    setShowPaywall(true);
  };

  const startReading = () => {
    const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);
    
    const newReading: ReadingCard[] = selected.map((card, idx) => ({
      card,
      isReversed: Math.random() < 0.5,
      position: CELTIC_CROSS_POSITIONS[idx].key,
      revealed: false
    }));
    
    setReading(newReading);
    setActiveCard(null);

    // Reveal cards one by one
    newReading.forEach((_, idx) => {
      setTimeout(() => revealCard(idx), 600 + idx * 400);
    });
    
    setTimeout(() => {
      setPhase('complete');
      
      // Save reading to Supabase
      if (user) {
        saveReading({
          user_id: user.id,
          reading_type: 'celtic-cross',
          question: question,
          cards: newReading.map(rc => ({
            id: rc.card.id,
            name: rc.card.name,
            is_reversed: rc.isReversed,
            position: rc.position
          }))
        });
      }
    }, 600 + 10 * 400 + 500);
  };

  const revealCard = (index: number) => {
    setReading(prev => prev.map((r, i) => i === index ? { ...r, revealed: true } : r));
  };

  const resetReading = () => {
    setPhase('intro');
    setReading([]);
    setActiveCard(null);
    setQuestion('');
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
      present: `This card represents your current situation and the energies surrounding you now. ${meaning}`,
      challenge: `This is the immediate challenge or obstacle crossing your path. ${meaning}`,
      past: `This card reveals the foundation or past events that led to your current situation. ${meaning}`,
      future: `This represents recent events or the immediate future approaching. ${meaning}`,
      above: `This is your conscious goal, what you aspire to or are aware of striving for. ${meaning}`,
      below: `This represents your subconscious, hidden influences, or the roots of the matter. ${meaning}`,
      advice: `This card offers advice on your attitude and how you should approach the situation. ${meaning}`,
      external: `This shows external influences, other people, or your environment affecting you. ${meaning}`,
      hopes: `This reveals your innermost hopes, fears, and expectations. ${meaning}`,
      outcome: `This is the final outcome if you continue on your current path. ${meaning}`,
    };
    return interpretations[position] || meaning;
  };

  return (
    <div className="celtic-cross-screen">
      <div className="cc-header">
        {onNavigate && (
          <button className="cc-back-btn" onClick={() => onNavigate('home')}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="cc-header-center">
          <div className="cc-ornament">✦</div>
          <h1 className="cc-title">Celtic Cross</h1>
          <div className="cc-ornament">✦</div>
        </div>
        <div className="cc-header-spacer" />
      </div>

      {/* INTRO PHASE */}
      {phase === 'intro' && (
        <motion.div 
          className="cc-intro"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="cc-intro-icon">✝️</div>
          <h2 className="cc-intro-title">Deep Analysis</h2>
          <p className="cc-intro-text">
            The Celtic Cross reveals 10 aspects of your situation: present, challenge, past, future, conscious goals, subconscious influences, advice, external factors, hopes & fears, and the final outcome.
          </p>
          <div className="cc-price-badge">
            <Lock size={14} />
            <span>Premium Reading</span>
          </div>
          <button 
            className="cc-begin-btn" 
            onClick={handleBeginReading}
          >
            <span>Begin Reading</span>
            <span className="cc-btn-ornament">✦</span>
          </button>
        </motion.div>
      )}

      {/* QUESTION PHASE */}
      {phase === 'question' && (
        <motion.div
          className="cc-question-phase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="cc-question-icon">✨</div>
          <h2 className="cc-question-title">Ask Your Question</h2>
          <p className="cc-question-text">
            Focus on your situation. The Celtic Cross will reveal deep insights across 10 dimensions.
          </p>
          <QuestionInput onSubmit={handleQuestionSubmit} />
        </motion.div>
      )}

      {/* REVEALING / COMPLETE PHASE */}
      {(phase === 'revealing' || phase === 'complete') && (
        <div className="cc-reading">
          {/* Question Display */}
          {question && (
            <div className="cc-question-display">
              <span className="cc-question-label">Your question:</span>
              <p className="cc-question-text-display">"{question}"</p>
            </div>
          )}

          {/* Celtic Cross Layout */}
          <div className="cc-cards-layout">
            {reading.map((readingCard, idx) => (
              <motion.div
                key={idx}
                className={`cc-card-slot ${readingCard.revealed ? 'revealed' : ''} ${activeCard === idx ? 'active' : ''} position-${idx + 1}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                onClick={() => phase === 'complete' && setActiveCard(activeCard === idx ? null : idx)}
              >
                <div className="cc-position-label">{CELTIC_CROSS_POSITIONS[idx].short}</div>
                
                <div className="cc-card-wrapper">
                  <AnimatePresence mode="wait">
                    {!readingCard.revealed ? (
                      <motion.div
                        key="back"
                        className="cc-card-back"
                        initial={{ rotateY: 0 }}
                        exit={{ rotateY: 180 }}
                        transition={{ duration: 0.5 }}
                      >
                        <img 
                          src={CARD_BACK_URL} 
                          alt="Card Back"
                          className="cc-card-back-image"
                          draggable={false}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="front"
                        className="cc-card-front"
                        initial={{ rotateY: -180 }}
                        animate={{ rotateY: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {readingCard.card.image_url ? (
                          <img 
                            src={readingCard.card.image_url} 
                            alt={readingCard.card.name}
                            className="cc-card-image"
                            style={{ transform: readingCard.isReversed ? 'rotate(180deg)' : 'none' }}
                          />
                        ) : (
                          <div className="cc-card-placeholder">
                            <span className="cc-placeholder-num">{readingCard.card.number}</span>
                            <span className="cc-placeholder-name">{readingCard.card.name}</span>
                          </div>
                        )}
                        {readingCard.isReversed && (
                          <div className="cc-reversed-badge">R</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Interpretation */}
          <AnimatePresence>
            {phase === 'complete' && (
              <motion.div 
                className="cc-interpretation"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="cc-ornament-line">✦ ─── ✦</div>
                
                {activeCard !== null ? (
                  <motion.div 
                    key={activeCard}
                    className="cc-single-interpretation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="cc-interp-position">
                      {CELTIC_CROSS_POSITIONS[activeCard].label}
                    </div>
                    <h3 className="cc-interp-card-name">
                      {reading[activeCard].card.name}
                    </h3>
                    {reading[activeCard].isReversed && (
                      <div className="cc-interp-reversed">(Reversed)</div>
                    )}
                    <p className="cc-interp-meta">
                      {getCardMeta(reading[activeCard].card)}
                    </p>
                    <p className="cc-interp-text">
                      {getPositionInterpretation(
                        reading[activeCard].position, 
                        reading[activeCard].card,
                        reading[activeCard].isReversed
                      )}
                    </p>
                    <div className="cc-interp-keywords">
                      {(reading[activeCard].isReversed 
                        ? reading[activeCard].card.reversed_keywords 
                        : reading[activeCard].card.keywords
                      ).map((kw, i) => (
                        <span key={i} className="cc-keyword">{kw}</span>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="cc-all-interpretations">
                    <p className="cc-tap-hint">Tap a card for detailed interpretation</p>
                    {reading.map((rc, idx) => (
                      <div key={idx} className="cc-interp-block">
                        <div className="cc-interp-header">
                          <span className="cc-interp-position-small">{CELTIC_CROSS_POSITIONS[idx].label}</span>
                          <span className="cc-interp-dot">·</span>
                          <span className="cc-interp-card-name-small">{rc.card.name}</span>
                          {rc.isReversed && <span className="cc-interp-reversed-small">(R)</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button className="cc-new-reading-btn" onClick={resetReading}>
                  <RotateCcw size={16} />
                  <span>New Reading</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Premium Paywall Modal */}
      <PremiumPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        highlightedFeature="celtic_cross"
        onPurchase={(featureId: PremiumFeatureId) => {
          console.log('✅ Purchased:', featureId);
          setShowPaywall(false);
          // ავტომატურად გადადის კითხვის ფაზაზე (არა reload!)
          setPhase('question');
        }}
        onUse={(featureId: PremiumFeatureId) => {
          console.log('🎯 Using feature:', featureId);
          setShowPaywall(false);
          // გადადის კითხვის ფაზაზე
          setPhase('question');
        }}
      />
    </div>
  );
}