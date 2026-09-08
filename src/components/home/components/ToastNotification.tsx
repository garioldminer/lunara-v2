import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

export function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast-container">
      <motion.div
        className={`toast toast-${toast.type}`}
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <span className="toast-icon">
          {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
        </span>
        <span className="toast-message">{toast.message}</span>
        <button onClick={onClose} className="toast-close">×</button>
      </motion.div>
    </div>
  );
}