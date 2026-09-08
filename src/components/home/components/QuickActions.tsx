import { Sparkles, LayoutGrid, Moon, Scroll, TrendingUp, Crown } from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';

const hexToRgbVars = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
};

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  color: string;
  action: string;
  isPremium?: boolean;
  isServices?: boolean;
  isPlaceholder?: boolean;
}

interface QuickActionsProps {
  activeSubscription: any;
  onAction: (action: string, isPremium?: boolean) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (screen: string) => void;
}

export function QuickActions({ activeSubscription, onAction, showToast, onNavigate }: QuickActionsProps) {
  const { t } = useTranslation();

  const quickActions: QuickAction[] = [
    { icon: <Sparkles size={28} />, label: t('home.quickAccess.daily'), sublabel: t('home.quickAccess.card'), color: '#C5A059', action: 'Daily' },
    { icon: <LayoutGrid size={28} />, label: t('home.quickAccess.threeCards'), sublabel: t('home.quickAccess.reading'), color: '#a78bfa', action: '3Cards' },
    { icon: <Moon size={28} />, label: t('home.quickAccess.tarot'), sublabel: t('home.quickAccess.draw'), color: '#60a5fa', action: 'Tarot' },
    { icon: <Scroll size={28} />, label: t('home.quickAccess.history'), sublabel: t('home.quickAccess.readings'), color: '#34d399', action: 'History' },
    { icon: <TrendingUp size={28} />, label: 'Stats', sublabel: 'Journal', color: '#C5A059', action: 'Stats' },
    { icon: <Crown size={28} />, label: t('home.quickAccess.celtic'), sublabel: t('home.quickAccess.cross'), color: '#C5A059', action: 'CelticCross', isPremium: true },
    { icon: <span style={{ fontSize: '28px' }}>🐎</span>, label: t('home.quickAccess.horseshoe'), sublabel: t('home.quickAccess.sevenCards'), color: '#fb923c', action: 'Horseshoe', isPremium: true },
    { icon: <span style={{ fontSize: '28px' }}>❤️</span>, label: t('home.quickAccess.love'), sublabel: t('home.quickAccess.spread'), color: '#f472b6', action: 'Relationship', isPremium: true },
    { icon: <Sparkles size={28} />, label: t('home.quickAccess.services'), sublabel: t('home.quickAccess.shop'), color: '#FFD700', action: 'Services', isServices: true },
    { icon: <span style={{ fontSize: '28px' }}>✨</span>, label: 'Coming', sublabel: 'Soon', color: '#8b5cf6', action: 'Placeholder10', isPlaceholder: true },
  ];

  const handleClick = (action: QuickAction) => {
    if (action.isPlaceholder) return;

    // Premium lock check
    if (action.isPremium && !activeSubscription) {
      showToast(t('home.premiumLocked'), 'info');
      onNavigate('pricing');
      return;
    }

    onAction(action.action, action.isPremium);
  };

  return (
    <div className="quick-access">
      <div className="quick-grid">
        {quickActions.map((action) => (
          <button
            key={action.action}
            className={`quick-item ${action.isPremium ? 'premium-item' : ''} ${action.isServices ? 'services-item' : ''} ${action.isPlaceholder ? 'placeholder-item' : ''}`}
            style={{
              '--glow-color': action.color,
              '--glow-color-rgb': hexToRgbVars(action.color),
              background: action.isPlaceholder
                ? 'transparent'
                : `linear-gradient(160deg, ${hexToRgba(action.color, 0.14)} 0%, rgba(16, 13, 10, 0.97) 60%)`,
              border: action.isPlaceholder
                ? '1px dashed rgba(255, 255, 255, 0.05)'
                : `1px solid ${hexToRgba(action.color, action.isPremium || action.isServices ? 0.45 : 0.28)}`
            } as React.CSSProperties}
            onClick={() => handleClick(action)}
          >
            {action.isPremium && (
              <div className="premium-badge-quick">💎</div>
            )}
            {action.isServices && (
              <div className="services-badge-quick">🛍️</div>
            )}
            <div className="quick-icon">{action.icon}</div>
            {action.label && <span className="quick-label">{action.label}</span>}
            {action.sublabel && <span className="quick-sublabel">{action.sublabel}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}