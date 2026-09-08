import { Crown } from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';

const ZODIAC_SYMBOLS: Record<string, string> = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
  leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
  sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓'
};

const getZodiacSymbol = (signName: string): string => {
  if (!signName) return '✧';
  return ZODIAC_SYMBOLS[signName.toLowerCase()] || '✧';
};

interface UserHeaderProps {
  user: any;
  economy: {
    cosmic_coins: number;
    xp: number;
    level: number;
    cosmic_focus: number;
    max_focus: number;
  };
  activeSubscription: any;
  userLevelData: { level: number; currentLevelXP: number; xpToNext: number };
  circumference: number;
  strokeDashoffset: number;
  onNavigate: (screen: string) => void;
  onOpenShop: () => void;
  onRefillEnergy: () => void;
  isClaiming: boolean;
}

export function UserHeader({
  user,
  economy,
  activeSubscription,
  userLevelData,
  circumference,
  strokeDashoffset,
  onNavigate,
  onOpenShop,
  onRefillEnergy,
  isClaiming
}: UserHeaderProps) {
  const { t } = useTranslation();

  const isEnergyFull = (economy.cosmic_focus || 0) >= (economy.max_focus || 20);
  const energyNeeded = (economy.max_focus || 20) - (economy.cosmic_focus || 0);
  const energyToAdd = Math.min(10, energyNeeded);
  const cost = energyToAdd * 5;

  return (
    <div className="user-header">
      <div className="user-main-row">
        <div className="avatar-section clickable-avatar" onClick={() => onNavigate('profile')}>
          <svg className="xp-circular-progress" width="52" height="52" viewBox="0 0 52 52">
            <circle className="xp-circle-bg" cx="26" cy="26" r="22" fill="none" stroke="#e9d5ff" strokeWidth="4" />
            <circle
              className="xp-circle-progress"
              cx="26" cy="26" r="22"
              fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 26 26)"
            />
          </svg>
          <div className="avatar-image">
            {user?.display_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="level-badge">
            {userLevelData.level}
          </div>
          {activeSubscription && (
            <div className="premium-badge">
              <Crown size={10} />
            </div>
          )}
        </div>

        <div className="user-info-section">
          <h2 className="username">
            {user?.display_name || 'LunaraSeeker'}
          </h2>
          
          {user?.sun_sign ? (
            <div className="zodiac-sign-badge" onClick={() => onNavigate('profile')}>
              <span className="zodiac-symbol">{getZodiacSymbol(user.sun_sign)}</span>
              <span className="zodiac-name">{user.sun_sign}</span>
            </div>
          ) : (
            <div className="add-sign-badge" onClick={() => onNavigate('sign-selection')}>
              <span>✨</span>
              <span>{t('home.addSign')}</span>
            </div>
          )}
        </div>

        <div className="user-resources">
          <div className="resource gems">
            <span className="resource-icon gem-icon">💎</span>
            <span className="value">{economy.cosmic_coins.toLocaleString()}</span>
            <button className="add-btn" onClick={onOpenShop} title="Buy Diamonds">+</button>
          </div>

          <div className="resource energy">
            <span className="resource-icon energy-icon">⚡</span>
            <span className="value">
              {economy.cosmic_focus || 0}/{economy.max_focus || 20}
            </span>
            <button
              className="add-btn"
              onClick={onRefillEnergy}
              disabled={isClaiming || isEnergyFull}
              title={isEnergyFull ? t('home.energyFull') : t('home.buyEnergy', { amount: energyToAdd, cost })}
            >
              {isClaiming ? '...' : isEnergyFull ? '✓' : '+'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}