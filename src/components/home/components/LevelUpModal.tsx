import { motion } from 'framer-motion';

export function LevelUpModal({ level, onClose, t }: { level: number; onClose: () => void; t: (key: string, params?: any) => string }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 10002,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        style={{
          background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
          border: '2px solid #fbbf24', borderRadius: '24px', padding: '32px 24px', textAlign: 'center',
          maxWidth: '320px', width: '100%', boxShadow: '0 0 50px rgba(251, 191, 36, 0.4)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px', filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))' }}>🎉</div>
        <h2 style={{ color: '#fbbf24', fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px' }}>{t('home.levelUpTitle')}</h2>
        <p style={{ color: '#e2e8f0', fontSize: '16px', marginBottom: '24px', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: t('home.levelUpMessage', { level }) }} />
        <button 
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#0f0c08', border: 'none',
            borderRadius: '12px', padding: '14px 32px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
            width: '100%', boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)'
          }}
        >
          {t('home.awesome')}
        </button>
      </motion.div>
    </div>
  );
}