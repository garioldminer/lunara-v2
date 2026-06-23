import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { formatPrice, PremiumFeatureId } from '../lib/premiumService';
import { completePurchase, formatStars, STARS_PRICING } from '../lib/telegramPaymentService';
import { useUser } from '../context/UserContext';
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
  const { user } = useUser();
  const [selectedFeature, setSelectedFeature] = useState<string>(
    highlightedFeature || 'celtic_cross'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePurchase = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await completePurchase(
        selectedFeature as PremiumFeatureId,
        user.id
      );

      if (result === 'success') {
        // წარმატება!
        setShowSuccess(true);
        
        if (onPurchase) {
          onPurchase(selectedFeature as PremiumFeatureId);
        }
        
        // 3 წამის შემდეგ დავხუროთ და გადავიტვირთოთ
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
          window.location.reload();
        }, 3000);
      } else if (result === 'cancelled') {
        // მომხმარებელმა გააუქმა
        setIsProcessing(false);
      } else {
        // შეცდომა
        setErrorMessage('ტრანზაქცია ვერ განხორციელდა. გთხოვთ სცადოთ ხელახლა.');
        setShowError(true);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('❌ Purchase error:', error);
      setErrorMessage('რაღაც შეცდომა მოხდა. გთხოვთ სცადოთ ხელახლა.');
      setShowError(true);
      setIsProcessing(false);
    }
  };

  const stars = STARS_PRICING[selectedFeature as PremiumFeatureId] || 0;

  const isSubscriptionTab = selectedFeature === 'subscription_monthly' || selectedFeature === 'subscription_yearly';
  const isSingleTab = selectedFeature === 'celtic_cross' || selectedFeature === 'horseshoe' || selectedFeature === 'relationship';

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
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button className="premium-close-btn" onClick={onClose} disabled={isProcessing}>
              <X size={20} />
            </button>

            {/* Header */}
            <div className="premium-header">
              <motion.div 
                className="premium-crown-icon"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              >
                👑
              </motion.div>
              <h2 className="premium-title">Unlock Premium</h2>
              <p className="premium-subtitle">
                Discover deeper insights
              </p>
            </div>

            {/* Feature Tabs */}
            <div className="premium-tabs">
              <button
                className={`premium-tab ${isSubscriptionTab ? 'active' : ''}`}
                onClick={() => setSelectedFeature('subscription_monthly')}
                disabled={isProcessing}
              >
                <Crown size={14} />
                <span>Subscription</span>
              </button>
              <button
                className={`premium-tab ${isSingleTab ? 'active' : ''}`}
                onClick={() => setSelectedFeature('celtic_cross')}
                disabled={isProcessing}
              >
                <Sparkles size={14} />
                <span>Single Reading</span>
              </button>
            </div>

            {/* Feature List */}
            <div className="premium-features-list">
              {isSubscriptionTab && (
                <>
                  <div 
                    className={`premium-feature-item ${selectedFeature === 'subscription_monthly' ? 'selected' : ''}`}
                    onClick={() => !isProcessing && setSelectedFeature('subscription_monthly')}
                  >
                    <div className="premium-feature-icon">💎</div>
                    <div className="premium-feature-info">
                      <h4>Premium Monthly</h4>
                      <p>Unlimited readings + AI Insights</p>
                    </div>
                    <div className="premium-feature-price">
                      <span className="price-usd">{formatPrice(999)}</span>
                      <span className="price-stars">{formatStars(499)}</span>
                    </div>
                  </div>

                  <div 
                    className={`premium-feature-item ${selectedFeature === 'subscription_yearly' ? 'selected' : ''}`}
                    onClick={() => !isProcessing && setSelectedFeature('subscription_yearly')}
                  >
                    <div className="premium-feature-badge">SAVE 33%</div>
                    <div className="premium-feature-icon">💎</div>
                    <div className="premium-feature-info">
                      <h4>Premium Yearly</h4>
                      <p>Full year access - Best value!</p>
                    </div>
                    <div className="premium-feature-price">
                      <span className="price-usd">{formatPrice(7999)}</span>
                      <span className="price-stars">{formatStars(3999)}</span>
                    </div>
                  </div>
                </>
              )}

              {isSingleTab && (
                <>
                  <div 
                    className={`premium-feature-item ${selectedFeature === 'celtic_cross' ? 'selected' : ''}`}
                    onClick={() => !isProcessing && setSelectedFeature('celtic_cross')}
                  >
                    <div className="premium-feature-icon">✝️</div>
                    <div className="premium-feature-info">
                      <h4>Celtic Cross Reading</h4>
                      <p>10-card deep analysis</p>
                    </div>
                    <div className="premium-feature-price">
                      <span className="price-usd">{formatPrice(299)}</span>
                      <span className="price-stars">{formatStars(1)}</span>
                    </div>
                  </div>

                  <div 
                    className={`premium-feature-item ${selectedFeature === 'horseshoe' ? 'selected' : ''}`}
                    onClick={() => !isProcessing && setSelectedFeature('horseshoe')}
                  >
                    <div className="premium-feature-icon">🐎</div>
                    <div className="premium-feature-info">
                      <h4>Horseshoe Reading</h4>
                      <p>7-card life path</p>
                    </div>
                    <div className="premium-feature-price">
                      <span className="price-usd">{formatPrice(199)}</span>
                      <span className="price-stars">{formatStars(100)}</span>
                    </div>
                  </div>

                  <div 
                    className={`premium-feature-item ${selectedFeature === 'relationship' ? 'selected' : ''}`}
                    onClick={() => !isProcessing && setSelectedFeature('relationship')}
                  >
                    <div className="premium-feature-icon">❤️</div>
                    <div className="premium-feature-info">
                      <h4>Relationship Spread</h4>
                      <p>6-card love analysis</p>
                    </div>
                    <div className="premium-feature-price">
                      <span className="price-usd">{formatPrice(399)}</span>
                      <span className="price-stars">{formatStars(200)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Purchase Button */}
            <button 
              className="premium-purchase-btn"
              onClick={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="premium-spinner"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Unlock for {formatStars(stars)}</span>
                </>
              )}
            </button>

            {/* Footer */}
            <p className="premium-footer">
              💳 Secure payment via Telegram Stars
            </p>
          </motion.div>

          {/* Success Banner */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                className="success-banner-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="success-banner"
                  initial={{ scale: 0.5, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: 50 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                >
                  <motion.div 
                    className="success-icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                  >
                    <CheckCircle size={80} />
                  </motion.div>
                  <h3 className="success-title">წარმატებით!</h3>
                  <p className="success-message">
                    ტრანზაქცია წარმატებით განხორციელდა.<br />
                    Premium ფუნქციები აქტიურებულია!
                  </p>
                  <div className="success-stars">
                    ⭐ {stars} Stars დახარჯული
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner */}
          <AnimatePresence>
            {showError && (
              <motion.div
                className="error-banner-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="error-banner"
                  initial={{ scale: 0.5, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: 50 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                >
                  <motion.div 
                    className="error-icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                  >
                    <XCircle size={80} />
                  </motion.div>
                  <h3 className="error-title">ვერ განხორციელდა</h3>
                  <p className="error-message">{errorMessage}</p>
                  <button 
                    className="error-close-btn"
                    onClick={() => setShowError(false)}
                  >
                    კარგი
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}