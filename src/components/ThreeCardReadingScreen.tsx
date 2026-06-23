import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { tarotCards, TarotCard, SUITS, CARD_BACK_URL } from '../data/tarotCards';
import QuestionInput from './QuestionInput';
import { saveReading } from '../lib/readingService';
import { useUser } from '../context/UserContext';
import './ThreeCardReadingScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

type ReadingPhase = 'intro' | 'question' | 'revealing' | 'complete';

interface ReadingCard {
  card: TarotCard;
  isReversed: boolean;
  position: 'past' | 'present' | 'future';
  revealed: boolean;
}

export default function ThreeCardReadingScreen({ onNavigate }: Props) {
  const [phase, setPhase] = useState<ReadingPhase>('intro');
  const [reading, setReading] = useState<ReadingCard[]>([]);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [question, setQuestion] = useState<string>('');
  const { user } = useUser();

  const positions = [
    { key: 'past', label: 'Past', subtitle: 'What led you here' },
    { key: 'present', label: 'Present', subtitle: 'Current energy' },
    { key: 'future', label: 'Future', subtitle: "What's coming" },
  ];

  const handleQuestionSubmit = (q: string) => {
    setQuestion(q);
    setPhase('revealing');
    startReading();
  };

  const startReading = () => {
    const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    
    const newReading: ReadingCard[] = [
      { card: selected[0], isReversed: Math.random() < 0.5, position: 'past', revealed: false },
      { card: selected[1], isReversed: Math.random() < 0.5, position: 'present', revealed: false },
      { card: selected[2], isReversed: Math.random() < 0.5, position: 'future', revealed: false },
    ];
    
    setReading(newReading);
    setActiveCard(null);

    setTimeout(() => revealCard(0), 800);
    setTimeout(() => revealCard(1), 1800);
    setTimeout(() => revealCard(2), 2800);
    setTimeout(() => {
      setPhase('complete');
      
      // შეინახე წაკითხვა Supabase-ში
      if (user) {
        saveReading({
          user_id: user.id,
          reading_type: 'three-card',
          question: question,
          cards: newReading.map(rc => ({
            id: rc.card.id,
            name: rc.card.name,
            is_reversed: rc.isReversed,
            position: rc.position
          }))
        });
      }
    }, 3800);
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
      past: `This card reveals the energies and events that have shaped your current path. ${meaning}`,
      present: `The present moment is defined by this energy. ${meaning}`,
      future: `This card illuminates what is emerging in your life. ${meaning}`,
    };
    return interpretations[position] || meaning;
  };

  return (
    <div className="three-card-screen">
      <div className="tcr-header">
        {onNavigate && (
          <button className="tcr-back-btn" onClick={() => onNavigate('home')}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="tcr-header-center">
          <div className="tcr-ornament">✦</div>
          <h1 className="tcr-title">Three Card Reading</h1>
          <div className="tcr-ornament">✦</div>
        </div>
        <div className="tcr-header-spacer" />
      </div>

      {/* INTRO PHASE */}
      {phase === 'intro' && (
        <motion.div 
          className="tcr-intro"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="tcr-intro-icon">🔮</div>
          <h2 className="tcr-intro-title">Past · Present · Future</h2>
          <p className="tcr-intro-text">
            This reading reveals the energies of your past, present, and future. Take a moment to center yourself.
          </p>
          <button className="tcr-begin-btn" onClick={() => setPhase('question')}>
            <span>Begin Reading</span>
            <span className="tcr-btn-ornament">✦</span>
          </button>
        </motion.div>
      )}

      {/* QUESTION PHASE */}
      {phase === 'question' && (
        <motion.div
          className="tcr-question-phase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="tcr-question-icon">✨</div>
          <h2 className="tcr-question-title">Ask Your Question</h2>
          <p className="tcr-question-text">
            Focus on what you'd like guidance about. The cards will reveal insights across time.
          </p>
          <QuestionInput onSubmit={handleQuestionSubmit} />
        </motion.div>
      )}

      {/* REVEALING / COMPLETE PHASE */}
      {(phase === 'revealing' || phase === 'complete') && (
        <div className="tcr-reading">
          {/* Question Display */}
          {question && (
            <div className="tcr-question-display">
              <span className="tcr-question-label">Your question:</span>
              <p className="tcr-question-text-display">"{question}"</p>
            </div>
          )}

          <div className="tcr-cards-row">
            {reading.map((readingCard, idx) => (
              <motion.div
                key={idx}
                className={`tcr-card-slot ${readingCard.revealed ? 'revealed' : ''} ${activeCard === idx ? 'active' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
                onClick={() => phase === 'complete' && setActiveCard(activeCard === idx ? null : idx)}
              >
                <div className="tcr-position-label">{positions[idx].label}</div>
                <div className="tcr-position-subtitle">{positions[idx].subtitle}</div>
                
                <div className="tcr-card-wrapper">
                  <AnimatePresence mode="wait">
                    {!readingCard.revealed ? (
                      <motion.div
                        key="back"
                        className="tcr-card-back"
                        initial={{ rotateY: 0 }}
                        exit={{ rotateY: 180 }}
                        transition={{ duration: 0.6 }}
                      >
                        <img 
                          src={CARD_BACK_URL} 
                          alt="Card Back"
                          className="tcr-card-back-image"
                          draggable={false}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="front"
                        className="tcr-card-front"
                        initial={{ rotateY: -180 }}
                        animate={{ rotateY: 0 }}
                        transition={{ duration: 0.6 }}
                      >
                        {readingCard.card.image_url ? (
                          <img 
                            src={readingCard.card.image_url} 
                            alt={readingCard.card.name}
                            className="tcr-card-image"
                            style={{ transform: readingCard.isReversed ? 'rotate(180deg)' : 'none' }}
                          />
                        ) : (
                          <div className="tcr-card-placeholder">
                            <span className="tcr-placeholder-num">{readingCard.card.number}</span>
                            <span className="tcr-placeholder-name">{readingCard.card.name}</span>
                          </div>
                        )}
                        {readingCard.isReversed && (
                          <div className="tcr-reversed-badge">R</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {readingCard.revealed && (
                  <motion.div 
                    className="tcr-card-name"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {readingCard.card.name}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {phase === 'complete' && (
              <motion.div 
                className="tcr-interpretation"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="tcr-ornament-line">✦ ─── ✦</div>
                
                {activeCard !== null ? (
                  <motion.div 
                    key={activeCard}
                    className="tcr-single-interpretation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="tcr-interp-position">
                      {positions[activeCard].label}
                    </div>
                    <h3 className="tcr-interp-card-name">
                      {reading[activeCard].card.name}
                    </h3>
                    {reading[activeCard].isReversed && (
                      <div className="tcr-interp-reversed">(Reversed)</div>
                    )}
                    <p className="tcr-interp-meta">
                      {getCardMeta(reading[activeCard].card)}
                    </p>
                    <p className="tcr-interp-text">
                      {getPositionInterpretation(
                        reading[activeCard].position, 
                        reading[activeCard].card,
                        reading[activeCard].isReversed
                      )}
                    </p>
                    <div className="tcr-interp-keywords">
                      {(reading[activeCard].isReversed 
                        ? reading[activeCard].card.reversed_keywords 
                        : reading[activeCard].card.keywords
                      ).map((kw, i) => (
                        <span key={i} className="tcr-keyword">{kw}</span>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="tcr-all-interpretations">
                    {reading.map((rc, idx) => (
                      <div key={idx} className="tcr-interp-block">
                        <div className="tcr-interp-header">
                          <span className="tcr-interp-position">{positions[idx].label}</span>
                          <span className="tcr-interp-dot">·</span>
                          <span className="tcr-interp-card-name-small">{rc.card.name}</span>
                          {rc.isReversed && <span className="tcr-interp-reversed-small">(R)</span>}
                        </div>
                        <p className="tcr-interp-text">
                          {getPositionInterpretation(rc.position, rc.card, rc.isReversed)}
                        </p>
                      </div>
                    ))}
                    <p className="tcr-tap-hint">Tap a card for more details</p>
                  </div>
                )}

                <button className="tcr-new-reading-btn" onClick={resetReading}>
                  <RotateCcw size={16} />
                  <span>New Reading</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}