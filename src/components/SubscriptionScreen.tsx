import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// ✅ გასწორებულია: Infinity იმპორტირებულია როგორც InfinityIcon, რათა არ შეერიოს JS-ის გლობალურ Infinity რიცხვს
import { ArrowLeft, Crown, Calendar, XCircle, CheckCircle, Infinity as InfinityIcon, AlertTriangle, Gem } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getActiveSubscription, getUserSubscriptions, cancelSubscription, formatExpirationDate, Subscription } from '../lib/subscriptionService';
import './SubscriptionScreen.css';

// The 12 zodiac glyphs used to build the rotating celestial ring — the same
// signature element used in the Leaderboard and Streak modals, so premium
// status reads as part of LUNARA's astrology world rather than generic UI.
const ZODIAC_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

function CelestialRing({ size = 88, children }: { size?: number; children: React.ReactNode }) {
  return (
    <div className="celestial-ring-wrap" style={{ width: size, height: size }}>
      <motion.div
        animate={{ rotate: 360 }}
        // ✅ აქ Infinity ახლა სწორად მიუთითებს JavaScript-ის გლობალურ რიცხვზე (უსასრულობა)
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        className="celestial-ring"
      >
        {ZODIAC_GLYPHS.map((glyph, i) => {
          const angle = (360 / ZODIAC_GLYPHS.length) * i;
          return (
            <span key={glyph} className="celestial-glyph" style={{ transform: `rotate(${angle}deg)` }}>
              {glyph}
            </span>
          );
        })}
      </motion.div>
      <div className="celestial-center">{children}</div>
    </div>
  );
}

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function SubscriptionScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;

    setLoading(true);
    const [active, history] = await Promise.all([
      getActiveSubscription(user.id),
      getUserSubscriptions(user.id)
    ]);

    setActiveSubscription(active);
    setSubscriptionHistory(history);
    setLoading(false);
  };

  const handleCancelSubscription = async () => {
    if (!user) return;

    setCancelling(true);
    const success = await cancelSubscription(user.id);

    if (success) {
      setCancelSuccess(true);
      setShowCancelConfirm(false);

      // Refresh data
      await loadSubscriptionData();

      setTimeout(() => {
        setCancelSuccess(false);
      }, 3000);
    }

    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="subscription-screen">
        <div className="subscription-loading">
          <span className="loading-moon">☾</span>
          <p>Loading subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-screen">
      {/* Header */}
      <div className="subscription-header">
        <button className="subscription-back-btn" onClick={() => onNavigate?.('home')}>
          <ArrowLeft size={20} />
        </button>
        <div className="subscription-header-center">
          <Crown size={24} />
          <h1>Subscription</h1>
        </div>
        <div className="subscription-header-spacer" />
      </div>

      {/* Cancel Success Banner */}
      {cancelSuccess && (
        <motion.div
          className="cancel-success-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <CheckCircle size={20} />
          <span>Subscription cancelled successfully</span>
        </motion.div>
      )}

      {/* Active Subscription */}
      {activeSubscription ? (
        <motion.div
          className="active-subscription-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="active-badge">
            {/* ✅ გასწორებულია: InfinityIcon-ის გამოყენება */}
            <InfinityIcon size={16} />
            <span>ACTIVE</span>
          </div>

          <CelestialRing>
            <Gem size={30} style={{ color: '#ffe9a8' }} />
          </CelestialRing>

          <h2 className="subscription-plan-name">
            Premium {activeSubscription.plan_type === 'monthly' ? 'Monthly' : 'Yearly'}
          </h2>

          <p className="subscription-plan-description">
            Unlimited readings + AI Insights
          </p>

          <div className="subscription-details">
            <div className="detail-row">
              <div className="detail-icon">
                <Calendar size={16} />
              </div>
              <div className="detail-info">
                <span className="detail-label">Started</span>
                <span className="detail-value">
                  {new Date(activeSubscription.started_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon">
                <Calendar size={16} />
              </div>
              <div className="detail-info">
                <span className="detail-label">Expires</span>
                <span className="detail-value">
                  {new Date(activeSubscription.expires_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <div className="detail-row highlight">
              <div className="detail-icon">
                <ClockIcon />
              </div>
              <div className="detail-info">
                <span className="detail-label">Time Remaining</span>
                <span className="detail-value time-remaining">
                  {formatExpirationDate(activeSubscription.expires_at)}
                </span>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-icon">
                <CheckCircle size={16} />
              </div>
              <div className="detail-info">
                <span className="detail-label">Auto-Renew</span>
                <span className="detail-value">
                  {activeSubscription.auto_renew ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          <div className="subscription-features">
            <h3>What's Included:</h3>
            <ul>
              <li>✓ Unlimited Celtic Cross readings</li>
              <li>✓ Unlimited Horseshoe readings</li>
              <li>✓ Unlimited Relationship readings</li>
              <li>✓ AI-powered insights</li>
              <li>✓ Priority support</li>
            </ul>
          </div>

          <button
            className="cancel-subscription-btn"
            onClick={() => setShowCancelConfirm(true)}
          >
            <XCircle size={16} />
            <span>Cancel Subscription</span>
          </button>
        </motion.div>
      ) : (
        <motion.div
          className="no-subscription-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CelestialRing size={80}>
            <Crown size={28} style={{ color: '#ffe9a8' }} />
          </CelestialRing>
          <h2>No Active Subscription</h2>
          <p>Unlock unlimited readings and premium features</p>

          <button
            className="subscribe-btn"
            onClick={() => onNavigate?.('pricing')}
          >
            <Crown size={16} />
            <span>Subscribe Now</span>
          </button>
        </motion.div>
      )}

      {/* Subscription History */}
      {subscriptionHistory.length > 0 && (
        <motion.div
          className="subscription-history"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3>Subscription History</h3>
          <div className="history-list">
            {subscriptionHistory.map((sub) => (
              <div key={sub.id} className={`history-item ${sub.status}`}>
                <div className="history-icon">
                  {sub.status === 'active' && <CheckCircle size={16} />}
                  {sub.status === 'cancelled' && <XCircle size={16} />}
                  {sub.status === 'expired' && <AlertTriangle size={16} />}
                </div>
                <div className="history-info">
                  <span className="history-plan">
                    Premium {sub.plan_type === 'monthly' ? 'Monthly' : 'Yearly'}
                  </span>
                  <span className="history-dates">
                    {new Date(sub.started_at).toLocaleDateString()} - {new Date(sub.expires_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={`history-status ${sub.status}`}>
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div
          className="cancel-modal-overlay"
          onClick={() => !cancelling && setShowCancelConfirm(false)}
        >
          <motion.div
            className="cancel-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cancel-modal-icon">
              <AlertTriangle size={48} />
            </div>
            <h3>Cancel Subscription?</h3>
            <p>
              You will lose access to premium features at the end of your current billing period.
            </p>
            <div className="cancel-modal-buttons">
              <button
                className="cancel-modal-btn keep"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
              >
                Keep Subscription
              </button>
              <button
                className="cancel-modal-btn confirm"
                onClick={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Helper component for clock icon
function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );
}