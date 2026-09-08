import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';

interface StreakBannerProps {
  currentStreak: number;
  isDailyRevealed: boolean;
  isDismissed: boolean;
  onDismiss: () => void;
  onNavigate: (screen: string) => void;
}

export function StreakBanner({ currentStreak, isDailyRevealed, isDismissed, onDismiss, onNavigate }: StreakBannerProps) {
  const { t } = useTranslation();

  if (currentStreak === 0 || isDailyRevealed || isDismissed) return null;

  return (
    <>
      <motion.div
        className="streak-banner-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
      />

      <div className="streak-banner-container">
        <motion.div
          className="streak-banner"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        >
          <button onClick={onDismiss} className="streak-banner-close">
            <X size={12} />
          </button>

          <motion.div
            className="streak-banner-icon"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ⚠️
          </motion.div>

          <div className="streak-banner-title">
            {t('home.streakBanner.danger', { days: currentStreak })}
          </div>

          <div className="streak-banner-description">
            {t('home.streakBanner.drawNow')}
          </div>

          <div className="streak-banner-buttons">
            <button onClick={onDismiss} className="streak-banner-btn-later">
              {t('home.streakBanner.later')}
            </button>
            <button onClick={() => onNavigate('daily-card')} className="streak-banner-btn-draw">
              🔥 {t('home.streakBanner.drawNowBtn')}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}