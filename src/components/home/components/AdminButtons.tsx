import { Shield, Bug, Ruler } from 'lucide-react';

interface AdminButtonsProps {
  onNavigate: (screen: string) => void;
  onOpenDebug: () => void;
  onOpenLayoutDebug: () => void;
}

export function AdminButtons({ onNavigate, onOpenDebug, onOpenLayoutDebug }: AdminButtonsProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      right: '8px',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 9990,
      pointerEvents: 'auto'
    }}>
      <button
        onClick={() => onNavigate('admin')}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95))',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 0.2s ease'
        }}
        title="Admin Panel"
      >
        <Shield size={20} />
      </button>

      <button
        onClick={onOpenDebug}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(109, 40, 217, 0.95))',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 0.2s ease'
        }}
        title="Debug Panel"
      >
        <Bug size={20} />
      </button>

      <button
        onClick={onOpenLayoutDebug}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 0.2s ease'
        }}
        title="Layout Debugger"
      >
        <Ruler size={20} />
      </button>
    </div>
  );
}