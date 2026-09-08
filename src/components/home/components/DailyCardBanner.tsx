import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';
import { tarotCards, SUITS, CARD_BACK_URL } from '../../../data/tarotCards';

const getCardMeta = (card: typeof tarotCards[0]) => {
  if (card.arcana === 'major') return 'Major Arcana';
  if (card.suit && SUITS[card.suit]) return `${SUITS[card.suit].element}`;
  return '';
};

interface DailyCardBannerProps {
  dailyCard: typeof tarotCards[0] | null;
  isDailyReversed: boolean;
  isDailyRevealed: boolean;
  onNavigate: (screen: string) => void;
}

export function DailyCardBanner({
  dailyCard,
  isDailyReversed,
  isDailyRevealed,
  onNavigate
}: DailyCardBannerProps) {
  const { t } = useTranslation();

  const dailyCardName = dailyCard?.name || 'THE FOOL';
  const dailyCardMeaning = isDailyReversed
    ? (dailyCard?.reversed_keywords?.[0] || 'Reflection')
    : (dailyCard?.keywords?.[0] || 'New Beginnings');
  const dailyCardElement = dailyCard ? getCardMeta(dailyCard) : '';

  return (
    <motion.div
      className="card-of-day-banner clickable-card"
      onClick={() => onNavigate('daily-card')}
    >
      <div className="card-of-day-content">
        <div className="card-half-left">
          <motion.div
            className="card-image-3d-wrapper"
            animate={!isDailyRevealed ? { y: [0, -5, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="card-image-tilted">
              {!isDailyRevealed ? (
                <div className="card-back-container">
                  <img src={CARD_BACK_URL} alt="Card Back" className="card-back-image" />
                  <div className="card-tap-label">{t('home.tap')}</div>
                </div>
              ) : (
                <div className="card-front-container">
                  <img src={dailyCard?.image_url} alt={dailyCardName} className="card-front-image" />
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

        <div className="card-half-right">
          <div className="card-info-section">
            {!isDailyRevealed ? (
              <>
                <div className="card-label">{t('home.cardOfTheDay')}</div>
                <h3 className="card-title">{t('home.dailyCard.awaits')}</h3>
                <p className="card-description">{t('home.dailyCard.tapToReveal')}</p>
              </>
            ) : (
              <>
                <div className="card-label">{t('home.cardOfTheDay')}</div>
                <h3 className="card-title">
                  {dailyCardName}{isDailyReversed ? ' (R)' : ''}
                </h3>
                <p className="card-description">"{dailyCardMeaning}"</p>
                {dailyCardElement && <p className="card-element">{dailyCardElement}</p>}
                <button
                  className="read-guidance-btn"
                  onClick={(e) => { e.stopPropagation(); onNavigate('reading-history'); }}
                >
                  {t('home.viewJournal')} <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}