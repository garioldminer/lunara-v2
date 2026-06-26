import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  Zap,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';
import { aiRouter } from '../lib/ai/router';
import './HoroscopeScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

interface ZodiacSign {
  id: string;
  name: string;
  symbol: string;
  dates: string;
  element: string;
}

interface HoroscopeResult {
  content: string;
  zodiacSign: string;
  date: string;
  type: 'daily' | 'weekly';
  model: string;
  cached: boolean;
  generatedAt: string;
  responseTimeMs: number;
  inputTokens: number;
  outputTokens: number;
}

const ZODIAC_SIGNS: ZodiacSign[] = [
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
  { id: 'pisces', name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20', element: 'Water' }
];

export default function HoroscopeScreen({ onNavigate }: Props) {
  const [selectedSign, setSelectedSign] = useState<ZodiacSign | null>(null);
  const [horoscopeType, setHoroscopeType] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HoroscopeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateHoroscope = async () => {
    if (!selectedSign) {
      setError('Please select a zodiac sign');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      let prompt = '';
      let requestType = '';
      
      if (horoscopeType === 'daily') {
        requestType = 'daily_horoscope';
        prompt = `Generate a daily horoscope for ${selectedSign.name} sign for ${dateStr}.`;
      } else {
        requestType = 'weekly_horoscope';
        const startDate = new Date(selectedDate);
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 6);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        prompt = `Generate a weekly horoscope for ${selectedSign.name} sign from ${startDateStr} to ${endDateStr}.`;
      }

      console.log('🔮 [Horoscope] Generating...', { requestType, prompt });

      const response = await aiRouter.routeRequest({
        requestType,
        prompt,
        metadata: {
          zodiacSign: selectedSign.id,
          date: dateStr,
          type: horoscopeType
        }
      });

      console.log('✅ [Horoscope] Generated!', response);

      setResult({
        content: response.content,
        zodiacSign: selectedSign.id,
        date: dateStr,
        type: horoscopeType,
        model: response.model,
        cached: response.cached,
        generatedAt: new Date().toISOString(),
        responseTimeMs: response.responseTimeMs,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens
      });

    } catch (error) {
      console.error('❌ [Horoscope] Error:', error);
      setError('Failed to generate horoscope. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setResult(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="horoscope-screen">
      {/* Header */}
      <div className="horoscope-header">
        <button className="horoscope-back-btn" onClick={() => onNavigate?.('astro')}>
          <ChevronLeft size={24} />
        </button>
        <div className="horoscope-title">
          <Sparkles size={24} />
          <h1>Horoscope</h1>
        </div>
        <div className="horoscope-header-spacer"></div>
      </div>

      {/* Zodiac Selector */}
      <div className="zodiac-selector">
        <h2>Choose Your Sign</h2>
        <div className="zodiac-grid">
          {ZODIAC_SIGNS.map((sign) => (
            <motion.button
              key={sign.id}
              className={`zodiac-card ${selectedSign?.id === sign.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedSign(sign);
                setResult(null);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="zodiac-symbol">{sign.symbol}</div>
              <div className="zodiac-name">{sign.name}</div>
              <div className="zodiac-dates">{sign.dates}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Type Selector */}
      {selectedSign && (
        <motion.div 
          className="type-selector"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>Horoscope Type</h3>
          <div className="type-buttons">
            <button
              className={`type-btn ${horoscopeType === 'daily' ? 'active' : ''}`}
              onClick={() => {
                setHoroscopeType('daily');
                setResult(null);
              }}
            >
              <Calendar size={18} />
              <span>Daily</span>
            </button>
            <button
              className={`type-btn ${horoscopeType === 'weekly' ? 'active' : ''}`}
              onClick={() => {
                setHoroscopeType('weekly');
                setResult(null);
              }}
            >
              <Clock size={18} />
              <span>Weekly</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Date Selector */}
      {selectedSign && (
        <motion.div 
          className="date-selector"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3>Date</h3>
          <div className="date-controls">
            <button className="date-nav-btn" onClick={() => changeDate(-1)}>
              <ChevronLeft size={20} />
            </button>
            <div className="date-display">
              <Calendar size={18} />
              <span>{formatDate(selectedDate)}</span>
            </div>
            <button className="date-nav-btn" onClick={() => changeDate(1)}>
              <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Generate Button */}
      {selectedSign && (
        <motion.div 
          className="generate-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            className="generate-btn"
            onClick={generateHoroscope}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Generate Horoscope</span>
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div 
            className="horoscope-result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
          >
            <div className="result-header">
              <div className="result-sign">
                <span className="result-symbol">{selectedSign?.symbol}</span>
                <div className="result-info">
                  <h3>{selectedSign?.name}</h3>
                  <p>{horoscopeType === 'daily' ? 'Daily' : 'Weekly'} Horoscope</p>
                </div>
              </div>
              {result.cached && (
                <div className="cached-badge">
                  <Zap size={14} />
                  <span>Cached</span>
                </div>
              )}
            </div>

            <div className="result-content">
              {result.content}
            </div>

            <div className="result-meta">
              <div className="meta-item">
                <Clock size={14} />
                <span>{result.responseTimeMs}ms</span>
              </div>
              <div className="meta-item">
                <Zap size={14} />
                <span>{result.inputTokens + result.outputTokens} tokens</span>
              </div>
              <div className="meta-item">
                <Star size={14} />
                <span>{result.model}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}