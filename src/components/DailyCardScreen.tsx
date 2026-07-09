import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { tarotCards, TarotCard, SUITS, CARD_BACK_URL } from '../data/tarotCards';
import QuestionInput from './QuestionInput';
import { saveReading } from '../lib/readingService';
import { logReading } from '../lib/adminService';
import { useUser } from '../context/UserContext';
import './DailyCardScreen.css';

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
    
    const newReading: DailyReading = {
      card,
      isReversed,
      date: today
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
    
    // შეინახე წაკითხვა Supabase-ში
    if (user && dailyReading) {
      await saveReading({
        user_id: user.id,
        reading_type: 'daily',
        question: dailyReading.question,
        cards: [{
          id: dailyReading.card.id,
          name: dailyReading.card.name,
          is_reversed: dailyReading.isReversed
        }]
      });

      // 🆕 ეტაპი 3: ჩაწერა reading_history ცხრილში
      try {
        await logReading(
          user.id,
          'daily_card',
          [dailyReading.card.id],
          `${dailyReading.card.name}${dailyReading.isReversed ? ' (Reversed)' : ''}`
        );
        console.log('✅ [Reading] Daily card logged:', dailyReading.card.name);
      } catch (error) {
        console.error('❌ [Reading] Error logging daily card:', error);
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
    if (card.suit && SUITS[card.suit]) {
      return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    }
    return 'Minor Arcana';
  };

  if (!dailyReading) {
    return (
      <div className="daily-card-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const { card, isReversed, question } = dailyReading;
  const meaning = isReversed ? card.reversed_meaning : card.meaning;
  const keywords = isReversed ? card.reversed_keywords : card.keywords;

  return (
    <div className="daily-card-screen">
      <div className="daily-header">
        {onNavigate && (
          <button className="daily-back-btn" onClick={() => onNavigate('home')}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="daily-header-center">
          <div className="daily-ornament">✦</div>
          <h1 className="daily-title">Daily Card</h1>
          <div className="daily-date">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
        <div className="daily-header-spacer" />
      </div>

      <div className="daily-card-section">
        {showQuestion ? (
          <motion.div
            className="daily-question-phase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="daily-question-icon">🔮</div>
            <h2 className="daily-question-title">Ask Your Question</h2>
            <p className="daily-question-text">
              Take a moment to focus on what you'd like guidance about today.
            </p>
            <QuestionInput onSubmit={handleQuestionSubmit} />
          </motion.div>
        ) : !isRevealed ? (
          <motion.div 
            className="daily-card-hidden"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            {question && (
              <div className="daily-question-display">
                <span className="daily-question-label">Your question:</span>
                <p className="daily-question-text-display">"{question}"</p>
              </div>
            )}
            <div className="daily-card-back">
              <img 
                src={CARD_BACK_URL} 
                alt="Card Back"
                className="daily-card-back-image"
                draggable={false}
              />
            </div>
            <p className="daily-tap-hint">Tap to reveal your daily card</p>
            <button className="daily-reveal-btn" onClick={handleReveal}>
              Reveal Card
            </button>
          </motion.div>
        ) : (
          <motion.div 
            className="daily-card-revealed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {question && (
              <div className="daily-question-display">
                <span className="daily-question-label">Your question:</span>
                <p className="daily-question-text-display">"{question}"</p>
              </div>
            )}

            <div className={`daily-card-image-wrapper ${isReversed ? 'reversed' : ''}`}>
              {card.image_url ? (
                <img 
                  src={card.image_url} 
                  alt={card.name}
                  className="daily-card-image"
                  style={{ transform: isReversed ? 'rotate(180deg)' : 'none' }}
                />
              ) : (
                <div className="daily-card-placeholder">
                  <span className="daily-placeholder-num">{card.number}</span>
                  <span className="daily-placeholder-name">{card.name}</span>
                </div>
              )}
              {isReversed && (
                <div className="daily-reversed-badge">Reversed</div>
              )}
            </div>

            <div className="daily-card-info">
              <div className="daily-card-number">{card.number}</div>
              <h2 className="daily-card-name">{card.name}</h2>
              {isReversed && (
                <div className="daily-reversed-label">(Reversed)</div>
              )}
              <p className="daily-card-meta">{getCardMeta(card)}</p>

              <div className="daily-ornament-line">✦ ─── ✦</div>

              <div className="daily-meaning-section">
                <h3 className="daily-section-title">
                  {isReversed ? 'Reversed Meaning' : 'Meaning'}
                </h3>
                <p className="daily-meaning-text">{meaning}</p>
              </div>

              <div className="daily-keywords-section">
                <h3 className="daily-section-title">Keywords</h3>
                <div className="daily-keywords">
                  {keywords.map((keyword: string, idx: number) => (
                    <span key={idx} className="daily-keyword-tag">{keyword}</span>
                  ))}
                </div>
              </div>

              <div className="daily-message">
                <p className="daily-message-text">
                  {isReversed 
                    ? `Today's energy invites you to reflect on ${keywords[0]}. Consider where you might be holding back or need to approach situations differently.`
                    : `Today's energy supports ${keywords[0]}. Embrace this quality as you move through your day.`
                  }
                </p>
              </div>

              <button className="daily-new-question-btn" onClick={handleNewQuestion}>
                <RotateCcw size={14} />
                <span>Ask New Question</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}