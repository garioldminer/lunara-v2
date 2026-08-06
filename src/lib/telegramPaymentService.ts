import { PremiumFeatureId, incrementCredit } from './premiumService';
import { getFeatureById, getPlanByType, getStarsForFeature, getStarsForPlan } from './premiumConfig';

// ============================================
// TELEGRAM PAYMENT SERVICE
// ============================================

// ❌ ამოღებულია: hardcoded STARS_PRICING
// ✅ ეხლა ფასები მოდის premiumConfig.ts-დან (DB + cache)

// ============================================
// HELPER: Get Telegram WebApp
// ============================================
function getTg() {
  return (window as any).Telegram?.WebApp;
}

// ============================================
// GET STARS FOR FEATURE (async, DB-დან)
// ============================================
const getStarsForFeatureId = async (featureId: string): Promise<number> => {
  // Subscription plans
  if (featureId === 'subscription_monthly' || featureId === 'subscription_yearly') {
    const planType = featureId === 'subscription_monthly' ? 'monthly' : 'yearly';
    return await getStarsForPlan(planType);
  }
  // Single readings
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

  // Get feature details from premiumConfig (DB)
  let featureName = featureId;
  let featureDescription = featureId;
  
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
    console.log('📦 Creating invoice for:', { featureId, userId, stars, featureName });

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

    console.log('📡 Response status:', response.status);

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
      console.log('💳 Payment status:', status);
      
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
        // ✅ წარმატება! დავამატოთ credit ბაზაში
        console.log('💰 Payment successful! Adding credit...');
        await incrementCredit(userId, featureId, 1);
        console.log('✅ Credit added to database');
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
// HELPER: SHOW MESSAGES
// ============================================
function showError(message: string) {
  const tg = getTg();
  if (tg?.showAlert) {
    tg.showAlert(message);
  } else {
    alert(message);
  }
}

function showInfo(message: string) {
  const tg = getTg();
  if (tg?.showAlert) {
    tg.showAlert(message);
  } else {
    alert(message);
  }
}

// ============================================
// FORMAT STARS PRICE
// ============================================
export function formatStars(stars: number): string {
  return `⭐ ${stars}`;
}