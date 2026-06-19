import { useEffect, useState } from 'react';
import './AstroScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

const zodiacSigns = [
  { name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19' },
  { name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20' },
  { name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20' },
  { name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22' },
  { name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22' },
  { name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22' },
  { name: 'Libra', symbol: '', dates: 'Sep 23 - Oct 22' },
  { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21' },
  { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21' },
  { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19' },
  { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18' },
  { name: 'Pisces', symbol: '', dates: 'Feb 19 - Mar 20' },
];

export default function AstroScreen({ onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    console.log('🌟 AstroScreen mounted');
  }, []);

  return (
    <div className="screen-container astro">
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
        <div className="header-section">
          <h1 className="page-title">✦ ASTROLOGY ✦</h1>
          <p className="page-subtitle">Discover your cosmic path</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            Daily
          </button>
          <button 
            className={`tab ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            Weekly
          </button>
          <button 
            className={`tab ${activeTab === 'birth' ? 'active' : ''}`}
            onClick={() => setActiveTab('birth')}
          >
            Birth Chart
          </button>
          <button 
            className={`tab ${activeTab === 'compat' ? 'active' : ''}`}
            onClick={() => setActiveTab('compat')}
          >
            Compatibility
          </button>
        </div>

        {/* Zodiac Grid */}
        <div className="zodiac-grid">
          {zodiacSigns.map((sign) => (
            <div key={sign.name} className="zodiac-item">
              <div className="zodiac-symbol">{sign.symbol}</div>
              <div className="zodiac-name">{sign.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}