import { useState } from 'react';
import { useHoroscope } from '../hooks/useHoroscope';
import { useUser } from '../context/UserContext';
import { ZODIAC_SIGNS, BACKGROUND_IMAGE } from '../data/zodiacData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Moon, Star, Heart, Briefcase, Activity,
  Sparkles, RotateCcw, Share2, Sun, Calendar, ChevronRight,
  Zap, TrendingUp, X
} from 'lucide-react';
import './HoroscopeScreen.css';

type TabType = 'today' | 'tomorrow' | 'weekly' | 'monthly';

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
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [openModal, setOpenModal] = useState<string | null>(null);

  const userSign = user?.sun_sign?.toLowerCase() || 'leo';
  const zodiacData = ZODIAC_SIGNS[userSign] || ZODIAC_SIGNS['leo'];

  const randomLoadingMessage = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  const randomErrorMessage = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];

  const tabs = [
    { id: 'today' as TabType, icon: <Sun size={16} />, label: 'TODAY' },
    { id: 'tomorrow' as TabType, icon: <Moon size={16} />, label: 'TOMORROW' },
    { id: 'weekly' as TabType, icon: <Calendar size={16} />, label: 'WEEKLY' },
    { id: 'monthly' as TabType, icon: <Star size={16} />, label: 'MONTHLY' },
  ];

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="horoscope-screen">
        <div className="cosmic-background" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
        <div className="aurora-layer" />
        <div className="horoscope-loading">
          <motion.div
            className="loading-moon-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            <div className="ring-dot" />
            <div className="ring-dot" style={{ top: '50%', right: 0, transform: 'translateY(-50%)' }} />
            <div className="ring-dot" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }} />
            <div className="ring-dot" style={{ top: '50%', left: 0, transform: 'translateY(-50%)' }} />
          </motion.div>
          <motion.div
            className="loading-moon"
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
          >
            <Moon size={56} className="moon-icon" />
          </motion.div>
          <div className="loading-stars">
            {[...Array(14)].map((_, i) => (
              <motion.div key={i} className="star" animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}>✦</motion.div>
            ))}
          </div>
          <motion.p className="loading-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>{randomLoadingMessage}</motion.p>
          <div className="cosmic-progress"><motion.div className="cosmic-progress-fill" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 4, ease: "linear" }} /></div>
        </div>
      </div>
    );
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div className="horoscope-screen">
        <div className="cosmic-background" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
        <div className="aurora-layer" />
        <div className="horoscope-error">
          <motion.div className="error-icon" animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>
            <Moon size={48} className="error-moon" />
          </motion.div>
          <p className="error-message">{randomErrorMessage}</p>
          <motion.button className="retry-button" onClick={refetch} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <RotateCcw size={16} /><span>Try Again</span>
          </motion.button>
        </div>
      </div>
    );
  }

  if (!horoscope) {
    return (
      <div className="horoscope-screen">
        <div className="cosmic-background" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
        <div className="aurora-layer" />
        <div className="horoscope-empty">
          <Moon size={48} className="empty-moon" />
          <p>The cosmos has no message for you today.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="horoscope-screen">
      <div className="cosmic-background" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
      <div className="aurora-layer" />
      <div className="floating-particles">
        {[...Array(10)].map((_, i) => (
          <span key={i} className="particle" style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${i * 1.4}s`,
            animationDuration: `${10 + (i % 5) * 2}s`
          }} />
        ))}
      </div>

      {/* Header */}
      <div className="horoscope-header">
        <button className="horoscope-back-btn" onClick={() => onNavigate?.('home')}>
          <ArrowLeft size={20} />
        </button>
        <div className="horoscope-title">
          <h1>Your Daily Guidance</h1>
          <p className="horoscope-date">{horoscope.date}</p>
        </div>
        <button className="horoscope-refresh-btn" onClick={refetch}>
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="horoscope-content">
        {/* ===== HERO BANNER ===== */}
        <motion.div
          className="hero-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="hero-shimmer" />
          {/* მარცხენა ნახევარი - ტექსტი */}
          <div className="hero-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <p className="hero-subtitle">
                <Sparkles size={10} className="subtitle-spark" /> TODAY'S HOROSCOPE
              </p>
              <h1 className="hero-sign-name">
                {userSign.charAt(0).toUpperCase() + userSign.slice(1)}
              </h1>
              <div className="hero-date-divider">
                <span className="divider-line" />
                <span className="hero-dates">{zodiacData.dateRange}</span>
                <span className="divider-line" />
              </div>
              <p className="hero-description">
                The universe is aligning in your favor. Step forward with confidence.
              </p>
              <motion.button
                className="read-full-button"
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>READ FULL</span>
                <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          </div>

          {/* მარჯვენა ნახევარი - კარტი */}
          <div className="hero-right">
            <motion.div
              className="hero-tarot-card"
              initial={{ opacity: 0, scale: 0.8, rotateY: 45 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              whileHover={{ rotateY: 8, rotateX: -4, scale: 1.04 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="card-outer-frame">
                <div className="card-inner-frame">
                  <img
                    src={zodiacData.imageUrl}
                    alt={userSign}
                    className="card-image"
                  />
                  <div className="card-sheen" />
                </div>
              </div>
              <div className="card-glow" />
            </motion.div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {activeTab === tab.id && (
                <motion.div layoutId="tab-active-bg" className="tab-active-bg" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
              )}
              <span className="tab-content">{tab.icon}<span>{tab.label}</span></span>
            </button>
          ))}
        </div>

        {/* 3-COLUMN GRID: ENERGY, LOVE, CAREER */}
        <div className="three-column-grid">
          {/* Cosmic Energy */}
          <motion.div className="energy-score-section" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>
            <div className="energy-orbit">
              <svg viewBox="0 0 100 100" className="energy-ring">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(217,182,111,0.12)" strokeWidth="5" />
                <motion.circle
                  cx="50" cy="50" r="44" fill="none" stroke="url(#energyGrad)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray="276.5"
                  initial={{ strokeDashoffset: 276.5 }}
                  animate={{ strokeDashoffset: 276.5 - (276.5 * 0.82) }}
                  transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F4D47C" />
                    <stop offset="100%" stopColor="#D9B66F" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="energy-orbit-center">
                <Zap size={16} className="energy-icon" />
                <span className="energy-percent">82%</span>
              </div>
            </div>
            <p className="energy-label">COSMIC ENERGY</p>
          </motion.div>

          {/* Love Insight */}
          <motion.div className="insight-card love-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <div className="insight-header">
              <Heart size={18} className="insight-icon" />
              <h3>LOVE</h3>
            </div>
            <div className="percentage-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <path className="circle" stroke="#D9B66F" strokeWidth="3" strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" />
              </svg>
              <span className="percentage-text">85%</span>
            </div>
            <p className="insight-description">High chance of meaningful connection.</p>
          </motion.div>

          {/* Career Path */}
          <motion.div className="insight-card career-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.6 }}>
            <div className="insight-header">
              <Briefcase size={18} className="insight-icon" />
              <h3>CAREER</h3>
            </div>
            <div className="percentage-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <path className="circle" stroke="#D9B66F" strokeWidth="3" strokeDasharray="70, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" />
              </svg>
              <span className="percentage-text">70%</span>
            </div>
            <p className="insight-description">New opportunities ahead.</p>
          </motion.div>
        </div>

        {/* Lucky Elements */}
        <motion.div className="lucky-section" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
          <h3 className="section-title">LUCKY ELEMENTS</h3>
          <div className="lucky-grid">
            {horoscope.lucky_color && (
              <motion.div className="lucky-item" whileHover={{ y: -4, scale: 1.03 }}>
                <div className="lucky-icon-wrapper">
                  <div className="color-circle" style={{ background: `linear-gradient(135deg, ${horoscope.lucky_color}, transparent)` }} />
                </div>
                <div className="lucky-label">COLOR</div>
                <div className="lucky-value">{horoscope.lucky_color}</div>
              </motion.div>
            )}
            {horoscope.lucky_number > 0 && (
              <motion.div className="lucky-item" whileHover={{ y: -4, scale: 1.03 }}>
                <div className="lucky-icon-wrapper">
                  <span className="number-display">{horoscope.lucky_number}</span>
                </div>
                <div className="lucky-label">NUMBER</div>
                <div className="lucky-value">{horoscope.lucky_number}</div>
              </motion.div>
            )}
            <motion.div className="lucky-item" whileHover={{ y: -4, scale: 1.03 }}>
              <div className="lucky-icon-wrapper">
                <Sun size={28} className="planet-icon" />
              </div>
              <div className="lucky-label">PLANET</div>
              <div className="lucky-value">{zodiacData.planet}</div>
            </motion.div>
            <motion.div className="lucky-item" whileHover={{ y: -4, scale: 1.03 }}>
              <div className="lucky-icon-wrapper">
                <div className="crystal-shape">💎</div>
              </div>
              <div className="lucky-label">CRYSTAL</div>
              <div className="lucky-value">Quartz</div>
            </motion.div>
          </div>
        </motion.div>

        {/* General Energy - Clickable */}
        {horoscope.general_prediction && (
          <motion.section 
            className="prediction-section clickable"
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.35, duration: 0.6 }}
            onClick={() => setOpenModal('general')}
            whileHover={{ y: -2, scale: 1.01 }}
          >
            <div className="section-icon"><Sparkles size={20} /></div>
            <h2>General Energy</h2>
            <p className="preview-text">Click to read full prediction...</p>
            <div className="read-more-indicator">Read More →</div>
          </motion.section>
        )}

        {/* Health & Wellness - Clickable */}
        {horoscope.health_prediction && (
          <motion.section 
            className="prediction-section clickable"
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4, duration: 0.6 }}
            onClick={() => setOpenModal('health')}
            whileHover={{ y: -2, scale: 1.01 }}
          >
            <div className="section-icon"><Activity size={20} /></div>
            <h2>Health & Wellness</h2>
            <p className="preview-text">Click to read full prediction...</p>
            <div className="read-more-indicator">Read More →</div>
          </motion.section>
        )}

        {/* Daily Affirmation */}
        {horoscope.affirmation && (
          <motion.div className="affirmation-section" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}>
            <div className="affirmation-glow" />
            <div className="affirmation-icon">✨</div>
            <h3>Daily Affirmation</h3>
            <p className="affirmation-text">"{horoscope.affirmation}"</p>
            <button className="share-affirmation-btn">
              <Share2 size={14} /><span>Share</span>
            </button>
          </motion.div>
        )}

        <div className="horoscope-footer">
          <p className="footer-text">The stars have spoken. Trust your intuition.</p>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {openModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenModal(null)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setOpenModal(null)}>
                <X size={24} />
              </button>
              
              {openModal === 'general' && (
                <>
                  <div className="modal-icon">
                    <Sparkles size={32} />
                  </div>
                  <h2 className="modal-title">General Energy</h2>
                  <p className="modal-text">{horoscope.general_prediction}</p>
                </>
              )}
              
              {openModal === 'health' && (
                <>
                  <div className="modal-icon">
                    <Activity size={32} />
                  </div>
                  <h2 className="modal-title">Health & Wellness</h2>
                  <p className="modal-text">{horoscope.health_prediction}</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}