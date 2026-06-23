import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { isPremium, PremiumFeatureId } from '../lib/premiumService';
import PremiumPaywall from './PremiumPaywall';

interface Props {
  featureId: PremiumFeatureId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PremiumGate({ featureId, children, fallback }: Props) {
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

  // User has access
  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show paywall
  return (
    <>
      {fallback ? (
        <div onClick={() => setShowPaywall(true)} style={{ cursor: 'pointer' }}>
          {fallback}
        </div>
      ) : (
        <div onClick={() => setShowPaywall(true)} style={{ cursor: 'pointer' }}>
          {children}
        </div>
      )}
      
      <PremiumPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        highlightedFeature={featureId}
        onPurchase={(featureId) => {
          // TODO: Handle purchase
          console.log('Purchase:', featureId);
          setShowPaywall(false);
        }}
      />
    </>
  );
}