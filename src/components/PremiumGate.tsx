import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { isPremium, PremiumFeatureId } from '../lib/premiumService';
import PremiumPaywall from './PremiumPaywall';

interface Props {
  featureId: PremiumFeatureId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUse?: (featureId: PremiumFeatureId) => void;
}

export default function PremiumGate({ featureId, children, fallback, onUse }: Props) {
  const { user } = useUser();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (user) {
      isPremium(user.id).then(premium => {
        setHasAccess(premium);
      });
    }
  }, [user]);

  // Loading state
  if (hasAccess === null) {
    return fallback ? <>{fallback}</> : <div>Loading...</div>;
  }

  // ✅ User has access - show the actual feature
  if (hasAccess) {
    return <>{children}</>;
  }

  // ✅ User doesn't have access - show paywall with FULL handling
  return (
    <>
      <div onClick={() => setShowPaywall(true)} style={{ cursor: 'pointer' }}>
        {fallback || children}
      </div>
      
      <PremiumPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        highlightedFeature={featureId}
        
        // ✅ FIXED: proper purchase handling (no more TODO!)
        onPurchase={async (purchasedFeatureId) => {
          setShowPaywall(false);
          
          if (!user) return;
          
          if (purchasedFeatureId.startsWith('subscription')) {
            // Subscription purchased → refresh access status
            const premium = await isPremium(user.id);
            setHasAccess(premium);
            console.log('🔄 PremiumGate: subscription refreshed, hasAccess =', premium);
          } else {
            // Single reading purchased → navigate to the feature
            if (onUse) {
              onUse(purchasedFeatureId);
            }
          }
        }}
        
        // ✅ FIXED: pass onUse so "Use" button works with credits
        onUse={(usedFeatureId) => {
          setShowPaywall(false);
          if (onUse) {
            onUse(usedFeatureId);
          }
        }}
      />
    </>
  );
}