import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bug, CheckCircle, AlertCircle, Clock, TrendingUp, Copy, Shield } from 'lucide-react';
import { Toast, DebugLog, PerformanceMetrics, SignValidation } from './horoscopeData';

export function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className={`toast toast-${toast.type}`}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      <div className="toast-content">
        <span className="toast-icon">
          {toast.type === 'success' && '✨'}
          {toast.type === 'error' && '⚠️'}
          {toast.type === 'info' && 'ℹ️'}
        </span>
        <span className="toast-message">{toast.message}</span>
      </div>
      <button className="toast-close" onClick={onClose}><X size={14} /></button>
    </motion.div>
  );
}

interface DebugPanelProps {
  logs: DebugLog[];
  metrics: PerformanceMetrics;
  diagnostics: { type: 'success' | 'error' | 'warn'; message: string }[];
  isVisible: boolean;
  onToggle: () => void;
  onCopy: () => void;
  signValidation: SignValidation;
  horoscopeData: any;
}

export function DebugPanel({ logs, metrics, diagnostics, isVisible, onToggle, onCopy, signValidation, horoscopeData }: DebugPanelProps) {
  return (
    <>
      <motion.button
        className="debug-toggle-btn"
        onClick={onToggle}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          position: 'fixed', bottom: '80px', right: '16px', width: '48px', height: '48px',
          borderRadius: '50%', background: isVisible ? '#10b981' : '#ef4444',
          border: '2px solid rgba(255, 255, 255, 0.3)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 10000, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Bug size={24} />
      </motion.button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="debug-panel"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            style={{
              position: 'fixed', top: '60px', right: '16px', bottom: '140px', width: '320px',
              maxWidth: 'calc(100vw - 32px)', background: 'rgba(10, 6, 0, 0.95)',
              border: '2px solid rgba(255, 229, 102, 0.4)', borderRadius: '12px', padding: '12px',
              zIndex: 9999, overflowY: 'auto', fontFamily: 'monospace', fontSize: '11px',
              color: '#ffe566', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 229, 102, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bug size={16} color="#ffe566" />
                <strong style={{ fontSize: '13px' }}>DEBUG</strong>
                <span style={{ fontSize: '10px', color: '#c87800' }}>({logs.length})</span>
              </div>
              <motion.button
                onClick={onCopy}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ background: 'rgba(96, 165, 250, 0.2)', border: '1px solid rgba(96, 165, 250, 0.5)', borderRadius: '6px', padding: '4px 8px', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'bold' }}
              >
                <Copy size={12} /> COPY
              </motion.button>
            </div>

            <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '8px', padding: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#a78bfa', fontWeight: 'bold' }}>
                <Shield size={14} /> HOROSCOPE DATA
              </div>
              <pre style={{ color: '#e9d5ff', fontSize: '9px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '200px', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.3)', padding: '6px', borderRadius: '4px' }}>
                {horoscopeData ? JSON.stringify(horoscopeData, null, 2) : 'No data'}
              </pre>
            </div>

            <div style={{ background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '8px', padding: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#60a5fa', fontWeight: 'bold' }}>
                <Clock size={14} /> PERFORMANCE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#c87800' }}>Duration:</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{metrics.duration ? `${metrics.duration}ms` : '...'}</span>
                </div>
                {metrics.phases.map((phase, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', fontSize: '10px' }}>
                    <span style={{ color: '#94a3b8' }}>→ {phase.name}</span>
                    <span style={{ color: '#fbbf24' }}>{phase.duration ? `${phase.duration}ms` : '...'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: signValidation.foundWrongSigns.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${signValidation.foundWrongSigns.length > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              borderRadius: '8px', padding: '8px', marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: signValidation.foundWrongSigns.length > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                <Shield size={14} /> SIGN VALIDATION
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#c87800' }}>User Sign:</span>
                  <span style={{ color: '#ffe566', fontWeight: 'bold', textTransform: 'capitalize' }}>{signValidation.userSign || '...'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#c87800' }}>Wrong Signs:</span>
                  <span style={{ color: signValidation.foundWrongSigns.length > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    {signValidation.foundWrongSigns.length > 0 ? signValidation.foundWrongSigns.join(', ') : 'None ✅'}
                  </span>
                </div>
              </div>
            </div>

            {diagnostics.length > 0 && (
              <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px', padding: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#fbbf24', fontWeight: 'bold' }}>
                  <AlertCircle size={14} /> DIAGNOSTICS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {diagnostics.slice(0, 8).map((diag, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                      {diag.type === 'success' && <CheckCircle size={12} color="#10b981" />}
                      {diag.type === 'error' && <AlertCircle size={12} color="#ef4444" />}
                      {diag.type === 'warn' && <AlertCircle size={12} color="#fbbf24" />}
                      <span style={{ color: diag.type === 'success' ? '#10b981' : diag.type === 'error' ? '#ef4444' : '#fbbf24' }}>{diag.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: 'rgba(20, 12, 5, 0.8)', border: '1px solid rgba(200, 120, 0, 0.3)', borderRadius: '8px', padding: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#c87800', fontWeight: 'bold' }}>
                <TrendingUp size={14} /> LOGS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {logs.slice(0, 30).map((log, i) => (
                  <div key={i} style={{
                    padding: '4px 6px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px',
                    borderLeft: `3px solid ${log.type === 'success' ? '#10b981' : log.type === 'error' ? '#ef4444' : log.type === 'warn' ? '#fbbf24' : log.type === 'perf' ? '#60a5fa' : '#94a3b8'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ color: '#c87800', fontSize: '9px', fontWeight: 'bold' }}>[{log.category}]</span>
                      <span style={{ color: '#64748b', fontSize: '9px' }}>{log.timestamp}</span>
                    </div>
                    <div style={{ color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#ffe566', fontSize: '10px', wordBreak: 'break-word' }}>
                      {log.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}