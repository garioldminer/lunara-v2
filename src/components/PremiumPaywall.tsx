import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Crown, Sparkles, Lock } from 'lucide-react';
import { PREMIUM_FEATURES, formatPrice, PremiumFeatureId } from '../lib/premiumService';
import './PremiumPaywall.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  highlightedFeature?: PremiumFeatureId;
  onPurchase?: (featureId: PremiumFeatureId) => void;
}

export default function PremiumPaywall({ 
  isOpen, 
  onClose, 
  highlightedFeature,
  onPurchase 
}: Props) {
  const [selectedFeature, setSelectedFeature] = useState<PremiumFeatureId>(
    highlightedFeature || 'subscription_monthly'
  );

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(selectedFeature);
    }
    // TODO: Telegram Payment integration will be here
    console.log('💳 Purchasing:', selectedFeature);
  };

  const feature = PREMIUM_FEATURES[selectedFeature];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="premium-paywall-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="premium-paywall-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button className="premium-close-btn" onClick={onClose}>
              <X size={20} />
            </button>

            {/* Header */}
            <div className="premium-header">
              <div className="premium-icon">
                <Crown size={40} />
              </div>
              <h2 className="premium-title">Unlock Premium</h2>
              <p className="premium-subtitle">
                Discover deeper insights with our premium features
              </p>
            </div>

            {/* Feature Tabs */}
            <div className="premium-tabs">
              <button
                className={`premium-tab ${selectedFeature === 'subscription_monthly' ? 'active' : ''}`}
                onClick={() => setSelectedFeature('subscription_monthly')}
              >
                <Crown size={16} />
                <span>Subscription</span>
              </button>
              <button
                className={`premium-tab ${selectedFeature === 'celtic_cross' ? 'active' : ''}`}
                onClick={() => setSelectedFeature('celtic_cross')}
              >
                <Sparkles size={16} />
                <span>Single Reading</span>
              </button>
            </div>

            {/* Feature List */}
            <div className="premium-features-list">
              {selectedFeature === 'subscription_monthly' && (
                <>
                  <div 
                    className={`premium-feature-item ${selectedFeature === 'subscription_monthly' ? 'selected' : ''}`}
                    onClick={() => setSelectedFeature('subscription_monthly')}
                  >
                    <div className="premium-feature-icon">💎</div>
                    <div className="premium-feature-info">
                      <h4>Premium Monthly</h4>
                      <p>Unlimited readings + AI Insights</p>
                    </div>
                    <div className="premium-feature-price">
                      {formatPrice(999)}
                      <span>/mo</span>
                    </div>
                  </div>

                  <div 
                    className={`premium-feature-item ${selectedFeature === 'subscription_yearly' ? 'selected' : ''}`}
                    onClick={() => setSelectedFeature('subscription_yearly')}
                  >
                    <div className="premium-feature-badge">SAVE 33%</div>
                    <div className="premium-feature-icon">💎</div>
                    <div className="premium-feature-info">
                      <h4>Premium Yearly</h4>
                      <p>Full year access - Best value!</p>
                    </div>
                    <div className="premium-feature-price">
                      {formatPrice(7999)}
                      <span>/yr</span>
                    </div>
                  </div>

                  <div className="premium-benefits">
                    <h4>What's included:</h4>
                    <ul>
                      <li><Check size={14} /> Unlimited 3-Card Readings</li>
                      <li><Check size={14} /> All Premium Spreads (Celtic Cross, Horseshoe, etc.)</li>
                      <li><Check size={14} /> AI Weekly Insights</li>
                      <li><Check size={14} /> Personalized Pattern Analysis</li>
                      <li><Check size={14} /> Ad-free Experience</li>
                    </ul>
                  </div>
                </>
              )}

              {selectedFeature === 'celtic_cross' && (
                <>
                  <div 
                    className={`premium-feature-item ${selectedFeature === 'celtic_cross' ? 'selected' : ''}`}
                    onClick={() => setSelectedFeature('celtic_cross')}
                  >
                    <div className="premium-feature-icon">✝️</div>
                    <div className="premium-feature-info">
                      <h4>Celtic Cross</h4>
                      <p>10-card deep analysis</p>
                    </div>
                    <div className="premium-feature-price">
                      {formatPrice(299)}
                    </div>
                  </div>

                  <div 
                    className={`premium-feature-item ${selectedFeature === 'horseshoe' ? 'selected' : ''}`}
                    onClick={() => setSelectedFeature('horseshoe')}
                  >
                    <div className="premium-feature-icon">🐎</div>
                    <div className="premium-feature-info">
                      <h4>Horseshoe</h4>
                      <p>7-card life path</p>
                    </div>
                    <div className="premium-feature-price">
                      {formatPrice(199)}
                    </div>
                  </div>

                  <div 
                    className={`premium-feature-item ${selectedFeature === 'relationship' ? 'selected' : ''}`}
                    onClick={() => setSelectedFeature('relationship')}
                  >
                    <div className="premium-feature-icon">❤️</div>
                    <div className="premium-feature-info">
                      <h4>Relationship Spread</h4>
                      <p>6-card love analysis</p>
                    </div>
                    <div className="premium-feature-price">
                      {formatPrice(399)}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Purchase Button */}
            <button 
              className="premium-purchase-btn"
              onClick={handlePurchase}
            >
              <Lock size={16} />
              <span>Unlock for {formatPrice(feature.price)}</span>
            </button>

            {/* Footer */}
            <p className="premium-footer">
              Secure payment via Telegram
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}