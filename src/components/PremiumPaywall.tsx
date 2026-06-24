import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, CheckCircle, XCircle, Infinity } from 'lucide-react';
import { formatPrice, PremiumFeatureId, getAvailableCredits, isPremium } from '../lib/premiumService';
import { completePurchase, formatStars, STARS_PRICING } from '../lib/telegramPaymentService';
import { createSubscription } from '../lib/subscriptionService';
import { SUBSCRIPTION_PRICING } from '../lib/subscriptionPricing';
import { useUser } from '../context/UserContext';
import './PremiumPaywall.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  highlightedFeature?: PremiumFeatureId;
  onPurchase?: (featureId: PremiumFeatureId) => void;
  onUse?: (featureId: PremiumFeatureId) => void;
}

export default function PremiumPaywall({ 
  isOpen, 
  onClose, 
  highlightedFeature,
  onPurchase,
  onUse
}: Props) {
  const { user } = useUser();
  const [selectedFeature, setSelectedFeature] = useState<string>(
    highlightedFeature || 'celtic_cross'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [credits, setCredits] = useState<Record<string, number>>({});
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      const fetchData = async () => {
        console.log('🔍 Fetching credits for user:', user.id);
        const [creditsData, isSub] = await Promise.all([
          getAvailableCredits(user.id),
          isPremium(user.id)
        ]);
        console.log('📊 Credits loaded:', creditsData);
        console.log('✅ Has subscription:', isSub);
        setCredits(creditsData);
        setHasSubscription(isSub);
      };
      fetchData();
    }
  }, [isOpen, user]);

  const handlePurchase = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setIsProcessing(true);

    try {
      // ✅ Subscription purchase (Monthly/Yearly)
      if (selectedFeature === 'subscription_monthly' || selectedFeature === 'subscription_yearly') {
        const plan = selectedFeature === 'subscription_monthly' ? 'monthly' : 'yearly';
        const pricing = SUBSCRIPTION_PRICING[plan];
        
        console.log(`💎 Purchasing ${plan} subscription for ${pricing.stars} stars`);
        
        // Telegram Stars payment
        const result = await completePurchase(
          selectedFeature as PremiumFeatureId,
          user.id
        );

        if (result === 'success') {
          // Create subscription in database
          const subscription = await createSubscription(user.id, plan);
          
          if (subscription) {
            setShowSuccess(true);
            setHasSubscription(true);
            
            if (onPurchase) {
              onPurchase(selectedFeature as PremiumFeatureId);
            }
            
            setTimeout(() => {
              setShowSuccess(false);
              onClose();
            }, 2500);
          } else {
            setErrorMessage('Subscription created but database error occurred. Contact support.');
            setShowError(true);
            setIsProcessing(false);
          }
        } else if (result === 'cancelled') {
          setIsProcessing(false);
        } else {
          setErrorMessage('ტრანზაქცია ვერ განხორციელდა. გთხოვთ სცადოთ ხელახლა.');
          setShowError(true);
          setIsProcessing(false);
        }
      } 
      // ✅ Single reading purchase
      else {
        const result = await completePurchase(
          selectedFeature as PremiumFeatureId,
          user.id
        );

        if (result === 'success') {
          setShowSuccess(true);
          
          setCredits(prev => ({
            ...prev,
            [selectedFeature]: (prev[selectedFeature] || 0) + 1
          }));
          
          if (onPurchase) {
            onPurchase(selectedFeature as PremiumFeatureId);
          }
          
          setTimeout(() => {
            setShowSuccess(false);
            onClose();
          }, 2500);
        } else if (result === 'cancelled') {
          setIsProcessing(false);
        } else {
          setErrorMessage('ტრანზაქცია ვერ განხორციელდა. გთხოვთ სცადოთ ხელახლა.');
          setShowError(true);
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error('❌ Purchase error:', error);
      setErrorMessage('რაღაც შეცდომა მოხდა. გთხოვთ სცადოთ ხელახლა.');
      setShowError(true);
      setIsProcessing(false);
    }
  };

  const handleUse = (featureId: PremiumFeatureId) => {
    if (onUse) {
      onUse(featureId);
    }
  };

  const stars = STARS_PRICING[selectedFeature as PremiumFeatureId] || 0;

  const isSubscriptionTab = selectedFeature === 'subscription_monthly' || selectedFeature === 'subscription_yearly';
  const isSingleTab = selectedFeature === 'celtic_cross' || selectedFeature === 'horseshoe' || selectedFeature === 'relationship';

  const getCredits = (featureId: string) => credits[featureId] || 0;

  // ✅ Purchase button-ის ჩვენების ლოგიკა
  const showPurchaseBtn = () => {
    // Subscription tab-ზე ყოველთვის ჩანს (თუ არ აქვს subscription)
    if (isSubscriptionTab && !hasSubscription) {
      return true;
    }
    // Single tab-ზე ჩანს მხოლოდ თუ არ აქვს subscription და credits = 0
    if (isSingleTab && !hasSubscription && getCredits(selectedFeature) === 0) {
      return true;
    }
    return false;
  };

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
                    className={`premium-feature-item ${selectedFeature === 'subscription_monthly' ? 'selected' : ''} ${hasSubscription ? 'purchased' : ''}`}
                    onClick={() => !isProcessing && setSelectedFeature('subscription_monthly')}
                  >
                    <div className="premium-feature-icon">💎</div>
                    <div className="premium-feature-info">
                      <h4>Premium Monthly</h4>
                      <p>Unlimited readings + AI Insights</p>
                    </div>
                    <div className="premium-feature-price">
                      {hasSubscription ? (
                        <div className="unlimited-badge">
                          <Infinity size={12} />
                          <span>Active</span>
                        </div>
                      ) : (
                        <>
                          <span className="price-usd">{formatPrice(999)}</span>
                          <span className="price-stars">{formatStars(499)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div 
                    className={`premium-feature-item ${selectedFeature === 'subscription_yearly' ? 'selected' : ''} ${hasSubscription ? 'purchased' : ''}`}
                    onClick={() => !isProcessing && setSelectedFeature('subscription_yearly')}
                  >
                    <div className="premium-feature-badge">SAVE 33%</div>
                    <div className="premium-feature-icon">💎</div>
                    <div className="premium-feature-info">
                      <h4>Premium Yearly</h4>
                      <p>Full year access - Best value!</p>
                    </div>
                    <div className="premium-feature-price">
                      {hasSubscription ? (
                        <div className="unlimited-badge">
                          <Infinity size={12} />
                          <span>Active</span>
                        </div>
                      ) : (
                        <>
                          <span className="price-usd">{formatPrice(7999)}</span>
                          <span className="price-stars">{formatStars(3999)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {isSingleTab && (
                <>
                  {/* Celtic Cross */}
                  <div className={`premium-feature-item ${selectedFeature === 'celtic_cross' ? 'selected' : ''} ${getCredits('celtic_cross') > 0 || hasSubscription ? 'purchased' : ''}`}>
                    <div className="premium-feature-icon">✝️</div>
                    <div className="premium-feature-info">
                      <h4>Celtic Cross Reading</h4>
                      <p>10-card deep analysis</p>
                    </div>
                    <div className="premium-feature-price">
                      {hasSubscription ? (
                        <div className="unlimited-badge">
                          <Infinity size={12} />
                          <span>Unlimited</span>
                        </div>
                      ) : getCredits('celtic_cross') > 0 ? (
                        <div className="use-section">
                          <button 
                            className="use-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUse('celtic_cross');
                            }}
                          >
                            Use
                          </button>
                          <div className="credits-badge">
                            <span>{getCredits('celtic_cross')}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="price-usd">{formatPrice(299)}</span>
                          <span className="price-stars">{formatStars(1)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Horseshoe */}
                  <div className={`premium-feature-item ${selectedFeature === 'horseshoe' ? 'selected' : ''} ${getCredits('horseshoe') > 0 || hasSubscription ? 'purchased' : ''}`}>
                    <div className="premium-feature-icon">🐎</div>
                    <div className="premium-feature-info">
                      <h4>Horseshoe Reading</h4>
                      <p>7-card life path</p>
                    </div>
                    <div className="premium-feature-price">
                      {hasSubscription ? (
                        <div className="unlimited-badge">
                          <Infinity size={12} />
                          <span>Unlimited</span>
                        </div>
                      ) : getCredits('horseshoe') > 0 ? (
                        <div className="use-section">
                          <button 
                            className="use-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUse('horseshoe');
                            }}
                          >
                            Use
                          </button>
                          <div className="credits-badge">
                            <span>{getCredits('horseshoe')}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="price-usd">{formatPrice(199)}</span>
                          <span className="price-stars">{formatStars(100)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Relationship */}
                  <div className={`premium-feature-item ${selectedFeature === 'relationship' ? 'selected' : ''} ${getCredits('relationship') > 0 || hasSubscription ? 'purchased' : ''}`}>
                    <div className="premium-feature-icon">❤️</div>
                    <div className="premium-feature-info">
                      <h4>Relationship Spread</h4>
                      <p>6-card love analysis</p>
                    </div>
                    <div className="premium-feature-price">
                      {hasSubscription ? (
                        <div className="unlimited-badge">
                          <Infinity size={12} />
                          <span>Unlimited</span>
                        </div>
                      ) : getCredits('relationship') > 0 ? (
                        <div className="use-section">
                          <button 
                            className="use-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUse('relationship');
                            }}
                          >
                            Use
                          </button>
                          <div className="credits-badge">
                            <span>{getCredits('relationship')}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="price-usd">{formatPrice(399)}</span>
                          <span className="price-stars">{formatStars(200)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ✅ Purchase Button - სწორი ლოგიკით */}
            {showPurchaseBtn() && (
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
                    <span>
                      {isSubscriptionTab 
                        ? `Subscribe for ${formatStars(stars)}` 
                        : `Unlock for ${formatStars(stars)}`
                      }
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Active Subscription Banner */}
            {hasSubscription && (
              <div className="subscription-active-banner">
                <Infinity size={16} />
                <span>Premium Active - Unlimited Access</span>
              </div>
            )}

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
                    {isSubscriptionTab 
                      ? 'Subscription activated!<br />Unlimited readings enabled.' 
                      : 'ტრანზაქცია წარმატებით განხორციელდა.<br />Premium ფუნქციები აქტიურებულია!'
                    }
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