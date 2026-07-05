import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { updateUser } from '../lib/userService';
import { calculateZodiacSign, validateBirthDate } from '../utils/zodiacCalculator';
import { ArrowLeft } from 'lucide-react';
import './SignSelectionScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

// ✅ Supabase-ის base URL
const SUPABASE_BASE_URL = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope';

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
  const [calculatedSign, setCalculatedSign] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleManualSelect = (signName: string) => {
    setSelectedSign(signName);
    setError(null);
  };

  const handleBirthDateChange = (field: 'day' | 'month' | 'year', value: string) => {
    setBirthDate(prev => ({ ...prev, [field]: value }));
    setError(null);
    setCalculatedSign(null);
  };

  const handleCalculateSign = () => {
    const { day, month, year } = birthDate;
    
    if (!day || !month || !year) {
      setError('Please fill in all fields');
      return;
    }

    const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    if (!validateBirthDate(dateStr)) {
      setError('Invalid date. Please check your input.');
      return;
    }

    const sign = calculateZodiacSign(dateStr);
    setCalculatedSign(sign);
    setSelectedSign(sign);
    setError(null);
  };

  const handleContinue = async () => {
    if (!selectedSign || !user) {
      setError('Please select your zodiac sign');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('💾 Saving sign:', selectedSign);

      const updates: any = { sun_sign: selectedSign };
      
      if (birthDate.day && birthDate.month && birthDate.year) {
        updates.birth_date = `${birthDate.year}-${birthDate.month.padStart(2, '0')}-${birthDate.day.padStart(2, '0')}`;
      }

      const updatedUser = await updateUser(user.id, updates);
      
      if (updatedUser) {
        setUser(updatedUser);
        console.log('✅ Sign saved successfully!');
        
        if (onNavigate) {
          onNavigate('horoscope');
        }
      }
    } catch (error) {
      console.error('❌ Error saving sign:', error);
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (selectedMode) {
      setSelectedMode(null);
      setSelectedSign(null);
      setCalculatedSign(null);
      setError(null);
    } else if (onNavigate) {
      onNavigate('home');
    }
  };

  const getSignData = (signName: string) => {
    return ZODIAC_SIGNS.find(s => s.name === signName);
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
          <p className="ss-subtitle-top">Discover Your Sign</p>
          <h1 className="ss-title-main">Select Your Zodiac Sign</h1>
        </div>

        {!selectedMode && (
          <div className="ss-mode-selection">
            <button
              className="ss-mode-btn"
              onClick={() => setSelectedMode('manual')}
            >
              <div className="ss-mode-icon">✨</div>
              <div className="ss-mode-content">
                <h3>Manual Selection</h3>
                <p>Choose your sign from the list</p>
              </div>
            </button>

            <button
              className="ss-mode-btn"
              onClick={() => setSelectedMode('birth-date')}
            >
              <div className="ss-mode-icon">📅</div>
              <div className="ss-mode-content">
                <h3>Birth Date</h3>
                <p>We'll calculate it automatically</p>
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
            <h2 className="ss-mode-title">When were you born?</h2>
            
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

            {calculatedSign && (
              <div className="ss-calculated-sign">
                <div className="ss-calculated-image-container">
                  <img 
                    src={getSignData(calculatedSign)?.imageUrl} 
                    alt={getSignData(calculatedSign)?.label}
                    className="ss-calculated-image"
                  />
                </div>
                <div className="ss-calculated-info">
                  <h3>Your Sign</h3>
                  <p>{getSignData(calculatedSign)?.label}</p>
                </div>
              </div>
            )}

            <div className="ss-birth-date-actions">
              <button
                className="ss-calculate-btn"
                onClick={handleCalculateSign}
              >
                Calculate Sign
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