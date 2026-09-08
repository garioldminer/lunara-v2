import { useEffect } from 'react';
import { motion } from 'framer-motion';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

export function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: '0', left: '0', right: '0', zIndex: 10003,
      display: 'flex', justifyContent: 'center', padding: '80px 16px 0 16px', pointerEvents: 'none'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={{
          background: toast.type === 'success' 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.98), rgba(5, 150, 105, 0.98))'
            : toast.type === 'error'
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.98), rgba(220, 38, 38, 0.98))'
            : 'linear-gradient(135deg, rgba(251, 191, 36, 0.98), rgba(245, 158, 11, 0.98))',
          color: '#fff', padding: '16px 20px', borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '600',
          maxWidth: '400px', width: '100%', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'auto'
        }}
      >
        <span style={{ fontSize: '20px', flexShrink: 0 }}>
          {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
        </span>
        <span style={{ flex: 1, textAlign: 'center', paddingRight: '20px' }}>{toast.message}</span>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', width: '24px', height: '24px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: '16px', lineHeight: 1
          }}
        >
          ×
        </button>
      </motion.div>
    </div>
  );
}