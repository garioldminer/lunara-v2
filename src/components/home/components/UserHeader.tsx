import { Gem, Zap, Crown } from 'lucide-react';
import { getZodiacSymbol, getLevelFromTotalXP } from '../lib/helpers';

interface UserHeaderProps {
  user: any;
  economy: any;
  activeSubscription: any;
  onNavigate: (screen: string) => void;
  onOpenShop: () => void;
  onRefillEnergy: () => void;
  isClaiming: boolean;
}

export function UserHeader({ 
  user, 
  economy, 
  activeSubscription, 
  onNavigate, 
  onOpenShop, 
  onRefillEnergy, 
  isClaiming 
}: UserHeaderProps) {
  const userLevelData = getLevelFromTotalXP(economy.xp);
  const xpPercent = Math.min((userLevelData.currentLevelXP / userLevelData.xpToNext) * 100, 100);
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - (xpPercent / 100) * circumference;

  return (
    <div className="user-header">
      <div className="user-main-row" style={{ alignItems: 'center', height: '52px', display: 'flex', justifyContent: 'space-between' }}>
        
        <div className="avatar-section clickable-avatar" onClick={() => onNavigate('profile')} style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
          <svg className="xp-circular-progress" width="52" height="52" viewBox="0 0 52 52" style={{ position: 'absolute', top: 0, left: 0 }}>
            <circle className="xp-circle-bg" cx="26" cy="26" r="22" fill="none" stroke="#e9d5ff" strokeWidth="4" />
            <circle className="xp-circle-progress" cx="26" cy="26" r="22" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} transform="rotate(-90 26 26)" />
          </svg>
          <div style={{ position: 'absolute', top: '6px', left: '6px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)', borderRadius: '50%', color: '#0f0c08', zIndex: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            {user?.display_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#0f0c08', borderRadius: '6px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', zIndex: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.4), 0 0 0 1.5px #1a1510', border: '1.5px solid #1a1510' }}>
            {userLevelData.level}
          </div>
          {activeSubscription && (
            <div style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', borderRadius: '6px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.4), 0 0 0 1.5px #1a1510', border: '1.5px solid #1a1510' }}>
              <Crown size={10} style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))' }} />
            </div>
          )}
        </div>
        
        <div className="user-info-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '52px', marginLeft: '12px', flex: 1, minWidth: 0 }}>
          
          <h2 className="username" style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: 700,
            height: '24px', 
            lineHeight: '24px',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {user?.display_name || 'LunaraSeeker'}
          </h2>
          
          {user?.sun_sign ? (
            <div 
              className="zodiac-sign-badge" 
              onClick={() => onNavigate('profile')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                height: '24px',
                boxSizing: 'border-box',
                alignSelf: 'flex-start',
                padding: '0 10px',
                background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.15), rgba(197, 160, 89, 0.08))',
                border: '1px solid rgba(197, 160, 89, 0.3)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                maxWidth: '100%'
              }}
            >
              <span style={{ fontSize: '12px', lineHeight: 1, filter: 'drop-shadow(0 0 3px rgba(197, 160, 89, 0.6))', flexShrink: 0 }}>
                {getZodiacSymbol(user.sun_sign)}
              </span>
              <span style={{ 
                fontSize: '11px', 
                lineHeight: 1,
                color: '#C5A059', 
                fontWeight: 600, 
                letterSpacing: '0.5px',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user.sun_sign}
              </span>
            </div>
          ) : (
            <div 
              className="add-sign-badge" 
              onClick={() => onNavigate('sign-selection')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                height: '24px',
                boxSizing: 'border-box',
                alignSelf: 'flex-start',
                padding: '0 10px',
                background: 'rgba(197, 160, 89, 0.1)',
                border: '1px dashed rgba(197, 160, 89, 0.4)',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '10px',
                color: '#b3a68c',
                transition: 'all 0.2s ease'
              }}
            >
              <span>✨</span>
              <span>Add your sign</span>
            </div>
          )}
        </div>
        
        <div className="user-resources" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '52px', flexShrink: 0 }}>
          
          <div className="resource gems" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '6px', 
            background: 'rgba(147, 112, 219, 0.15)', 
            padding: '0 8px', 
            borderRadius: '12px', 
            border: '1px solid rgba(147, 112, 219, 0.3)', 
            height: '24px',
            boxSizing: 'border-box'
          }}>
            <Gem size={12} className="resource-icon gem-icon" style={{ color: '#9370db', flexShrink: 0 }} />
            <span className="value" style={{ fontSize: '12px', fontWeight: '600', color: '#fff', textAlign: 'center' }}>{economy.cosmic_coins.toLocaleString()}</span>
            <button 
              className="add-btn" 
              onClick={onOpenShop}
              style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(197, 160, 89, 0.3)', border: 'none', color: '#C5A059', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}
              title="Buy Diamonds"
            >
              +
            </button>
          </div>
          
          <div className="resource energy" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '6px', 
            background: 'rgba(251, 191, 36, 0.15)', 
            padding: '0 8px', 
            borderRadius: '12px', 
            border: '1px solid rgba(251, 191, 36, 0.3)', 
            height: '24px',
            boxSizing: 'border-box'
          }}>
            <Zap size={12} className="resource-icon energy-icon" style={{ color: '#fbbf24', flexShrink: 0 }} />
            <span className="value" style={{ fontSize: '12px', fontWeight: '600', color: '#fff', textAlign: 'center' }}>
              {economy.cosmic_focus || 0}/{economy.max_focus || 20}
            </span>
            
            {(() => {
              const isEnergyFull = (economy.cosmic_focus || 0) >= (economy.max_focus || 20);
              const energyNeeded = (economy.max_focus || 20) - (economy.cosmic_focus || 0);
              const energyToAdd = Math.min(10, energyNeeded);
              const cost = energyToAdd * 5;
              
              return (
                <button 
                  className="add-btn" 
                  onClick={onRefillEnergy}
                  disabled={isClaiming || isEnergyFull}
                  style={{ 
                    width: '18px', height: '18px', borderRadius: '50%', 
                    background: (isClaiming || isEnergyFull) ? 'rgba(150,150,150,0.3)' : 'rgba(197, 160, 89, 0.3)', 
                    border: 'none', 
                    color: (isClaiming || isEnergyFull) ? '#666' : '#C5A059', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: (isClaiming || isEnergyFull) ? 'not-allowed' : 'pointer', 
                    fontSize: '12px', fontWeight: 'bold', flexShrink: 0 
                  }}
                  title={isEnergyFull ? "Energy is already full" : `Buy ${energyToAdd}⚡ Energy for ${cost} 💎`}
                >
                  {isClaiming ? '...' : (isEnergyFull ? '✓' : '+')}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}