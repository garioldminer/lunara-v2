import { PREMIUM_FEATURES, PremiumFeatureId } from './premiumService';

// ============================================
// TELEGRAM PAYMENT SERVICE
// ============================================

// ============================================
// STARS PRICING - Telegram Stars-ში
// ============================================
export const STARS_PRICING: Record<PremiumFeatureId, number> = {
  subscription_monthly: 499,
  subscription_yearly: 3999,
  celtic_cross: 150,
  horseshoe: 100,
  relationship: 200,
  ai_weekly: 250,
};

// ============================================
// HELPER: Get Telegram WebApp
// ============================================
function getTg() {
  return (window as any).Telegram?.WebApp;
}

// ============================================
// CREATE INVOICE URL
// ============================================
export async function createInvoiceUrl(
  featureId: PremiumFeatureId,
  userId: string
): Promise<string | null> {
  const stars = STARS_PRICING[featureId];
  const feature = PREMIUM_FEATURES[featureId];
  
  if (!stars || !feature) {
    console.error('❌ Invalid feature ID:', featureId);
    return null;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-invoice`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature_id: featureId,
          user_id: userId,
          stars: stars,
          title: feature.name,
          description: feature.description,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Invoice creation failed:', error);
      return null;
    }

    const data = await response.json();
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
        showSuccess('🎉 Payment successful! Premium activated.');
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
function showSuccess(message: string) {
  const tg = getTg();
  if (tg?.showPopup) {
    tg.showPopup({
      title: '✨ Success',
      message,
      buttons: [{ type: 'ok' }],
    });
  } else {
    alert(message);
  }
}

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