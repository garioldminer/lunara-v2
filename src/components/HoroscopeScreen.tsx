import { useState } from 'react';
import { useHoroscope } from '../hooks/useHoroscope';
import { useUser } from '../context/UserContext';
import { ZODIAC_SIGNS, BACKGROUND_IMAGE } from '../data/zodiacData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Moon, Star, Activity,
  Sparkles, RotateCcw, Share2, Sun, Calendar, ChevronRight,
  X, Download, Heart, Briefcase, Palette, Hash
} from 'lucide-react';
import ShareCardPreview from './ShareCardPreview';
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

const TAB_LABELS: Record<TabType, string> = {
  today: "TODAY'S HOROSCOPE",
  tomorrow: "TOMORROW'S HOROSCOPE",
  weekly: "WEEKLY HOROSCOPE",
  monthly: "MONTHLY HOROSCOPE"
};

const HEADER_LABELS: Record<TabType, string> = {
  today: "Your Daily Guidance",
  tomorrow: "Your Tomorrow Preview",
  weekly: "Your Weekly Outlook",
  monthly: "Your Monthly Forecast"
};

// Helper function: Energy level-ის მიხედვით emojis
const getEnergyEmojis = (level: string | undefined, emoji: string): string => {
  const normalized = level?.toLowerCase() || 'medium';
  if (normalized.includes('very')) return `${emoji}${emoji}${emoji}${emoji}`;
  if (normalized.includes('high')) return `${emoji}${emoji}${emoji}`;
  if (normalized.includes('medium')) return `${emoji}${emoji}`;
  if (normalized.includes('low')) return `${emoji}`;
  return `${emoji}${emoji}`;
};

export default function HoroscopeScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReadFullOpen, setIsReadFullOpen] = useState(false);

  const { horoscope, loading, error, refetch } = useHoroscope(user?.id || '', activeTab);

  const userSign = user?.sun_sign?.toLowerCase() || 'leo';
  const zodiacData = ZODIAC_SIGNS[userSign] || ZODIAC_SIGNS['leo'];

  const randomLoadingMessage = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  const randomErrorMessage = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];

  const tabs = [
    { id: 'today' as TabType, icon: <Sun size={12} />, label: 'TODAY' },
    { id: 'tomorrow' as TabType, icon: <Moon size={12} />, label: 'TOMORROW' },
    { id: 'weekly' as TabType, icon: <Calendar size={12} />, label: 'WEEKLY' },
    { id: 'monthly' as TabType, icon: <Star size={12} />, label: 'MONTHLY' },
  ];

  // ✅ განახლებული Download handler - html2canvas-ით
  const handleDownloadCard = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      const element = document.getElementById('share-card');
      if (!element) {
        alert('Card not found!');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to generate image!');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `lunara-${userSign}-${horoscope?.date}.png`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        
        alert('Horoscope card downloaded! 🌟');
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download card. Please try again.');
    }
  };

  const handleShareToTelegram = async () => {
    const shareText = `Check out my ${userSign} horoscope on Lunara! 🔮✨`;
    const shareUrl = `https://lunara.app/horoscope?sign=${userSign}&date=${horoscope?.date}`;
    
    const telegram = (window as any).Telegram?.WebApp;
    
    if (telegram) {
      telegram.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
      );
    } else {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        '_blank'
      );
    }
  };

  if (loading) {
    return (
      <div className="horoscope-screen">
        <div className="cosmic-background" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
        <div className="aurora-layer" />
        <div className="horoscope-loading">
          <motion.div className="loading-moon-ring" animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
            <div className="ring-dot" />
            <div className="ring-dot" style={{ top: '50%', right: 0, transform: 'translateY(-50%)' }} />
            <div className="ring-dot" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }} />
            <div className="ring-dot" style={{ top: '50%', left: 0, transform: 'translateY(-50%)' }} />
          </motion.div>
          <motion.div className="loading-moon" animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}>
            <Moon size={56} className="moon-icon" />
          </motion.div>
          <div className="loading-stars">
            {[...Array(14)].map((_, i) => (
              <motion.div key={i} className="star" animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}></motion.div>
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
          <ArrowLeft size={18} />
        </button>
        <div className="horoscope-title">
          <h1>{HEADER_LABELS[activeTab]}</h1>
          <p className="horoscope-date">{horoscope.date}</p>
        </div>
        <button className="horoscope-refresh-btn" onClick={refetch}>
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="horoscope-content">
        {/* ===== HERO BANNER ===== */}
        <motion.div
          className="hero-banner"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="hero-shimmer" />
          <div className="hero-left">
            <motion.div className="hero-text-content" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
              <p className="hero-subtitle">
                <Sparkles size={8} className="subtitle-spark" /> {TAB_LABELS[activeTab]}
              </p>
              <h1 className="hero-sign-name">
                {userSign.charAt(0).toUpperCase() + userSign.slice(1)}
              </h1>
              <div className="hero-date-divider">
                <span className="divider-line" />
                <span className="hero-dates">{zodiacData.dateRange}</span>
                <span className="divider-line" />
              </div>
              {/* ✅ ცვლილება 1: Hero Description AI-დან */}
              <p className="hero-description">
                {horoscope.hero_description || "The universe is aligning in your favor."}
              </p>
              <motion.button 
                className="read-full-button" 
                whileHover={{ scale: 1.02, x: 3 }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsReadFullOpen(true)}
              >
                <span>READ FULL</span>
                <ChevronRight size={12} />
              </motion.button>
            </motion.div>
          </div>

          <div className="hero-right">
            <motion.div
              className="hero-tarot-card"
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6, ease: "easeOut" }}
            >
              <div className="card-outer-frame">
                <div className="card-inner-frame">
                  <img src={zodiacData.imageUrl} alt={userSign} className="card-image" />
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

        {/* 3-COLUMN GRID - Emoji + Text */}
        <div className="three-column-grid">
          <motion.div className="energy-score-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <div className="energy-emoji">{getEnergyEmojis(horoscope.cosmic_energy_level, '⚡')}</div>
            <p className="energy-level-text">{horoscope.cosmic_energy_level?.toUpperCase() || 'MEDIUM'}</p>
            <p className="energy-label">ENERGY</p>
          </motion.div>
          <motion.div className="insight-card love-card" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
            <div className="insight-emoji">{getEnergyEmojis(horoscope.love_energy_level, '💕')}</div>
            <p className="energy-level-text">{horoscope.love_energy_level?.toUpperCase() || 'MEDIUM'}</p>
            <p className="energy-label">LOVE</p>
          </motion.div>
          <motion.div className="insight-card career-card" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <div className="insight-emoji">{getEnergyEmojis(horoscope.career_energy_level, '💼')}</div>
            <p className="energy-level-text">{horoscope.career_energy_level?.toUpperCase() || 'MEDIUM'}</p>
            <p className="energy-label">CAREER</p>
          </motion.div>
        </div>

        {/* Lucky Elements */}
        <motion.div className="lucky-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }}>
          <h3 className="section-title">LUCKY ELEMENTS</h3>
          <div className="lucky-grid">
            {horoscope.lucky_color && (
              <motion.div className="lucky-item" whileHover={{ y: -2, scale: 1.02 }}>
                <div className="lucky-icon-wrapper"><div className="color-circle" style={{ background: `linear-gradient(135deg, ${horoscope.lucky_color}, transparent)` }} /></div>
                <div className="lucky-label">COLOR</div>
                <div className="lucky-value">{horoscope.lucky_color}</div>
              </motion.div>
            )}
            {horoscope.lucky_number > 0 && (
              <motion.div className="lucky-item" whileHover={{ y: -2, scale: 1.02 }}>
                <div className="lucky-icon-wrapper"><span className="number-display">{horoscope.lucky_number}</span></div>
                <div className="lucky-label">NUMBER</div>
                <div className="lucky-value">{horoscope.lucky_number}</div>
              </motion.div>
            )}
            {/* ✅ ცვლილება 2: Lucky Planet AI-დან */}
            <motion.div className="lucky-item" whileHover={{ y: -2, scale: 1.02 }}>
              <div className="lucky-icon-wrapper"><Sun size={18} className="planet-icon" /></div>
              <div className="lucky-label">PLANET</div>
              <div className="lucky-value">{horoscope.lucky_planet || zodiacData.planet}</div>
            </motion.div>
            {/* ✅ ცვლილება 3: Lucky Crystal AI-დან */}
            <motion.div className="lucky-item" whileHover={{ y: -2, scale: 1.02 }}>
              <div className="lucky-icon-wrapper"><div className="crystal-shape">💎</div></div>
              <div className="lucky-label">CRYSTAL</div>
              <div className="lucky-value">{horoscope.lucky_crystal || 'Quartz'}</div>
            </motion.div>
          </div>
        </motion.div>

        {/* General + Health - 2 COLUMN GRID */}
        <div className="two-column-grid">
          {horoscope.general_prediction && (
            <motion.section className="prediction-card clickable" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} onClick={() => setOpenModal('general')} whileHover={{ y: -2, scale: 1.01 }}>
              <div className="prediction-icon"><Sparkles size={16} /></div>
              <h2>General Energy</h2>
              <p className="preview-text">Click to read full prediction...</p>
              <div className="read-more-indicator">Read More →</div>
            </motion.section>
          )}
          {horoscope.health_prediction && (
            <motion.section className="prediction-card clickable" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} onClick={() => setOpenModal('health')} whileHover={{ y: -2, scale: 1.01 }}>
              <div className="prediction-icon"><Activity size={16} /></div>
              <h2>Health & Wellness</h2>
              <p className="preview-text">Click to read full prediction...</p>
              <div className="read-more-indicator">Read More →</div>
            </motion.section>
          )}
        </div>

        {/* Affirmation */}
        {horoscope.affirmation && (
          <motion.div className="affirmation-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <div className="affirmation-glow" />
            <div className="affirmation-icon">✨</div>
            <h3>{activeTab === 'weekly' ? 'Weekly' : activeTab === 'monthly' ? 'Monthly' : 'Daily'} Affirmation</h3>
            <p className="affirmation-text">"{horoscope.affirmation}"</p>
            <button className="share-affirmation-btn" onClick={() => setIsShareModalOpen(true)}>
              <Share2 size={12} /><span>Share</span>
            </button>
          </motion.div>
        )}

        <div className="horoscope-footer">
          <p className="footer-text">The stars have spoken. Trust your intuition.</p>
        </div>
      </div>

      {/* MODAL - General/Health */}
      <AnimatePresence>
        {openModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenModal(null)}>
            <motion.div className="modal-content" initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 15 }} onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setOpenModal(null)}><X size={20} /></button>
              {openModal === 'general' && (
                <>
                  <div className="modal-icon"><Sparkles size={28} /></div>
                  <h2 className="modal-title">General Energy</h2>
                  <p className="modal-text">{horoscope.general_prediction}</p>
                </>
              )}
              {openModal === 'health' && (
                <>
                  <div className="modal-icon"><Activity size={28} /></div>
                  <h2 className="modal-title">Health & Wellness</h2>
                  <p className="modal-text">{horoscope.health_prediction}</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHARE MODAL */}
      <AnimatePresence>
        {isShareModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsShareModalOpen(false)}>
            <motion.div className="modal-content share-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setIsShareModalOpen(false)}><X size={20} /></button>
              <h2 className="modal-title">Share Your Horoscope</h2>
              <div className="share-preview-container">
                <ShareCardPreview userSign={userSign} date={horoscope.date} affirmation={horoscope.affirmation} moonPhase={horoscope.moon_phase} luckyNumber={horoscope.lucky_number} luckyColor={horoscope.lucky_color} />
              </div>
              <div className="share-actions">
                <button className="share-action-btn" onClick={handleDownloadCard}><Download size={16} /><span>Download</span></button>
                <button className="share-action-btn primary" onClick={handleShareToTelegram}><Share2 size={16} /><span>Share</span></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================
          READ FULL MODAL - სრული ჰოროსკოპი
          ============================================ */}
      <AnimatePresence>
        {isReadFullOpen && (
          <motion.div 
            className="read-full-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setIsReadFullOpen(false)}
          >
            <motion.div 
              className="read-full-modal"
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow Effect */}
              <div className="rf-glow" />
              
              {/* Close Button */}
              <button className="rf-close" onClick={() => setIsReadFullOpen(false)}>
                <X size={22} />
              </button>

              {/* Scrollable Content */}
              <div className="rf-scroll">
                
                {/* Header */}
                <div className="rf-header">
                  <div className="rf-sign-icon">{zodiacData.symbol}</div>
                  <h1 className="rf-sign-name">{userSign.charAt(0).toUpperCase() + userSign.slice(1)}</h1>
                  <div className="rf-date-row">
                    <span className="rf-divider-line" />
                    <span className="rf-date">{TAB_LABELS[activeTab]} • {horoscope.date}</span>
                    <span className="rf-divider-line" />
                  </div>
                </div>

                {/* Energy Overview */}
                <div className="rf-energy-overview">
                  <div className="rf-energy-item">
                    <span className="rf-energy-emoji">{getEnergyEmojis(horoscope.cosmic_energy_level, '⚡')}</span>
                    <span className="rf-energy-level">{horoscope.cosmic_energy_level?.toUpperCase() || 'MEDIUM'}</span>
                    <span className="rf-energy-cat">Energy</span>
                  </div>
                  <div className="rf-energy-divider" />
                  <div className="rf-energy-item">
                    <span className="rf-energy-emoji">{getEnergyEmojis(horoscope.love_energy_level, '💕')}</span>
                    <span className="rf-energy-level">{horoscope.love_energy_level?.toUpperCase() || 'MEDIUM'}</span>
                    <span className="rf-energy-cat">Love</span>
                  </div>
                  <div className="rf-energy-divider" />
                  <div className="rf-energy-item">
                    <span className="rf-energy-emoji">{getEnergyEmojis(horoscope.career_energy_level, '💼')}</span>
                    <span className="rf-energy-level">{horoscope.career_energy_level?.toUpperCase() || 'MEDIUM'}</span>
                    <span className="rf-energy-cat">Career</span>
                  </div>
                </div>

                {/* Predictions */}
                <div className="rf-sections">
                  
                  {/* General */}
                  {horoscope.general_prediction && (
                    <div className="rf-section">
                      <div className="rf-section-header">
                        <Sparkles size={18} className="rf-section-icon" />
                        <h3>General Energy</h3>
                      </div>
                      <p className="rf-section-text">{horoscope.general_prediction}</p>
                    </div>
                  )}

                  {/* Love */}
                  {horoscope.love_prediction && (
                    <div className="rf-section">
                      <div className="rf-section-header love">
                        <Heart size={18} className="rf-section-icon" />
                        <h3>Love & Relationships</h3>
                      </div>
                      <p className="rf-section-text">{horoscope.love_prediction}</p>
                    </div>
                  )}

                  {/* Career */}
                  {horoscope.career_prediction && (
                    <div className="rf-section">
                      <div className="rf-section-header career">
                        <Briefcase size={18} className="rf-section-icon" />
                        <h3>Career & Finance</h3>
                      </div>
                      <p className="rf-section-text">{horoscope.career_prediction}</p>
                    </div>
                  )}

                  {/* Health */}
                  {horoscope.health_prediction && (
                    <div className="rf-section">
                      <div className="rf-section-header health">
                        <Activity size={18} className="rf-section-icon" />
                        <h3>Health & Wellness</h3>
                      </div>
                      <p className="rf-section-text">{horoscope.health_prediction}</p>
                    </div>
                  )}
                </div>

                {/* Lucky Elements */}
                <div className="rf-lucky">
                  <h3 className="rf-lucky-title">
                    <Sparkles size={14} />
                    LUCKY ELEMENTS
                    <Sparkles size={14} />
                  </h3>
                  <div className="rf-lucky-grid">
                    <div className="rf-lucky-item">
                      <Palette size={20} className="rf-lucky-icon" />
                      <span className="rf-lucky-label">Color</span>
                      <span className="rf-lucky-value">{horoscope.lucky_color || 'Gold'}</span>
                    </div>
                    <div className="rf-lucky-item">
                      <Hash size={20} className="rf-lucky-icon" />
                      <span className="rf-lucky-label">Number</span>
                      <span className="rf-lucky-value">{horoscope.lucky_number || 7}</span>
                    </div>
                    {/* ✅ ცვლილება 4: Planet READ FULL modal-შიც AI-დან */}
                    <div className="rf-lucky-item">
                      <Sun size={20} className="rf-lucky-icon" />
                      <span className="rf-lucky-label">Planet</span>
                      <span className="rf-lucky-value">{horoscope.lucky_planet || zodiacData.planet}</span>
                    </div>
                  </div>
                </div>

                {/* Moon Info */}
                <div className="rf-moon-info">
                  <Moon size={22} className="rf-moon-icon" />
                  <div className="rf-moon-details">
                    <span className="rf-moon-phase">{horoscope.moon_phase}</span>
                    <span className="rf-moon-sign">Moon in {horoscope.moon_sign}</span>
                  </div>
                </div>

                {/* Affirmation */}
                {horoscope.affirmation && (
                  <div className="rf-affirmation">
                    <div className="rf-aff-glow" />
                    <div className="rf-aff-icon">✨</div>
                    <h3 className="rf-aff-title">{activeTab === 'weekly' ? 'Weekly' : activeTab === 'monthly' ? 'Monthly' : 'Daily'} Affirmation</h3>
                    <p className="rf-aff-text">"{horoscope.affirmation}"</p>
                  </div>
                )}

                {/* Footer */}
                <div className="rf-footer">
                  <div className="rf-footer-divider">
                    <span className="rf-fd-star">✦</span>
                  </div>
                  <p className="rf-footer-text">The stars have spoken.<br />Trust your intuition.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}