import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { updateUser } from '../lib/userService';
import { validateBirthDate } from '../utils/zodiacCalculator';
import { ArrowLeft } from 'lucide-react';
import './SignSelectionScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

const SUPABASE_BASE_URL = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope';
const SUPABASE_URL = 'https://eutavdhcxpfhpfsyaskb.supabase.co';

const ZODIAC_SIGNS = [
  { name: 'aries', symbol: '♈', label: 'Aries', dates: 'Mar 21 - Apr 19', imageUrl: `${SUPABASE_BASE_URL}/Aries.jpg` },
  { name: 'taurus', symbol: '♉', label: 'Taurus', dates: 'Apr 20 - May 20', imageUrl: `${SUPABASE_BASE_URL}/Taurus.jpg` },
  { name: 'gemini', symbol: '♊', label: 'Gemini', dates: 'May 21 - Jun 20', imageUrl: `${SUPABASE_BASE_URL}/Gemini.jpg` },
  { name: 'cancer', symbol: '♋', label: 'Cancer', dates: 'Jun 21 - Jul 22', imageUrl: `${SUPABASE_BASE_URL}/Cancer1.jpg` },
  { name: 'leo', symbol: '♌', label: 'Leo', dates: 'Jul 23 - Aug 22', imageUrl: `${SUPABASE_BASE_URL}/Leo1.jpg` },
  { name: 'virgo', symbol: '♍', label: 'Virgo', dates: 'Aug 23 - Sep 22', imageUrl: `${SUPABASE_BASE_URL}/Virgo.jpg` },
  { name: 'libra', symbol: '♎', label: 'Libra', dates: 'Sep 23 - Oct 22', imageUrl: `${SUPABASE_BASE_URL}/Libra.jpg` },
  { name: 'scorpio', symbol: '♏', label: 'Scorpio', dates: 'Oct 23 - Nov 21', imageUrl: `${SUPABASE_BASE_URL}/Scorpio.jpg` },
  { name: 'sagittarius', symbol: '♐', label: 'Sagittarius', dates: 'Nov 22 - Dec 21', imageUrl: `${SUPABASE_BASE_URL}/Sagittarius.jpg` },
  { name: 'capricorn', symbol: '♑', label: 'Capricorn', dates: 'Dec 22 - Jan 19', imageUrl: `${SUPABASE_BASE_URL}/Capricorn.jpg` },
  { name: 'aquarius', symbol: '♒', label: 'Aquarius', dates: 'Jan 20 - Feb 18', imageUrl: `${SUPABASE_BASE_URL}/Aquarius.jpg` },
  { name: 'pisces', symbol: '♓', label: 'Pisces', dates: 'Feb 19 - Mar 20', imageUrl: `${SUPABASE_BASE_URL}/Pisces.jpg` },
];

export default function SignSelectionScreen({ onNavigate }: Props) {
  const { user, setUser } = useUser();
  const [selectedMode, setSelectedMode] = useState<'manual' | 'birth-date' | null>(null);
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });
  const [birthTime, setBirthTime] = useState({ hours: '', minutes: '' });
  const [birthPlace, setBirthPlace] = useState('');
  const [birthChartData, setBirthChartData] = useState<{
    sun_sign: string;
    moon_sign: string;
    rising_sign: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleManualSelect = (signName: string) => {
    setSelectedSign(signName);
    setError(null);
  };

  const handleBirthDateChange = (field: 'day' | 'month' | 'year', value: string) => {
    setBirthDate(prev => ({ ...prev, [field]: value }));
    setError(null);
    setBirthChartData(null);
  };

  const handleBirthTimeChange = (field: 'hours' | 'minutes', value: string) => {
    setBirthTime(prev => ({ ...prev, [field]: value }));
    setError(null);
    setBirthChartData(null);
  };

  const handleCalculateBirthChart = async () => {
    const { day, month, year } = birthDate;
    const { hours, minutes } = birthTime;

    if (!day || !month || !year) {
      setError('Please fill in birth date');
      return;
    }
    if (!hours || !minutes) {
      setError('Please fill in birth time');
      return;
    }
    if (!birthPlace.trim()) {
      setError('Please enter your birth city');
      return;
    }

    const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    if (!validateBirthDate(dateStr)) {
      setError('Invalid date. Please check your input.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔮 Calculating birth chart...');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-birth-chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth_date: dateStr,
          birth_time: `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`,
          birth_place: birthPlace.trim()
        })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to calculate birth chart');
        return;
      }

      setBirthChartData(result.data);
      setSelectedSign(result.data.sun_sign);
      console.log('✅ Birth chart calculated:', result.data);

    } catch (err: any) {
      console.error('❌ Error calculating birth chart:', err);
      setError('Failed to calculate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedSign || !user) {
      setError('Please select your zodiac sign');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('💾 Saving birth chart data...');

      const updates: any = { sun_sign: selectedSign };
      
      if (birthDate.day && birthDate.month && birthDate.year) {
        updates.birth_date = `${birthDate.year}-${birthDate.month.padStart(2, '0')}-${birthDate.day.padStart(2, '0')}`;
      }

      if (birthTime.hours && birthTime.minutes) {
        updates.birth_time = `${birthTime.hours.padStart(2, '0')}:${birthTime.minutes.padStart(2, '0')}:00`;
      }

      if (birthPlace.trim()) {
        updates.birth_place = birthPlace.trim();
      }

      if (birthChartData) {
        updates.moon_sign = birthChartData.moon_sign;
        updates.rising_sign = birthChartData.rising_sign;
      }

      const updatedUser = await updateUser(user.id, updates);
      
      if (updatedUser) {
        setUser(updatedUser);
        console.log('✅ Birth chart saved successfully!');
        
        if (onNavigate) {
          onNavigate('horoscope');
        }
      }
    } catch (error) {
      console.error('❌ Error saving birth chart:', error);
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (selectedMode) {
      setSelectedMode(null);
      setSelectedSign(null);
      setBirthChartData(null);
      setError(null);
    } else if (onNavigate) {
      onNavigate('home');
    }
  };

  const getSignData = (signName: string) => {
    return ZODIAC_SIGNS.find(s => s.name === signName.toLowerCase());
  };

  return (
    <div className="sign-selection-screen">
      <div className="ss-background" />
      <div className="ss-aurora" />
      
      <div className="ss-particles">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="ss-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <button 
        className="ss-back-btn-fixed"
        onClick={handleBack}
      >
        <ArrowLeft size={24} />
      </button>

      <div className="ss-content">
        <div className="ss-header">
          <p className="ss-subtitle-top">Discover Your Cosmic Blueprint</p>
          <h1 className="ss-title-main">Your Birth Chart</h1>
        </div>

        {!selectedMode && (
          <div className="ss-mode-selection">
            <button
              className="ss-mode-btn"
              onClick={() => setSelectedMode('manual')}
            >
              <div className="ss-mode-icon">✨</div>
              <div className="ss-mode-content">
                <h3>Just Sun Sign</h3>
                <p>Quick selection from the list</p>
              </div>
            </button>

            <button
              className="ss-mode-btn"
              onClick={() => setSelectedMode('birth-date')}
            >
              <div className="ss-mode-icon">🔮</div>
              <div className="ss-mode-content">
                <h3>Full Birth Chart</h3>
                <p>Sun, Moon & Rising signs</p>
              </div>
            </button>
          </div>
        )}

        {selectedMode === 'manual' && (
          <div className="ss-manual-mode">
            <div className={`ss-signs-grid ${selectedSign ? 'has-selection' : ''}`}>
              {ZODIAC_SIGNS.map(sign => (
                <button
                  key={sign.name}
                  className={`ss-sign-card ${selectedSign === sign.name ? 'selected' : ''}`}
                  onClick={() => handleManualSelect(sign.name)}
                >
                  <div className="ss-sign-image-container">
                    <img 
                      src={sign.imageUrl} 
                      alt={sign.label}
                      className="ss-sign-image"
                      loading="lazy"
                    />
                  </div>
                  <div className="ss-sign-label">{sign.label}</div>
                  <div className="ss-sign-dates">{sign.dates}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedMode === 'birth-date' && (
          <div className="ss-birth-date-mode">
            <h2 className="ss-mode-title">When & Where were you born?</h2>
            
            <div className="ss-date-inputs">
              <div className="ss-date-field">
                <label>Day</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="15"
                  value={birthDate.day}
                  onChange={(e) => handleBirthDateChange('day', e.target.value)}
                />
              </div>

              <div className="ss-date-field">
                <label>Month</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  placeholder="8"
                  value={birthDate.month}
                  onChange={(e) => handleBirthDateChange('month', e.target.value)}
                />
              </div>

              <div className="ss-date-field">
                <label>Year</label>
                <input
                  type="number"
                  min="1900"
                  max="2026"
                  placeholder="1990"
                  value={birthDate.year}
                  onChange={(e) => handleBirthDateChange('year', e.target.value)}
                />
              </div>
            </div>

            <div className="ss-time-inputs">
              <div className="ss-time-field">
                <label>Hour</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  placeholder="14"
                  value={birthTime.hours}
                  onChange={(e) => handleBirthTimeChange('hours', e.target.value)}
                />
              </div>

              <div className="ss-time-field">
                <label>Minute</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="30"
                  value={birthTime.minutes}
                  onChange={(e) => handleBirthTimeChange('minutes', e.target.value)}
                />
              </div>
            </div>

            <div className="ss-place-input">
              <label>Birth City</label>
              <input
                type="text"
                placeholder="Tbilisi, New York, London..."
                value={birthPlace}
                onChange={(e) => {
                  setBirthPlace(e.target.value);
                  setError(null);
                  setBirthChartData(null);
                }}
              />
              <p className="ss-hint">Supported: Tbilisi, Batumi, Kutaisi, New York, London, Paris, Moscow, Istanbul, Dubai, Tokyo, LA, Chicago, Berlin, Rome, Madrid, Beijing, Mumbai, Sydney, Toronto, Miami</p>
            </div>

            {birthChartData && (
              <div className="ss-birth-chart-result">
                <h3>Your Big Three</h3>
                <div className="ss-three-signs">
                  <div className="ss-sign-result">
                    <div className="ss-sign-result-icon">
                      <img src={getSignData(birthChartData.sun_sign)?.imageUrl} alt="Sun" />
                    </div>
                    <div className="ss-sign-result-label">☀️ Sun</div>
                    <div className="ss-sign-result-name">{getSignData(birthChartData.sun_sign)?.label}</div>
                  </div>

                  <div className="ss-sign-result">
                    <div className="ss-sign-result-icon">
                      <img src={getSignData(birthChartData.moon_sign)?.imageUrl} alt="Moon" />
                    </div>
                    <div className="ss-sign-result-label">🌙 Moon</div>
                    <div className="ss-sign-result-name">{getSignData(birthChartData.moon_sign)?.label}</div>
                  </div>

                  <div className="ss-sign-result">
                    <div className="ss-sign-result-icon">
                      <img src={getSignData(birthChartData.rising_sign)?.imageUrl} alt="Rising" />
                    </div>
                    <div className="ss-sign-result-label">🌅 Rising</div>
                    <div className="ss-sign-result-name">{getSignData(birthChartData.rising_sign)?.label}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="ss-birth-date-actions">
              <button
                className="ss-calculate-btn"
                onClick={handleCalculateBirthChart}
                disabled={loading}
              >
                {loading ? 'Calculating...' : 'Calculate Birth Chart'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="ss-error">
            ⚠️ {error}
          </div>
        )}

        {selectedSign && (
          <button
            className="ss-continue-btn"
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  );
}