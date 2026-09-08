import { motion } from 'framer-motion';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
  t: (key: string, params?: any) => string;
}

export function LevelUpModal({ level, onClose, t }: LevelUpModalProps) {
  return (
    <div className="levelup-overlay" onClick={onClose}>
      <motion.div
        className="levelup-modal"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="levelup-icon">🎉</div>
        <h2 className="levelup-title">{t('home.levelUpTitle')}</h2>
        <p className="levelup-message" dangerouslySetInnerHTML={{ __html: t('home.levelUpMessage', { level }) }} />
        <button onClick={onClose} className="levelup-button">
          {t('home.awesome')}
        </button>
      </motion.div>
    </div>
  );
}