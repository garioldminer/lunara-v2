import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, CheckCircle, XCircle, Infinity } from 'lucide-react';
import { formatPrice, PremiumFeatureId, getAvailableCredits, isPremium } from '../lib/premiumService';
import { completePurchase, formatStars } from '../lib/telegramPaymentService';
import { createSubscription } from '../lib/subscriptionService';
import { getSubscriptionPlans, getPremiumFeatures, getPremiumBenefits, SubscriptionPlan, PremiumFeature, PremiumBenefit } from '../lib/premiumConfig';
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
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [features, setFeatures] = useState<PremiumFeature[]>([]);
  const [benefits, setBenefits] = useState<PremiumBenefit[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      const fetchData = async () => {
        const [creditsData, isSub, plansData, featuresData, benefitsData] = await Promise.all([
          getAvailableCredits(user.id),
          isPremium(user.id),
          getSubscriptionPlans(),
          getPremiumFeatures(),
          getPremiumBenefits()
        ]);
        
        setCredits(creditsData);
        setHasSubscription(isSub);
        setPlans(plansData);
        setFeatures(featuresData);
        setBenefits(benefitsData);
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
      if (selectedFeature === 'subscription_monthly' || selectedFeature === 'subscription_yearly') {
        const planType = selectedFeature === 'subscription_monthly' ? 'monthly' : 'yearly';
        const plan = plans.find(p => p.plan_type === planType);
        
        if (!plan) {
          setErrorMessage('Plan not found. Please try again.');
          setShowError(true);
          setIsProcessing(false);
          return;
        }
        
        const result = await completePurchase(
          selectedFeature as PremiumFeatureId,
          user.id
        );

        if (result === 'success') {
          const subscription = await createSubscription(user.id, planType);
          
          if (subscription) {
            setShowSuccess(true);
            setHasSubscription(true);
            if (onPurchase) onPurchase(selectedFeature as PremiumFeatureId);
            setTimeout(() => { setShowSuccess(false); onClose(); }, 2500);
          } else {
            setErrorMessage('Subscription created but database error. Contact support.');
            setShowError(true);
            setIsProcessing(false);
          }
        } else if (result === 'cancelled') {
          setIsProcessing(false);
        } else {
          setErrorMessage('Transaction failed. Please try again.');
          setShowError(true);
          setIsProcessing(false);
        }
      } else {
        const result = await completePurchase(
          selectedFeature as PremiumFeatureId,
          user.id
        );

        if (result === 'success') {
          setShowSuccess(true);
          setCredits(prev => ({ ...prev, [selectedFeature]: (prev[selectedFeature] || 0) + 1 }));
          if (onPurchase) onPurchase(selectedFeature as PremiumFeatureId);
          setTimeout(() => { setShowSuccess(false); onClose(); }, 2500);
        } else if (result === 'cancelled') {
          setIsProcessing(false);
        } else {
          setErrorMessage('Transaction failed. Please try again.');
          setShowError(true);
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error('❌ Purchase error:', error);
      setErrorMessage('Something went wrong. Please try again.');
      setShowError(true);
      setIsProcessing(false);
    }
  };

  const handleUse = (featureId: PremiumFeatureId) => {
    if (onUse) onUse(featureId);
  };

  // ✅ FIX: removed getFeatureUSD (unused), kept getFeatureStars
  const getFeatureStars = (featureId: string): number => {
    if (featureId === 'subscription_monthly' || featureId === 'subscription_yearly') {
      const planType = featureId === 'subscription_monthly' ? 'monthly' : 'yearly';
      const plan = plans.find(p => p.plan_type === planType);
      return plan?.stars || 0;
    }
    const feature = features.find(f => f.feature_id === featureId);
    return feature?.stars || 0;
  };

  const getPlanDetails = (planType: 'monthly' | 'yearly') => {
    return plans.find(p => p.plan_type === planType);
  };

  const getFeatureDetails = (featureId: string) => {
    return features.find(f => f.feature_id === featureId);
  };

  const stars = getFeatureStars(selectedFeature);
  const isSubscriptionTab = selectedFeature === 'subscription_monthly' || selectedFeature === 'subscription_yearly';
  const isSingleTab = selectedFeature === 'celtic_cross' || selectedFeature === 'horseshoe' || selectedFeature === 'relationship';
  const getCredits = (featureId: string) => credits[featureId] || 0;

  const showPurchaseBtn = () => {
    if (isSubscriptionTab && !hasSubscription) return true;
    if (isSingleTab && !hasSubscription && getCredits(selectedFeature) === 0) return true;
    return false;
  };

  const monthlyPlan = getPlanDetails('monthly');
  const yearlyPlan = getPlanDetails('yearly');
  const celticCross = getFeatureDetails('celtic_cross');
  const horseshoe = getFeatureDetails('horseshoe');
  const relationship = getFeatureDetails('relationship');

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
            <button className="premium-close-btn" onClick={onClose} disabled={isProcessing}>
              <X size={20} />
            </button>

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
              <p className="premium-subtitle">Discover deeper insights</p>
            </div>

            <div className="premium-tabs">
              <button className={`premium-tab ${isSubscriptionTab ? 'active' : ''}`} onClick={() => setSelectedFeature('subscription_monthly')} disabled={isProcessing}>
                <Crown size={14} /><span>Subscription</span>
              </button>
              <button className={`premium-tab ${isSingleTab ? 'active' : ''}`} onClick={() => setSelectedFeature('celtic_cross')} disabled={isProcessing}>
                <Sparkles size={14} /><span>Single Reading</span>
              </button>
            </div>

            <div className="premium-features-list">
              {isSubscriptionTab && (
                <>
                  <div className="features-list-section">
                    <h3 className="features-section-title">✦ What's Included ✦</h3>
                    <div className="features-grid">
                      {benefits.map((benefit) => (
                        <div key={benefit.id} className="feature-item-mini">
                          <span className="feature-icon-mini">{benefit.icon}</span>
                          <span className="feature-text-mini">{benefit.text}</span>
                          <CheckCircle size={12} className="feature-check-mini" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ✅ FIX: hardcoded 💎 icon instead of plan.icon (doesn't exist) */}
                  {monthlyPlan && (
                    <div 
                      className={`premium-feature-item ${selectedFeature === 'subscription_monthly' ? 'selected' : ''} ${hasSubscription ? 'purchased' : ''}`}
                      onClick={() => !isProcessing && setSelectedFeature('subscription_monthly')}
                    >
                      <div className="premium-feature-icon">💎</div>
                      <div className="premium-feature-info">
                        <h4>{monthlyPlan.label}</h4>
                        <p>{monthlyPlan.description}</p>
                      </div>
                      <div className="premium-feature-price">
                        {hasSubscription ? (
                          <div className="unlimited-badge"><Infinity size={12} /><span>Active</span></div>
                        ) : (
                          <>
                            <span className="price-usd">{formatPrice(monthlyPlan.usd_cents)}</span>
                            <span className="price-stars">{formatStars(monthlyPlan.stars)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ✅ FIX: hardcoded 💎 icon instead of plan.icon (doesn't exist) */}
                  {yearlyPlan && (
                    <div 
                      className={`premium-feature-item ${selectedFeature === 'subscription_yearly' ? 'selected' : ''} ${hasSubscription ? 'purchased' : ''}`}
                      onClick={() => !isProcessing && setSelectedFeature('subscription_yearly')}
                    >
                      {yearlyPlan.savings_text && (
                        <div className="premium-feature-badge">{yearlyPlan.savings_text}</div>
                      )}
                      <div className="premium-feature-icon">💎</div>
                      <div className="premium-feature-info">
                        <h4>{yearlyPlan.label}</h4>
                        <p>{yearlyPlan.description}</p>
                      </div>
                      <div className="premium-feature-price">
                        {hasSubscription ? (
                          <div className="unlimited-badge"><Infinity size={12} /><span>Active</span></div>
                        ) : (
                          <>
                            <span className="price-usd">{formatPrice(yearlyPlan.usd_cents)}</span>
                            <span className="price-stars">{formatStars(yearlyPlan.stars)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {isSingleTab && (
                <>
                  {celticCross && (
                    <div className={`premium-feature-item ${selectedFeature === 'celtic_cross' ? 'selected' : ''} ${getCredits('celtic_cross') > 0 || hasSubscription ? 'purchased' : ''}`}>
                      <div className="premium-feature-icon">{celticCross.icon}</div>
                      <div className="premium-feature-info">
                        <h4>{celticCross.name}</h4>
                        <p>{celticCross.description}</p>
                      </div>
                      <div className="premium-feature-price">
                        {hasSubscription ? (
                          <div className="unlimited-badge"><Infinity size={12} /><span>Unlimited</span></div>
                        ) : getCredits('celtic_cross') > 0 ? (
                          <div className="use-section">
                            <button className="use-btn" onClick={(e) => { e.stopPropagation(); handleUse('celtic_cross'); }}>Use</button>
                            <div className="credits-badge"><span>{getCredits('celtic_cross')}</span></div>
                          </div>
                        ) : (
                          <>
                            <span className="price-usd">{formatPrice(celticCross.usd_cents)}</span>
                            <span className="price-stars">{formatStars(celticCross.stars)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {horseshoe && (
                    <div className={`premium-feature-item ${selectedFeature === 'horseshoe' ? 'selected' : ''} ${getCredits('horseshoe') > 0 || hasSubscription ? 'purchased' : ''}`}>
                      <div className="premium-feature-icon">{horseshoe.icon}</div>
                      <div className="premium-feature-info">
                        <h4>{horseshoe.name}</h4>
                        <p>{horseshoe.description}</p>
                      </div>
                      <div className="premium-feature-price">
                        {hasSubscription ? (
                          <div className="unlimited-badge"><Infinity size={12} /><span>Unlimited</span></div>
                        ) : getCredits('horseshoe') > 0 ? (
                          <div className="use-section">
                            <button className="use-btn" onClick={(e) => { e.stopPropagation(); handleUse('horseshoe'); }}>Use</button>
                            <div className="credits-badge"><span>{getCredits('horseshoe')}</span></div>
                          </div>
                        ) : (
                          <>
                            <span className="price-usd">{formatPrice(horseshoe.usd_cents)}</span>
                            <span className="price-stars">{formatStars(horseshoe.stars)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {relationship && (
                    <div className={`premium-feature-item ${selectedFeature === 'relationship' ? 'selected' : ''} ${getCredits('relationship') > 0 || hasSubscription ? 'purchased' : ''}`}>
                      <div className="premium-feature-icon">{relationship.icon}</div>
                      <div className="premium-feature-info">
                        <h4>{relationship.name}</h4>
                        <p>{relationship.description}</p>
                      </div>
                      <div className="premium-feature-price">
                        {hasSubscription ? (
                          <div className="unlimited-badge"><Infinity size={12} /><span>Unlimited</span></div>
                        ) : getCredits('relationship') > 0 ? (
                          <div className="use-section">
                            <button className="use-btn" onClick={(e) => { e.stopPropagation(); handleUse('relationship'); }}>Use</button>
                            <div className="credits-badge"><span>{getCredits('relationship')}</span></div>
                          </div>
                        ) : (
                          <>
                            <span className="price-usd">{formatPrice(relationship.usd_cents)}</span>
                            <span className="price-stars">{formatStars(relationship.stars)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {showPurchaseBtn() && (
              <button className="premium-purchase-btn" onClick={handlePurchase} disabled={isProcessing}>
                {isProcessing ? (
                  <><div className="premium-spinner"></div><span>Processing...</span></>
                ) : (
                  <span>
                    {isSubscriptionTab ? `Subscribe for ${formatStars(stars)}` : `Unlock for ${formatStars(stars)}`}
                  </span>
                )}
              </button>
            )}

            {hasSubscription && (
              <div className="subscription-active-banner">
                <Infinity size={16} /><span>Premium Active - Unlimited Access</span>
              </div>
            )}

            <p className="premium-footer">💳 Secure payment via Telegram Stars</p>
          </motion.div>

          <AnimatePresence>
            {showSuccess && (
              <motion.div className="success-banner-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="success-banner" initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0, y: 50 }} transition={{ type: 'spring', damping: 15, stiffness: 300 }}>
                  <motion.div className="success-icon" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', damping: 10 }}>
                    <CheckCircle size={80} />
                  </motion.div>
                  <h3 className="success-title">Success!</h3>
                  <p className="success-message">
                    {isSubscriptionTab ? 'Subscription activated!<br />Unlimited readings enabled.' : 'Transaction completed successfully.<br />Premium features activated!'}
                  </p>
                  <div className="success-stars">⭐ {stars} Stars spent</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showError && (
              <motion.div className="error-banner-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="error-banner" initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0, y: 50 }} transition={{ type: 'spring', damping: 15, stiffness: 300 }}>
                  <motion.div className="error-icon" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', damping: 10 }}>
                    <XCircle size={80} />
                  </motion.div>
                  <h3 className="error-title">Failed</h3>
                  <p className="error-message">{errorMessage}</p>
                  <button className="error-close-btn" onClick={() => setShowError(false)}>OK</button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}