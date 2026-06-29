import { useHoroscope } from '../hooks/useHoroscope';
import { useUser } from '../context/UserContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Star, Heart, Briefcase, Activity, Sparkles, RotateCcw, Share2 } from 'lucide-react';
import './HoroscopeScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

const LOADING_MESSAGES = [
  "Aligning with the cosmos...",
  "Reading the stars...",
  "Channeling cosmic energy...",
  "Connecting to the universe...",
  "The stars are speaking...",
  "Your message is arriving..."
];

const ERROR_MESSAGES = [
  "The stars are clouded today. Please try again.",
  "Cosmic connection interrupted. Mercury might be in retrograde.",
  "The universe needs a moment. Try again in a few minutes.",
  "The celestial wires are crossed. Please retry."
];

export default function HoroscopeScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const { horoscope, loading, error, refetch } = useHoroscope(user?.id || '');

  const randomLoadingMessage = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  const randomErrorMessage = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];

  if (loading) {
    return (
      <div className="horoscope-screen">
        <div className="horoscope-loading">
          <motion.div
            className="loading-moon"
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Moon size={64} className="moon-icon" />
          </motion.div>
          
          <div className="loading-stars">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="star"
                animate={{ 
                  opacity: [0.2, 1, 0.2],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              >
                ✦
              </motion.div>
            ))}
          </div>

          <motion.p 
            className="loading-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {randomLoadingMessage}
          </motion.p>

          <div className="cosmic-progress">
            <motion.div 
              className="cosmic-progress-fill"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 4, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="horoscope-screen">
        <div className="horoscope-error">
          <motion.div
            className="error-icon"
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
            }}
            transition={{ duration: 0.5 }}
          >
            <Moon size={48} className="error-moon" />
          </motion.div>
          
          <p className="error-message">{randomErrorMessage}</p>
          
          <motion.button 
            className="retry-button"
            onClick={refetch}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw size={16} />
            <span>Try Again</span>
          </motion.button>
        </div>
      </div>
    );
  }

  if (!horoscope) {
    return (
      <div className="horoscope-screen">
        <div className="horoscope-empty">
          <Moon size={48} className="empty-moon" />
          <p>The cosmos has no message for you today.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="horoscope-screen">
      {/* Header */}
      <div className="horoscope-header">
        <button 
          className="horoscope-back-btn"
          onClick={() => onNavigate?.('home')}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="horoscope-title">
          <h1>Your Daily Guidance</h1>
          <p className="horoscope-date">{horoscope.date}</p>
          <p className="horoscope-moon">
            <Moon size={14} /> {horoscope.moon_phase} in {horoscope.moon_sign}
          </p>
        </div>
        <button 
          className="horoscope-refresh-btn"
          onClick={refetch}
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="horoscope-content">
        {/* General Energy */}
        {horoscope.general_prediction && (
          <motion.section
            className="prediction-section general-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div className="section-icon">
              <Sparkles size={24} />
            </div>
            <h2>General Energy</h2>
            <p>{horoscope.general_prediction}</p>
          </motion.section>
        )}

        {/* Love & Relationships */}
        {horoscope.love_prediction && (
          <motion.section
            className="prediction-section love-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="section-icon">
              <Heart size={24} />
            </div>
            <h2>Love & Relationships</h2>
            <p>{horoscope.love_prediction}</p>
          </motion.section>
        )}

        {/* Career & Finance */}
        {horoscope.career_prediction && (
          <motion.section
            className="prediction-section career-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="section-icon">
              <Briefcase size={24} />
            </div>
            <h2>Career & Finance</h2>
            <p>{horoscope.career_prediction}</p>
            {horoscope.finance_prediction && horoscope.finance_prediction !== horoscope.career_prediction && (
              <p className="finance-additional">{horoscope.finance_prediction}</p>
            )}
          </motion.section>
        )}

        {/* Health & Wellness */}
        {horoscope.health_prediction && (
          <motion.section
            className="prediction-section health-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="section-icon">
              <Activity size={24} />
            </div>
            <h2>Health & Wellness</h2>
            <p>{horoscope.health_prediction}</p>
          </motion.section>
        )}

        {/* Lucky Elements */}
        {(horoscope.lucky_color || horoscope.lucky_number) && (
          <motion.div
            className="lucky-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <h3 className="lucky-title">Lucky Elements</h3>
            <div className="lucky-grid">
              {horoscope.lucky_color && (
                <div className="lucky-item color-item">
                  <div className="lucky-icon">🎨</div>
                  <div className="lucky-label">Color</div>
                  <div className="lucky-value">{horoscope.lucky_color}</div>
                </div>
              )}
              {horoscope.lucky_number > 0 && (
                <div className="lucky-item number-item">
                  <div className="lucky-icon">🔢</div>
                  <div className="lucky-label">Number</div>
                  <div className="lucky-value">{horoscope.lucky_number}</div>
                </div>
              )}
              {horoscope.lucky_time && (
                <div className="lucky-item time-item">
                  <div className="lucky-icon">⏰</div>
                  <div className="lucky-label">Time</div>
                  <div className="lucky-value">{horoscope.lucky_time}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Daily Affirmation */}
        {horoscope.affirmation && (
          <motion.div
            className="affirmation-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="affirmation-icon">✨</div>
            <h3>Daily Affirmation</h3>
            <p className="affirmation-text">"{horoscope.affirmation}"</p>
            <button className="share-affirmation-btn">
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </motion.div>
        )}

        {/* Footer */}
        <div className="horoscope-footer">
          <p className="footer-text">The stars have spoken. Trust your intuition.</p>
        </div>
      </div>
    </div>
  );
}