import { hexToRgbVars, hexToRgba } from '../lib/helpers';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color: string;
  action: string;
  isPremium?: boolean;
  isServices?: boolean;
  isPlaceholder?: boolean;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
  onAction: (action: string) => void;
}

const premiumBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '3px',
  right: '3px',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '8px',
  lineHeight: 1,
  boxShadow: '0 1px 4px rgba(197, 160, 89, 0.6), 0 0 0 1px rgba(26, 21, 16, 0.95)',
  zIndex: 10,
  pointerEvents: 'none'
};

const servicesBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '3px',
  right: '3px',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '8px',
  lineHeight: 1,
  boxShadow: '0 1px 4px rgba(255, 215, 0, 0.5), 0 0 0 1px rgba(26, 21, 16, 0.95)',
  zIndex: 10,
  pointerEvents: 'none'
};

export function QuickActionsGrid({ actions, onAction }: QuickActionsGridProps) {
  return (
    <div className="quick-access">
      <div className="quick-grid">
        {actions.map((action) => (
          <button 
            key={action.action} 
            className={`quick-item ${action.isPremium ? 'premium-item' : ''} ${(action as any).isServices ? 'services-item' : ''} ${(action as any).isPlaceholder ? 'placeholder-item' : ''}`} 
            style={{ 
              '--glow-color': action.color,
              '--glow-color-rgb': hexToRgbVars(action.color),
              background: (action as any).isPlaceholder 
                ? 'transparent' 
                : `linear-gradient(160deg, ${hexToRgba(action.color, 0.14)} 0%, rgba(16, 13, 10, 0.97) 60%)`,
              border: (action as any).isPlaceholder 
                ? '1px dashed rgba(255, 255, 255, 0.05)' 
                : `1px solid ${hexToRgba(action.color, (action as any).isPremium || (action as any).isServices ? 0.45 : 0.28)}`,
              borderRadius: '14px',
              padding: 'clamp(10px, 3vw, 14px) 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              color: '#fff',
              cursor: (action as any).isPlaceholder ? 'default' : 'pointer',
              position: 'relative',
              overflow: 'visible',
              boxShadow: (action as any).isPlaceholder ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              transition: 'all 0.25s ease',
              opacity: (action as any).isPlaceholder ? 0.3 : 1,
              pointerEvents: (action as any).isPlaceholder ? 'none' : 'auto'
            } as React.CSSProperties} 
            onClick={() => !(action as any).isPlaceholder && onAction(action.action)}
          >
            {action.isPremium && (
              <div style={premiumBadgeStyle}>💎</div>
            )}
            {(action as any).isServices && (
              <div style={servicesBadgeStyle}>🛍️</div>
            )}
            <div className="quick-icon" style={{ filter: (action as any).isPlaceholder ? 'none' : `drop-shadow(0 0 6px ${action.color})`, color: action.color }}>{action.icon}</div>
            {action.label && <span className="quick-label">{action.label}</span>}
            {action.sublabel && <span className="quick-sublabel">{action.sublabel}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}