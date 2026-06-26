import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Star, Zap } from 'lucide-react';
import './AstroScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

const zodiacSigns = [
  { id: 'aries', name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19', element: 'Fire' },
  { id: 'taurus', name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20', element: 'Earth' },
  { id: 'gemini', name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20', element: 'Air' },
  { id: 'cancer', name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22', element: 'Water' },
  { id: 'leo', name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22', element: 'Fire' },
  { id: 'virgo', name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22', element: 'Earth' },
  { id: 'libra', name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22', element: 'Air' },
  { id: 'scorpio', name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21', element: 'Water' },
  { id: 'sagittarius', name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21', element: 'Fire' },
  { id: 'capricorn', name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19', element: 'Earth' },
  { id: 'aquarius', name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18', element: 'Air' },
  { id: 'pisces', name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20', element: 'Water' },
];

export default function AstroScreen({ onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState('horoscope');

  useEffect(() => {
    console.log('🌟 AstroScreen mounted');
  }, []);

  const handleZodiacClick = (signId: string) => {
    console.log(`🔮 Zodiac selected: ${signId}`);
    if (onNavigate) {
      onNavigate('horoscope');
    }
  };

  const handleGenerateHoroscope = () => {
    console.log('✨ Generate Horoscope clicked');
    if (onNavigate) {
      onNavigate('horoscope');
    }
  };

  return (
    <div className="screen-container astro">
      {/* Particles Background */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
              width: `${2 + Math.random() * 2}px`,
              height: `${2 + Math.random() * 2}px`,
            }}
          />
        ))}
      </div>

      <div className="content-scroll">
        {/* Header */}
        <div className="header-section">
          <h1 className="page-title">✦ ASTROLOGY ✦</h1>
          <p className="page-subtitle">Discover your cosmic path</p>
        </div>

        {/* 🔮 AI Horoscope Banner */}
        <motion.div 
          className="ai-horoscope-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleGenerateHoroscope}
        >
          <div className="banner-content">
            <div className="banner-icon">
              <Sparkles size={32} />
            </div>
            <div className="banner-text">
              <h3>AI Horoscope</h3>
              <p>Get your personalized horoscope powered by AI</p>
            </div>
            <div className="banner-arrow">→</div>
          </div>
          <div className="banner-glow"></div>
        </motion.div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'horoscope' ? 'active' : ''}`}
            onClick={() => setActiveTab('horoscope')}
          >
            <Sparkles size={14} />
            <span>Horoscope</span>
          </button>
          <button 
            className={`tab ${activeTab === 'birth' ? 'active' : ''}`}
            onClick={() => setActiveTab('birth')}
          >
            <Star size={14} />
            <span>Birth Chart</span>
          </button>
          <button 
            className={`tab ${activeTab === 'compat' ? 'active' : ''}`}
            onClick={() => setActiveTab('compat')}
          >
            <Zap size={14} />
            <span>Compatibility</span>
          </button>
        </div>

        {/* Horoscope Tab */}
        {activeTab === 'horoscope' && (
          <motion.div 
            className="tab-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="section-title">
              <Calendar size={16} />
              <span>Choose your sign</span>
            </div>

            {/* Zodiac Grid */}
            <div className="zodiac-grid">
              {zodiacSigns.map((sign, index) => (
                <motion.div 
                  key={sign.id} 
                  className="zodiac-item"
                  onClick={() => handleZodiacClick(sign.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="zodiac-symbol">{sign.symbol}</div>
                  <div className="zodiac-info">
                    <div className="zodiac-name">{sign.name}</div>
                    <div className="zodiac-dates">{sign.dates}</div>
                  </div>
                  <div className="zodiac-element">{sign.element}</div>
                </motion.div>
              ))}
            </div>

            {/* Quick Generate Button */}
            <motion.button 
              className="quick-generate-btn"
              onClick={handleGenerateHoroscope}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles size={20} />
              <span>Generate AI Horoscope</span>
            </motion.button>
          </motion.div>
        )}

        {/* Birth Chart Tab */}
        {activeTab === 'birth' && (
          <motion.div 
            className="tab-content coming-soon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="coming-soon-icon">🌟</div>
            <h3>Coming Soon</h3>
            <p>Birth chart analysis powered by AI</p>
          </motion.div>
        )}

        {/* Compatibility Tab */}
        {activeTab === 'compat' && (
          <motion.div 
            className="tab-content coming-soon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="coming-soon-icon">💫</div>
            <h3>Coming Soon</h3>
            <p>Zodiac sign compatibility analysis</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}