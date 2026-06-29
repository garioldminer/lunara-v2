import { useHoroscope } from '../hooks/useHoroscope';
import { useUser } from '../context/UserContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Star, Heart, Briefcase, Activity, Sparkles } from 'lucide-react';
import './HoroscopeScreen.css';  // ← ეს ხაზი დამატებული
interface Props {
  onNavigate?: (screen: string) => void;
}

export default function HoroscopeScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const { horoscope, loading, error, refetch } = useHoroscope(user?.id || '');

  if (loading) {
    return (
      <div className="horoscope-screen">
        <div className="horoscope-loading">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Moon size={48} className="text-yellow-400" />
          </motion.div>
          <p className="mt-4 text-lg">Generating your cosmic guidance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="horoscope-screen">
        <div className="horoscope-error">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button onClick={refetch} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!horoscope) {
    return (
      <div className="horoscope-screen">
        <div className="horoscope-empty">
          <p>No horoscope available</p>
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
          <h1>Your Daily Horoscope</h1>
          <p className="horoscope-date">{horoscope.date}</p>
          <p className="horoscope-moon">
            <Moon size={16} /> {horoscope.moon_phase} in {horoscope.moon_sign}
          </p>
        </div>
        <button 
          className="horoscope-refresh-btn"
          onClick={refetch}
        >
          <Star size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="horoscope-content">
        {/* General Energy */}
        {horoscope.general_prediction && (
          <motion.section
            className="prediction-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2><Sparkles size={20} /> General Energy</h2>
            <p>{horoscope.general_prediction}</p>
          </motion.section>
        )}

        {/* Love & Relationships */}
        {horoscope.love_prediction && (
          <motion.section
            className="prediction-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2><Heart size={20} /> Love & Relationships</h2>
            <p>{horoscope.love_prediction}</p>
          </motion.section>
        )}

        {/* Career & Finance */}
        {horoscope.career_prediction && (
          <motion.section
            className="prediction-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2><Briefcase size={20} /> Career & Finance</h2>
            <p>{horoscope.career_prediction}</p>
            {horoscope.finance_prediction && horoscope.finance_prediction !== horoscope.career_prediction && (
              <p className="mt-2">{horoscope.finance_prediction}</p>
            )}
          </motion.section>
        )}

        {/* Health & Wellness */}
        {horoscope.health_prediction && (
          <motion.section
            className="prediction-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2><Activity size={20} /> Health & Wellness</h2>
            <p>{horoscope.health_prediction}</p>
          </motion.section>
        )}

        {/* Lucky Elements */}
        {(horoscope.lucky_color || horoscope.lucky_number) && (
          <motion.div
            className="lucky-elements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3>🍀 Lucky Elements</h3>
            <div className="lucky-grid">
              {horoscope.lucky_color && (
                <div className="lucky-item">
                  <span className="label">Color:</span>
                  <span className="value">{horoscope.lucky_color}</span>
                </div>
              )}
              {horoscope.lucky_number > 0 && (
                <div className="lucky-item">
                  <span className="label">Number:</span>
                  <span className="value">{horoscope.lucky_number}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Daily Affirmation */}
        {horoscope.affirmation && (
          <motion.div
            className="affirmation-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3>💫 Daily Affirmation</h3>
            <p className="affirmation-text">"{horoscope.affirmation}"</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}