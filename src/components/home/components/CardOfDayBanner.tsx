import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { CARD_BACK_URL } from '../../../data/tarotCards';
import { useTranslation } from '../../../i18n/TranslationContext';

interface CardOfDayBannerProps {
  dailyCard: any;
  dailyCardName: string;
  dailyCardMeaning: string;
  dailyCardElement: string;
  isDailyReversed: boolean;
  isDailyRevealed: boolean;
  onNavigate: (screen: string) => void;
}

export function CardOfDayBanner({
  dailyCard,
  dailyCardName,
  dailyCardMeaning,
  dailyCardElement,
  isDailyReversed,
  isDailyRevealed,
  onNavigate
}: CardOfDayBannerProps) {
  const { t } = useTranslation();

  return (
    <motion.div 
      className="card-of-day-banner clickable-card" 
      onClick={() => onNavigate('daily-card')}
    >
      <div className="card-of-day-content" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0' }}>
        <div className="card-half-left" style={{ flex: '0 0 45%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
          
          <motion.div 
            className="card-image-3d-wrapper" 
            animate={!isDailyRevealed ? { y: [0, -5, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="card-image-tilted">
              
              {!isDailyRevealed ? (
                <div className="card-back-container">
                  <img 
                    src={CARD_BACK_URL} 
                    alt="Card Back" 
                    className="card-back-image"
                  />
                  <div className="card-tap-label">
                    TAP
                  </div>
                </div>
              ) : (
                <div className="card-front-container">
                  <img 
                    src={dailyCard?.image_url} 
                    alt={dailyCardName} 
                    className="card-front-image"
                  />
                </div>
              )}
              
              {isDailyReversed && isDailyRevealed && (
                <div className="card-reversed-indicator-large">
                  <span>R</span>
                </div>
              )}
            </div>
            <div className="card-3d-shadow"></div>
          </motion.div>
        </div>
        
        <div className="card-half-right" style={{ flex: '0 0 55%', paddingLeft: '12px', display: 'flex', alignItems: 'center' }}>
          <div className="card-info-section">
            {!isDailyRevealed ? (
              <>
                <div className="card-label">{t('home.cardOfTheDay')}</div>
                <h3 className="card-title">Your Card Awaits</h3>
                <p className="card-description">Tap to reveal your daily guidance</p>
              </>
            ) : (
              <>
                <div className="card-label">{t('home.cardOfTheDay')}</div>
                <h3 className="card-title">{dailyCardName}{isDailyReversed ? ' (R)' : ''}</h3>
                <p className="card-description">"{dailyCardMeaning}"</p>
                {dailyCardElement && <p className="card-element">{dailyCardElement}</p>}
                <button className="read-guidance-btn" onClick={(e) => { e.stopPropagation(); onNavigate('reading-history'); }}>
                  View Journal <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}