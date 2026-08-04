import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Layers, Compass, Heart, Briefcase, Crown } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getActiveSubscription } from '../lib/subscriptionService';
import './ReadingScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

interface SpreadOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isPremium: boolean;
  navigateTo: string;
}

export default function ReadingScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [hasPremium, setHasPremium] = useState(false);

  useEffect(() => {
    console.log('🔮 ReadingScreen mounted');
    if (user) {
      getActiveSubscription(user.id).then(sub => setHasPremium(!!sub));
    }
  }, [user, onNavigate]);

  const spreads: SpreadOption[] = [
    {
      id: 'single',
      title: 'Single Card',
      description: 'Quick answer to your question',
      icon: <Sparkles size={24} />,
      isPremium: false,
      navigateTo: 'daily-card'
    },
    {
      id: 'three-card',
      title: '3-Card Spread',
      description: 'Past · Present · Future',
      icon: <Layers size={24} />,
      isPremium: false,
      navigateTo: 'three-card-reading'
    },
    {
      id: 'celtic-cross',
      title: 'Celtic Cross',
      description: '10 cards · Full analysis',
      icon: <Compass size={24} />,
      isPremium: true,
      navigateTo: 'celtic-cross'
    },
    {
      id: 'love',
      title: 'Love Spread',
      description: 'Relationship guidance',
      icon: <Heart size={24} />,
      isPremium: true,
      navigateTo: 'relationship'
    },
    {
      id: 'career',
      title: 'Career Spread',
      description: 'Professional path',
      icon: <Briefcase size={24} />,
      isPremium: true,
      navigateTo: 'career'
    }
  ];

  const handleSpreadClick = (spread: SpreadOption) => {
    if (spread.isPremium && !hasPremium) {
      // Haptic feedback if available
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }
      onNavigate?.('pricing');
      return;
    }

    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    onNavigate?.(spread.navigateTo);
  };

  return (
    <div className="reading-screen">
      {/* Particles Background */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
              width: `${2 + Math.random() * 2}px`,
              height: `${2 + Math.random() * 2}px`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="rs-header">
        {onNavigate && (
          <button className="rs-back-btn" onClick={() => onNavigate('home')}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="rs-header-center">
          <div className="rs-ornament">✦</div>
          <h1 className="rs-title">Choose Your Spread</h1>
          <div className="rs-ornament">✦</div>
        </div>
        <div className="rs-header-spacer" />
      </div>

      {/* Content */}
      <div className="rs-content">
        <p className="rs-subtitle">Select a reading type to begin your journey</p>

        <div className="spreads-list">
          {spreads.map((spread, index) => (
            <motion.div
              key={spread.id}
              className={`spread-item ${spread.isPremium ? 'premium' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSpreadClick(spread)}
            >
              <div className="spread-icon-wrapper">
                {spread.icon}
              </div>
              <div className="spread-info">
                <h3 className="spread-title">{spread.title}</h3>
                <p className="spread-desc">{spread.description}</p>
              </div>
              {spread.isPremium && (
                <div className="premium-badge">
                  <Crown size={16} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {!hasPremium && (
          <div className="rs-premium-cta">
            <p>Unlock all spreads with Premium</p>
            <button onClick={() => onNavigate?.('pricing')}>
              Upgrade Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}