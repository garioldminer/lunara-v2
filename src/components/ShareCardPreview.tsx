import { forwardRef, useEffect, useState } from 'react';
import { ZODIAC_SIGNS } from '../data/zodiacData';
import QRCode from 'qrcode';
import './ShareCardPreview.css';

interface Transit {
  planet1: string;
  aspect_type: string;
  planet2: string;
  influence: string;
}

interface ShareCardPreviewProps {
  userSign: string;
  date: string;
  affirmation: string;
  moonPhase: string;
  luckyNumber: number;
  luckyColor: string;
  luckyCrystal?: string;
  luckyPlanet?: string;
  keyTransits?: Transit[];
}

const ShareCardPreview = forwardRef<HTMLDivElement, ShareCardPreviewProps>(
  ({ 
    userSign, 
    date, 
    affirmation, 
    moonPhase, 
    luckyNumber, 
    luckyColor,
    luckyCrystal = 'Quartz',
    luckyPlanet = 'Sun',
    keyTransits = []
  }, ref) => {
    const zodiacData = ZODIAC_SIGNS[userSign] || ZODIAC_SIGNS['leo'];
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase();

    // Generate QR Code
    useEffect(() => {
      const shareUrl = `https://lunara.app/horoscope?sign=${userSign}&date=${date}`;
      QRCode.toDataURL(shareUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#D9B66F',
          light: '#FFFFFF'
        }
      }).then(setQrCodeUrl)
      .catch(console.error);
    }, [userSign, date]);

    return (
      <div ref={ref} className="share-card" id="share-card">
        {/* Background */}
        <div className="share-card-bg" />
        
        {/* Stars */}
        <div className="share-card-stars">
          {[...Array(40)].map((_, i) => (
            <div 
              key={i} 
              className="share-star" 
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        {/* Frame */}
        <div className="share-card-frame">
          {/* Header */}
          <div className="share-header">
            <div className="share-logo">
              <span className="logo-crescent">☾</span>
              <span className="logo-text">Lunara</span>
            </div>
            <div className="share-date">{formattedDate}</div>
          </div>

          {/* Zodiac Section */}
          <div className="zodiac-section">
            <div className="zodiac-circle">
              <div className="zodiac-image-wrapper">
                <img src={zodiacData.imageUrl} alt={userSign} className="zodiac-image" />
              </div>
              <div className="circle-stars">
                <span className="c-star c-star-1">✦</span>
                <span className="c-star c-star-2">✦</span>
                <span className="c-star c-star-3">✦</span>
                <span className="c-star c-star-4">✦</span>
              </div>
            </div>
            <h1 className="zodiac-name">{userSign.toUpperCase()}</h1>
          </div>

          {/* Affirmation */}
          <div className="affirmation-section">
            <p className="affirmation-text">{affirmation}</p>
          </div>

          {/* ✅ ახალი: Lucky Elements - 5 ელემენტი (2 rows) */}
          <div className="lucky-elements-expanded">
            {/* Row 1: Moon, Number, Color */}
            <div className="lucky-row">
              <div className="lucky-item">
                <div className="lucky-icon lucky-moon">🌕</div>
                <div className="lucky-label">{moonPhase}</div>
              </div>
              <div className="lucky-item">
                <div className="lucky-icon lucky-number">
                  <div className="number-circle">{luckyNumber}</div>
                </div>
                <div className="lucky-label">Lucky: {luckyNumber}</div>
              </div>
              <div className="lucky-item">
                <div className="lucky-icon lucky-color">🍀</div>
                <div className="lucky-label">Color: {luckyColor}</div>
              </div>
            </div>

            {/* Row 2: Crystal, Planet */}
            <div className="lucky-row">
              <div className="lucky-item">
                <div className="lucky-icon lucky-crystal">💎</div>
                <div className="lucky-label">Crystal: {luckyCrystal}</div>
              </div>
              <div className="lucky-item">
                <div className="lucky-icon lucky-planet">☀️</div>
                <div className="lucky-label">Planet: {luckyPlanet}</div>
              </div>
              {/* Empty space for balance */}
              <div className="lucky-item lucky-spacer" />
            </div>
          </div>

          {/* ✅ ახალი: Key Transits (top 2) */}
          {keyTransits.length > 0 && (
            <div className="share-transits">
              <h4 className="share-transits-title">✦ Key Transits ✦</h4>
              <div className="share-transits-list">
                {keyTransits.slice(0, 2).map((transit, index) => (
                  <div key={index} className={`share-transit-item ${transit.influence}`}>
                    <span className="share-transit-text">
                      {transit.planet1} {transit.aspect_type} {transit.planet2}
                    </span>
                    <span className="share-transit-badge">
                      {transit.influence === 'harmonious' && '🟢'}
                      {transit.influence === 'challenging' && '🔴'}
                      {transit.influence === 'neutral' && '⚪'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR Code & CTA */}
          <div className="qr-row">
            <div className="qr-box">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="qr-image" />
              ) : (
                <div className="qr-loading">...</div>
              )}
            </div>
            <div className="qr-info">
              <p className="qr-cta">Scan to get<br />your horoscope</p>
              <p className="qr-url">lunara.app</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ShareCardPreview.displayName = 'ShareCardPreview';

export default ShareCardPreview;