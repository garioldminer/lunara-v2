import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Lock } from 'lucide-react';
import { tarotCards, TarotCard, SUITS, CARD_BACK_URL } from '../data/tarotCards';
import QuestionInput from './QuestionInput';
import PremiumPaywall from './PremiumPaywall';
import { isPremium, PremiumFeatureId, getAvailableCredits, decrementCredit } from '../lib/premiumService';
import { saveReading } from '../lib/readingService';
import { useUser } from '../context/UserContext';
import './HorseshoeReadingScreen.css';

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

const HORSESHOE_POSITIONS = [
  { key: 'past', label: 'Past', subtitle: 'What has led you here', short: '1' },
  { key: 'present', label: 'Present', subtitle: 'Current situation', short: '2' },
  { key: 'hidden', label: 'Hidden Influences', subtitle: 'What you may not see', short: '3' },
  { key: 'obstacles', label: 'Obstacles', subtitle: 'Challenges ahead', short: '4' },
  { key: 'environment', label: 'Environment', subtitle: 'External factors', short: '5' },
  { key: 'hopes', label: 'Hopes/Fears', subtitle: 'Your inner feelings', short: '6' },
  { key: 'outcome', label: 'Outcome', subtitle: 'Final result', short: '7' },
];

export default function HorseshoeReadingScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [phase, setPhase] = useState<ReadingPhase>('intro');
  const [reading, setReading] = useState<ReadingCard[]>([]);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [activeFeature] = useState<PremiumFeatureId>('horseshoe');

  const handleQuestionSubmit = async (q: string) => {
    if (!user) return;

    const hasPremium = await isPremium(user.id);
    
    if (!hasPremium) {
      const credits = await getAvailableCredits(user.id);
      const featureCredits = credits[activeFeature] || 0;

      if (featureCredits <= 0) {
        setShowPaywall(true);
        return;
      }

      const success = await decrementCredit(user.id, activeFeature);
      
      if (!success) {
        alert('Failed to use credit. Please try again.');
        return;
      }

      console.log(`✅ Credit decremented for ${activeFeature}. Remaining:`, featureCredits - 1);
    }

    setQuestion(q);
    setPhase('revealing');
    startReading();
  };

  const handleBeginReading = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    const hasPremium = await isPremium(user.id);

    if (hasPremium) {
      setPhase('question');
      return;
    }

    setShowPaywall(true);
  };

  const startReading = () => {
    const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 7);
    
    const newReading: ReadingCard[] = selected.map((card, idx) => ({
      card,
      isReversed: Math.random() < 0.5,
      position: HORSESHOE_POSITIONS[idx].key,
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
          reading_type: 'horseshoe',
          question: question,
          cards: newReading.map(rc => ({
            id: rc.card.id,
            name: rc.card.name,
            is_reversed: rc.isReversed,
            position: rc.position
          }))
        });
      }
    }, 600 + 7 * 400 + 500);
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
      past: `This card reveals the past events and experiences that have shaped your current situation. ${meaning}`,
      present: `This represents your current circumstances and where you stand right now. ${meaning}`,
      hidden: `This card shows hidden influences or factors you may not be fully aware of. ${meaning}`,
      obstacles: `This reveals the challenges and obstacles you may face on your path. ${meaning}`,
      environment: `This shows the external environment and people around you affecting your situation. ${meaning}`,
      hopes: `This represents your deepest hopes, fears, and expectations about the future. ${meaning}`,
      outcome: `This is the likely outcome if you continue on your current path. ${meaning}`,
    };
    return interpretations[position] || meaning;
  };

  return (
    <div className="horseshoe-reading-screen">
      <div className="hr-header">
        {onNavigate && (
          <button className="hr-back-btn" onClick={() => onNavigate('home')}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="hr-header-center">
          <div className="hr-ornament"></div>
          <h1 className="hr-title">Horseshoe</h1>
          <div className="hr-ornament">✦</div>
        </div>
        <div className="hr-header-spacer" />
      </div>

      {phase === 'intro' && (
        <motion.div 
          className="hr-intro"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hr-intro-icon"></div>
          <h2 className="hr-intro-title">Life Path Analysis</h2>
          <p className="hr-intro-text">
            The Horseshoe spread reveals 7 key aspects of your life path: past influences, present situation, hidden factors, obstacles, environment, hopes & fears, and the final outcome.
          </p>
          <div className="hr-price-badge">
            <Lock size={14} />
            <span>Premium Reading</span>
          </div>
          <button 
            className="hr-begin-btn" 
            onClick={handleBeginReading}
          >
            <span>Begin Reading</span>
            <span className="hr-btn-ornament">✦</span>
          </button>
        </motion.div>
      )}

      {phase === 'question' && (
        <motion.div
          className="hr-question-phase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hr-question-icon">✨</div>
          <h2 className="hr-question-title">Ask Your Question</h2>
          <p className="hr-question-text">
            Focus on your life path. The Horseshoe will reveal insights across 7 dimensions.
          </p>
          <QuestionInput onSubmit={handleQuestionSubmit} />
        </motion.div>
      )}

      {(phase === 'revealing' || phase === 'complete') && (
        <div className="hr-reading">
          {question && (
            <div className="hr-question-display">
              <span className="hr-question-label">Your question:</span>
              <p className="hr-question-text-display">"{question}"</p>
            </div>
          )}

          <div className="hr-cards-layout">
            {reading.map((readingCard, idx) => (
              <motion.div
                key={idx}
                className={`hr-card-slot ${readingCard.revealed ? 'revealed' : ''} ${activeCard === idx ? 'active' : ''} position-${idx + 1}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                onClick={() => phase === 'complete' && setActiveCard(activeCard === idx ? null : idx)}
              >
                <div className="hr-position-label">{HORSESHOE_POSITIONS[idx].short}</div>
                
                <div className="hr-card-wrapper">
                  <AnimatePresence mode="wait">
                    {!readingCard.revealed ? (
                      <motion.div
                        key="back"
                        className="hr-card-back"
                        initial={{ rotateY: 0 }}
                        exit={{ rotateY: 180 }}
                        transition={{ duration: 0.5 }}
                      >
                        <img 
                          src={CARD_BACK_URL} 
                          alt="Card Back"
                          className="hr-card-back-image"
                          draggable={false}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="front"
                        className="hr-card-front"
                        initial={{ rotateY: -180 }}
                        animate={{ rotateY: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {readingCard.card.image_url ? (
                          <img 
                            src={readingCard.card.image_url} 
                            alt={readingCard.card.name}
                            className="hr-card-image"
                            style={{ transform: readingCard.isReversed ? 'rotate(180deg)' : 'none' }}
                          />
                        ) : (
                          <div className="hr-card-placeholder">
                            <span className="hr-placeholder-num">{readingCard.card.number}</span>
                            <span className="hr-placeholder-name">{readingCard.card.name}</span>
                          </div>
                        )}
                        {readingCard.isReversed && (
                          <div className="hr-reversed-badge">R</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {phase === 'complete' && (
              <motion.div 
                className="hr-interpretation"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="hr-ornament-line">✦ ─── ✦</div>
                
                {activeCard !== null ? (
                  <motion.div 
                    key={activeCard}
                    className="hr-single-interpretation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="hr-interp-position">
                      {HORSESHOE_POSITIONS[activeCard].label}
                    </div>
                    <h3 className="hr-interp-card-name">
                      {reading[activeCard].card.name}
                    </h3>
                    {reading[activeCard].isReversed && (
                      <div className="hr-interp-reversed">(Reversed)</div>
                    )}
                    <p className="hr-interp-meta">
                      {getCardMeta(reading[activeCard].card)}
                    </p>
                    <p className="hr-interp-text">
                      {getPositionInterpretation(
                        reading[activeCard].position, 
                        reading[activeCard].card,
                        reading[activeCard].isReversed
                      )}
                    </p>
                    <div className="hr-interp-keywords">
                      {(reading[activeCard].isReversed 
                        ? reading[activeCard].card.reversed_keywords 
                        : reading[activeCard].card.keywords
                      ).map((kw, i) => (
                        <span key={i} className="hr-keyword">{kw}</span>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="hr-all-interpretations">
                    <p className="hr-tap-hint">Tap a card for detailed interpretation</p>
                    {reading.map((rc, idx) => (
                      <div key={idx} className="hr-interp-block">
                        <div className="hr-interp-header">
                          <span className="hr-interp-position-small">{HORSESHOE_POSITIONS[idx].label}</span>
                          <span className="hr-interp-dot">·</span>
                          <span className="hr-interp-card-name-small">{rc.card.name}</span>
                          {rc.isReversed && <span className="hr-interp-reversed-small">(R)</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button className="hr-new-reading-btn" onClick={resetReading}>
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
        highlightedFeature="horseshoe"
        onPurchase={(featureId: PremiumFeatureId) => {
          console.log('✅ Purchased:', featureId);
          setShowPaywall(false);
          setPhase('question');
        }}
        onUse={(featureId: PremiumFeatureId) => {
          console.log('🎯 Using feature:', featureId);
          setShowPaywall(false);
          setPhase('question');
        }}
      />
    </div>
  );
}