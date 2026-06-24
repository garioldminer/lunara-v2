import { supabase } from './supabase';

export type SubscriptionPlan = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: SubscriptionPlan;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string;
  telegram_payment_charge_id?: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// PRICING
// ============================================
export const SUBSCRIPTION_PRICING = {
  monthly: {
    stars: 499,
    usd: 999, // cents
    days: 30,
    label: 'Monthly',
    description: 'Unlimited readings + AI Insights',
    savings: null
  },
  yearly: {
    stars: 3999,
    usd: 7999, // cents
    days: 365,
    label: 'Yearly',
    description: 'Full year access - Best value!',
    savings: 'SAVE 33%'
  }
};

// ============================================
// GET USER'S ACTIVE SUBSCRIPTION
// ============================================
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('❌ Error fetching subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getActiveSubscription:', error);
    return null;
  }
}

// ============================================
// CHECK IF USER HAS ACTIVE SUBSCRIPTION
// ============================================
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getActiveSubscription(userId);
  return subscription !== null;
}

// ============================================
// CREATE NEW SUBSCRIPTION
// ============================================
export async function createSubscription(
  userId: string,
  plan: SubscriptionPlan,
  telegramChargeId?: string
): Promise<Subscription | null> {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return null;
  }

  try {
    // ჯერ გავაუქმოთ ნებისმიერი აქტიური subscription
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date() })
      .eq('user_id', userId)
      .eq('status', 'active');

    // გამოთვალე expires_at
    const pricing = SUBSCRIPTION_PRICING[plan];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pricing.days);

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        user_id: userId,
        plan_type: plan,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        telegram_payment_charge_id: telegramChargeId,
        auto_renew: true
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating subscription:', error);
      return null;
    }

    console.log('✅ Subscription created:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in createSubscription:', error);
    return null;
  }
}

// ============================================
// CANCEL SUBSCRIPTION
// ============================================
export async function cancelSubscription(userId: string): Promise<boolean> {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return false;
  }

  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        auto_renew: false,
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('❌ Error cancelling subscription:', error);
      return false;
    }

    console.log('✅ Subscription cancelled for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error in cancelSubscription:', error);
    return false;
  }
}

// ============================================
// GET ALL USER SUBSCRIPTIONS (history)
// ============================================
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching subscriptions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getUserSubscriptions:', error);
    return [];
  }
}

// ============================================
// FORMAT EXPIRATION DATE
// ============================================
export function formatExpirationDate(expiresAt: string): string {
  const date = new Date(expiresAt);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days <= 0) return 'Expired';
  if (days === 1) return '1 day left';
  if (days < 30) return `${days} days left`;
  if (days < 365) return `${Math.floor(days / 30)} months left`;
  return `${Math.floor(days / 365)} year(s) left`;
}

// ============================================
// EXPIRE OLD SUBSCRIPTIONS (Admin function)
// ============================================
export async function expireOldSubscriptions(): Promise<number> {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return 0;
  }

  try {
    const { data, error } = await supabase.rpc('expire_old_subscriptions');

    if (error) {
      console.error('❌ Error expiring subscriptions:', error);
      return 0;
    }

    console.log(`✅ Expired ${data} subscriptions`);
    return data || 0;
  } catch (error) {
    console.error('❌ Error in expireOldSubscriptions:', error);
    return 0;
  }
}