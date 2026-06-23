import { supabase } from './supabase';

// ============================================
// PREMIUM FEATURES - რა არის ფასიანი
// ============================================
export const PREMIUM_FEATURES = {
  // Subscriptions
  subscription_monthly: {
    id: 'subscription_monthly',
    name: 'Premium Monthly',
    description: 'Unlimited readings + AI Insights',
    price: 999, // $9.99 (cents)
    type: 'subscription',
    duration: 'monthly',
    icon: '💎'
  },
  subscription_yearly: {
    id: 'subscription_yearly',
    name: 'Premium Yearly',
    description: 'Save 33% - Full year access',
    price: 7999, // $79.99
    type: 'subscription',
    duration: 'yearly',
    icon: '💎'
  },
  
  // Pay-per-reading
  celtic_cross: {
    id: 'celtic_cross',
    name: 'Celtic Cross Reading',
    description: '10-card deep analysis',
    price: 299, // $2.99
    type: 'single',
    icon: '✝️'
  },
  horseshoe: {
    id: 'horseshoe',
    name: 'Horseshoe Reading',
    description: '7-card life path analysis',
    price: 199, // $1.99
    type: 'single',
    icon: '🐎'
  },
  relationship: {
    id: 'relationship',
    name: 'Relationship Spread',
    description: '6-card love analysis',
    price: 399, // $3.99
    type: 'single',
    icon: '❤️'
  },
  
  // AI Insights
  ai_weekly: {
    id: 'ai_weekly',
    name: 'AI Weekly Insight',
    description: 'Personalized weekly analysis',
    price: 499, // $4.99
    type: 'single',
    icon: '🧠'
  }
};

export type PremiumFeatureId = keyof typeof PREMIUM_FEATURES;

// ============================================
// CHECK PREMIUM STATUS
// ============================================
export async function isPremium(userId: string): Promise<boolean> {
  if (!supabase) return false;
  
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return false;
    }

    const subscription = data[0];
    
    // Lifetime subscription
    if (subscription.tier === 'lifetime') {
      return true;
    }
    
    // Check if subscription is still valid
    if (subscription.expires_at) {
      const expiresAt = new Date(subscription.expires_at);
      const now = new Date();
      return expiresAt > now;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking premium status:', error);
    return false;
  }
}

// ============================================
// GET ACTIVE SUBSCRIPTION
// ============================================
export async function getActiveSubscription(userId: string) {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    const subscription = data[0];
    
    // Check expiration
    if (subscription.tier !== 'lifetime' && subscription.expires_at) {
      const expiresAt = new Date(subscription.expires_at);
      if (expiresAt <= new Date()) {
        return null; // Expired
      }
    }
    
    return subscription;
  } catch (error) {
    console.error('❌ Error fetching subscription:', error);
    return null;
  }
}

// ============================================
// CHECK IF USER CAN ACCESS FEATURE
// ============================================
export async function canAccessFeature(userId: string, featureId: PremiumFeatureId): Promise<boolean> {
  const feature = PREMIUM_FEATURES[featureId];
  
  // Daily and 3-card readings are always free
  if (featureId === 'daily' || featureId === 'three_card') {
    return true;
  }
  
  // Check if user has premium subscription
  const premium = await isPremium(userId);
  if (premium) {
    return true; // Premium users can access everything
  }
  
  // For single purchases, check if user has purchased this specific feature
  // (This will be implemented when we add purchase history table)
  return false;
}

// ============================================
// FORMAT PRICE
// ============================================
export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

// ============================================
// GET FEATURE BY ID
// ============================================
export function getFeatureById(featureId: PremiumFeatureId) {
  return PREMIUM_FEATURES[featureId];
}