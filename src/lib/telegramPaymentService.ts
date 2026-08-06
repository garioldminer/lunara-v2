import { PremiumFeatureId, incrementCredit } from './premiumService';
import { getFeatureById, getPlanByType, getStarsForFeature, getStarsForPlan } from './premiumConfig';

// ============================================
// TELEGRAM PAYMENT SERVICE (Centralized - DB-based pricing)
// ============================================

function getTg() {
  return (window as any).Telegram?.WebApp;
}

// ============================================
// GET STARS FOR FEATURE (async, DB-დან)
// ============================================
const getStarsForFeatureId = async (featureId: string): Promise<number> => {
  if (featureId === 'subscription_monthly' || featureId === 'subscription_yearly') {
    const planType = featureId === 'subscription_monthly' ? 'monthly' : 'yearly';
    return await getStarsForPlan(planType);
  }
  return await getStarsForFeature(featureId);
};

// ============================================
// CREATE INVOICE URL
// ============================================
export async function createInvoiceUrl(
  featureId: PremiumFeatureId,
  userId: string
): Promise<string | null> {
  const stars = await getStarsForFeatureId(featureId);
  
  if (!stars || stars <= 0) {
    console.error('❌ Invalid stars for feature:', featureId, stars);
    return null;
  }

  // ✅ FIX: explicit string types (TS2322 fix)
  let featureName: string = featureId;
  let featureDescription: string = featureId;
  
  if (featureId === 'subscription_monthly' || featureId === 'subscription_yearly') {
    const planType = featureId === 'subscription_monthly' ? 'monthly' : 'yearly';
    const plan = await getPlanByType(planType);
    if (plan) {
      featureName = plan.label;
      featureDescription = plan.description;
    }
  } else {
    const feature = await getFeatureById(featureId);
    if (feature) {
      featureName = feature.name;
      featureDescription = feature.description;
    }
  }

  try {
    console.log('📦 Creating invoice:', { featureId, userId, stars, featureName });

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-invoice`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          feature_id: featureId,
          user_id: userId,
          stars: stars,
          title: featureName,
          description: featureDescription,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Invoice creation failed:', error);
      return null;
    }

    const data = await response.json();
    console.log('✅ Invoice created:', data);
    return data.invoice_url;
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    return null;
  }
}

// ============================================
// OPEN PAYMENT
// ============================================
export function openPayment(invoiceUrl: string): Promise<'paid' | 'cancelled' | 'failed' | 'pending'> {
  return new Promise((resolve) => {
    const tg = getTg();
    
    if (!tg?.openInvoice) {
      console.error('❌ Telegram WebApp not available');
      resolve('failed');
      return;
    }

    tg.HapticFeedback?.impactOccurred('medium');

    tg.openInvoice(invoiceUrl, (status: string) => {
      switch (status) {
        case 'paid':
          tg.HapticFeedback?.notificationOccurred('success');
          resolve('paid');
          break;
        case 'cancelled':
          tg.HapticFeedback?.notificationOccurred('warning');
          resolve('cancelled');
          break;
        case 'failed':
          tg.HapticFeedback?.notificationOccurred('error');
          resolve('failed');
          break;
        case 'pending':
          resolve('pending');
          break;
        default:
          resolve('failed');
      }
    });
  });
}

// ============================================
// COMPLETE PURCHASE FLOW
// ============================================
export async function completePurchase(
  featureId: PremiumFeatureId,
  userId: string
): Promise<'success' | 'cancelled' | 'error'> {
  try {
    const invoiceUrl = await createInvoiceUrl(featureId, userId);
    
    if (!invoiceUrl) {
      showError('Failed to create payment. Please try again.');
      return 'error';
    }

    const status = await openPayment(invoiceUrl);

    switch (status) {
      case 'paid':
        await incrementCredit(userId, featureId, 1);
        return 'success';
      case 'cancelled':
        return 'cancelled';
      case 'pending':
        showInfo('Payment is being processed. Please check back in a moment.');
        return 'error';
      case 'failed':
      default:
        showError('Payment failed. Please try again.');
        return 'error';
    }
  } catch (error) {
    console.error('❌ Purchase error:', error);
    showError('Something went wrong. Please try again.');
    return 'error';
  }
}

// ============================================
// HELPERS
// ============================================
function showError(message: string) {
  const tg = getTg();
  if (tg?.showAlert) tg.showAlert(message);
  else alert(message);
}

function showInfo(message: string) {
  const tg = getTg();
  if (tg?.showAlert) tg.showAlert(message);
  else alert(message);
}

export function formatStars(stars: number): string {
  return `⭐ ${stars}`;
}