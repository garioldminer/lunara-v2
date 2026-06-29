import { useState } from 'react';
import { useHoroscope } from '../hooks/useHoroscope';
import { useUser } from '../context/UserContext';
import { ZODIAC_SIGNS, BACKGROUND_IMAGE } from '../data/zodiacData';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Moon, Star, Heart, Briefcase, Activity, 
  Sparkles, RotateCcw, Share2, Sun, Calendar, ChevronRight
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

  if (loading) {
    return (
      <div className="horoscope-screen">
        <div className="cosmic-background" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
        <div className="horoscope-loading">
          <motion.div
            className="loading-moon"
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
          >
            <Moon size={64} className="moon-icon" />
          </motion.div>
          <div className="loading-stars">
            {[...Array(12)].map((_, i) => (
              <motion.div key={i} className="star" animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}>✦</motion.div>
            ))}
          </div>
          <motion.p className="loading-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>{randomLoadingMessage}</motion.p>
          <div className="cosmic-progress"><motion.div className="cosmic-progress-fill" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 4, ease: "linear" }} /></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="horoscope-screen">
        <div className="cosmic-background" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
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
          {/* მარცხენა ნახევარი - ტექსტი */}
          <div className="hero-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <p className="hero-subtitle">TODAY'S HOROSCOPE</p>
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
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            >
              {/* გარე ჩარჩო */}
              <div className="card-outer-frame">
                {/* შიდა ჩარჩო */}
                <div className="card-inner-frame">
                  {/* კუთხის ორნამენტები */}
                  <div className="corner-ornament top-left">✦</div>
                  <div className="corner-ornament top-right">✦</div>
                  <div className="corner-ornament bottom-left">✦</div>
                  <div className="corner-ornament bottom-right">✦</div>
                  
                  {/* ფოტო */}
                  <img 
                    src={zodiacData.imageUrl} 
                    alt={userSign}
                    className="card-image"
                  />
                  
                  {/* ზედა სათაური */}
                  <div className="card-top-label">
                    {userSign.toUpperCase()}
                  </div>
                  
                  {/* ქვედა badge სიმბოლოთი */}
                  <div className="card-symbol-badge">
                    {zodiacData.symbol}
                  </div>
                </div>
              </div>
              
              {/* Glow ეფექტი */}
              <div className="card-glow" />
            </motion.div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Lucky Elements - 4 ელემენტი ერთ ხაზზე */}
        <motion.div className="lucky-section" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
          <h3 className="section-title">LUCKY ELEMENTS</h3>
          <div className="lucky-grid">
            {horoscope.lucky_color && (
              <div className="lucky-item">
                <div className="lucky-icon-wrapper">
                  <div className="color-circle" style={{ background: `linear-gradient(135deg, ${horoscope.lucky_color}, transparent)` }} />
                </div>
                <div className="lucky-label">COLOR</div>
                <div className="lucky-value">{horoscope.lucky_color}</div>
              </div>
            )}
            {horoscope.lucky_number > 0 && (
              <div className="lucky-item">
                <div className="lucky-icon-wrapper">
                  <span className="number-display">{horoscope.lucky_number}</span>
                </div>
                <div className="lucky-label">NUMBER</div>
                <div className="lucky-value">{horoscope.lucky_number}</div>
              </div>
            )}
            <div className="lucky-item">
              <div className="lucky-icon-wrapper">
                <Sun size={32} className="planet-icon" />
              </div>
              <div className="lucky-label">PLANET</div>
              <div className="lucky-value">{zodiacData.planet}</div>
            </div>
            <div className="lucky-item">
              <div className="lucky-icon-wrapper">
                <div className="crystal-shape">💎</div>
              </div>
              <div className="lucky-label">CRYSTAL</div>
              <div className="lucky-value">Quartz</div>
            </div>
          </div>
        </motion.div>

        {/* Love & Career Insights - გვერდიგვერდ */}
        <div className="insights-grid">
          <motion.div className="insight-card love-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
            <div className="insight-header">
              <Heart size={24} className="insight-icon" />
              <h3>LOVE INSIGHT</h3>
            </div>
            <div className="insight-percentage">
              <div className="percentage-circle">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <path className="circle" stroke="#D9B66F" strokeWidth="3" strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" />
                </svg>
                <span className="percentage-text">85%</span>
              </div>
              <p className="insight-description">High chance of meaningful connection.</p>
            </div>
          </motion.div>

          <motion.div className="insight-card career-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.6 }}>
            <div className="insight-header">
              <Briefcase size={24} className="insight-icon" />
              <h3>CAREER PATH</h3>
            </div>
            <div className="insight-percentage">
              <div className="percentage-circle">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <path className="circle" stroke="#D9B66F" strokeWidth="3" strokeDasharray="70, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" />
                </svg>
                <span className="percentage-text">70%</span>
              </div>
              <p className="insight-description">New opportunities are on the horizon.</p>
            </div>
          </motion.div>
        </div>

        {/* General Energy */}
        {horoscope.general_prediction && (
          <motion.section className="prediction-section" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>
            <div className="section-icon"><Sparkles size={24} /></div>
            <h2>General Energy</h2>
            <p>{horoscope.general_prediction}</p>
          </motion.section>
        )}

        {/* Health & Wellness */}
        {horoscope.health_prediction && (
          <motion.section className="prediction-section" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }}>
            <div className="section-icon"><Activity size={24} /></div>
            <h2>Health & Wellness</h2>
            <p>{horoscope.health_prediction}</p>
          </motion.section>
        )}

        {/* Daily Affirmation */}
        {horoscope.affirmation && (
          <motion.div className="affirmation-section" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}>
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
    </div>
  );
}