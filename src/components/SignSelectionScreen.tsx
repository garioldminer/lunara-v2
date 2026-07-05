import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { updateUser } from '../lib/userService';
import { calculateZodiacSign, validateBirthDate } from '../utils/zodiacCalculator';
import './SignSelectionScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

const ZODIAC_SIGNS = [
  { name: 'aries', symbol: '♈', label: 'Aries', dates: 'Mar 21 - Apr 19' },
  { name: 'taurus', symbol: '♉', label: 'Taurus', dates: 'Apr 20 - May 20' },
  { name: 'gemini', symbol: '♊', label: 'Gemini', dates: 'May 21 - Jun 20' },
  { name: 'cancer', symbol: '♋', label: 'Cancer', dates: 'Jun 21 - Jul 22' },
  { name: 'leo', symbol: '♌', label: 'Leo', dates: 'Jul 23 - Aug 22' },
  { name: 'virgo', symbol: '♍', label: 'Virgo', dates: 'Aug 23 - Sep 22' },
  { name: 'libra', symbol: '♎', label: 'Libra', dates: 'Sep 23 - Oct 22' },
  { name: 'scorpio', symbol: '♏', label: 'Scorpio', dates: 'Oct 23 - Nov 21' },
  { name: 'sagittarius', symbol: '♐', label: 'Sagittarius', dates: 'Nov 22 - Dec 21' },
  { name: 'capricorn', symbol: '♑', label: 'Capricorn', dates: 'Dec 22 - Jan 19' },
  { name: 'aquarius', symbol: '♒', label: 'Aquarius', dates: 'Jan 20 - Feb 18' },
  { name: 'pisces', symbol: '♓', label: 'Pisces', dates: 'Feb 19 - Mar 20' },
];

export default function SignSelectionScreen({ onNavigate }: Props) {
  const { user, setUser } = useUser();
  const [selectedMode, setSelectedMode] = useState<'manual' | 'birth-date' | null>(null);
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });
  const [calculatedSign, setCalculatedSign] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Handle manual sign selection
  const handleManualSelect = (signName: string) => {
    setSelectedSign(signName);
    setError(null);
  };

  // ✅ Handle birth date input
  const handleBirthDateChange = (field: 'day' | 'month' | 'year', value: string) => {
    setBirthDate(prev => ({ ...prev, [field]: value }));
    setError(null);
    setCalculatedSign(null);
  };

  // ✅ Calculate sign from birth date
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

  // ✅ Save to database and continue
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
      
      // თუ birth date შევსებულია, შევინახოთ
      if (birthDate.day && birthDate.month && birthDate.year) {
        updates.birth_date = `${birthDate.year}-${birthDate.month.padStart(2, '0')}-${birthDate.day.padStart(2, '0')}`;
      }

      const updatedUser = await updateUser(user.id, updates);
      
      if (updatedUser) {
        setUser(updatedUser);
        console.log('✅ Sign saved successfully!');
        
        // Navigate to horoscope
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

  return (
    <div className="sign-selection-screen">
      {/* Background */}
      <div className="ss-background" />
      <div className="ss-aurora" />
      
      {/* Particles */}
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

      {/* Content */}
      <div className="ss-content">
        {/* Header */}
        <div className="ss-header">
          <div className="ss-icon">🔮</div>
          <h1 className="ss-title">Discover Your Sign</h1>
          <p className="ss-subtitle">Choose how you want to find your zodiac sign</p>
        </div>

        {/* Mode Selection */}
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

        {/* Manual Selection Mode */}
        {selectedMode === 'manual' && (
          <div className="ss-manual-mode">
            <h2 className="ss-mode-title">Select Your Zodiac Sign</h2>
            
            <div className="ss-signs-grid">
              {ZODIAC_SIGNS.map(sign => (
                <button
                  key={sign.name}
                  className={`ss-sign-card ${selectedSign === sign.name ? 'selected' : ''}`}
                  onClick={() => handleManualSelect(sign.name)}
                >
                  <div className="ss-sign-symbol">{sign.symbol}</div>
                  <div className="ss-sign-label">{sign.label}</div>
                  <div className="ss-sign-dates">{sign.dates}</div>
                </button>
              ))}
            </div>

            <button
              className="ss-back-btn"
              onClick={() => setSelectedMode(null)}
            >
              ← Back
            </button>
          </div>
        )}

        {/* Birth Date Mode */}
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
                <div className="ss-calculated-icon">
                  {ZODIAC_SIGNS.find(s => s.name === calculatedSign)?.symbol}
                </div>
                <div className="ss-calculated-info">
                  <h3>Your Sign</h3>
                  <p>{ZODIAC_SIGNS.find(s => s.name === calculatedSign)?.label}</p>
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

              <button
                className="ss-back-btn"
                onClick={() => setSelectedMode(null)}
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="ss-error">
            ⚠️ {error}
          </div>
        )}

        {/* Continue Button */}
        {selectedSign && selectedMode && (
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