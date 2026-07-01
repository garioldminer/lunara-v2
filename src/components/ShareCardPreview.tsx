import { forwardRef } from 'react';
import { ZODIAC_SIGNS } from '../data/zodiacData';

interface ShareCardPreviewProps {
  userSign: string;
  date: string;
  affirmation: string;
  moonPhase: string;
  luckyNumber: number;
  luckyColor: string;
}

const ShareCardPreview = forwardRef<HTMLDivElement, ShareCardPreviewProps>(
  ({ userSign, date, affirmation, moonPhase, luckyNumber, luckyColor }, ref) => {
    const zodiacData = ZODIAC_SIGNS[userSign] || ZODIAC_SIGNS['leo'];
    
    // ფორმატირებული თარიღი
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase();

    return (
      <div ref={ref} className="share-card" id="share-card">
        {/* ბექგრაუნდი */}
        <div className="share-card-bg" />
        
        {/* ვარსკვლავები */}
        <div className="share-card-stars">
          {[...Array(40)].map((_, i) => (
            <div 
              key={i} 
              className="star" 
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        {/* ჩარჩო */}
        <div className="share-card-frame">
          {/* Header - ზედა მარცხენა და მარჯვენა */}
          <div className="share-card-header">
            <div className="logo">
              <span className="logo-crescent">☾</span>
              <span className="logo-text">Lunara</span>
            </div>
            <div className="date">{formattedDate}</div>
          </div>

          {/* Zodiac Section - აწეული ზემოთ */}
          <div className="zodiac-section">
            <div className="zodiac-circle">
              <div className="zodiac-art">
                <img src={zodiacData.imageUrl} alt={userSign} className="zodiac-image" />
              </div>
              <div className="circle-decorations">
                <div className="star star-1">✦</div>
                <div className="star star-2">✦</div>
                <div className="star star-3">✦</div>
                <div className="star star-4">✦</div>
              </div>
            </div>
            <h1 className="zodiac-name">{userSign.toUpperCase()}</h1>
          </div>

          {/* Affirmation */}
          <div className="affirmation-section">
            <p className="affirmation-text">{affirmation}</p>
          </div>

          {/* Lucky Elements - ერთ ხაზზე ჰორიზონტალურად */}
          <div className="lucky-elements-horizontal">
            <div className="lucky-item-horizontal">
              <div className="lucky-icon moon-icon">🌕</div>
              <div className="lucky-label">{moonPhase}</div>
            </div>
            <div className="lucky-item-horizontal">
              <div className="lucky-icon number-icon">
                <div className="number-circle">{luckyNumber}</div>
              </div>
              <div className="lucky-label">Lucky: {luckyNumber}</div>
            </div>
            <div className="lucky-item-horizontal">
              <div className="lucky-icon color-icon">🍀</div>
              <div className="lucky-label">Color: {luckyColor}</div>
            </div>
          </div>

          {/* QR Code & CTA */}
          <div className="qr-section">
            <div className="qr-code">
              <div className="qr-placeholder">
                <div className="qr-pattern" />
              </div>
            </div>
            <div className="qr-text">
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