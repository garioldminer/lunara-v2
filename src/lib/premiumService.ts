import { supabase } from './supabase';

// ============================================
// PREMIUM FEATURES
// ============================================
export const PREMIUM_FEATURES = {
  subscription_monthly: {
    id: 'subscription_monthly',
    name: 'Premium Monthly',
    description: 'Unlimited readings + AI Insights',
    price: 999,
    type: 'subscription',
    duration: 'monthly',
    icon: '💎'
  },
  subscription_yearly: {
    id: 'subscription_yearly',
    name: 'Premium Yearly',
    description: 'Save 33% - Full year access',
    price: 7999,
    type: 'subscription',
    duration: 'yearly',
    icon: '💎'
  },
  celtic_cross: {
    id: 'celtic_cross',
    name: 'Celtic Cross Reading',
    description: '10-card deep analysis',
    price: 299,
    type: 'single',
    icon: '✝️'
  },
  horseshoe: {
    id: 'horseshoe',
    name: 'Horseshoe Reading',
    description: '7-card life path analysis',
    price: 199,
    type: 'single',
    icon: '🐎'
  },
  relationship: {
    id: 'relationship',
    name: 'Relationship Spread',
    description: '6-card love analysis',
    price: 399,
    type: 'single',
    icon: '❤️'
  },
  ai_weekly: {
    id: 'ai_weekly',
    name: 'AI Weekly Insight',
    description: 'Personalized weekly analysis',
    price: 499,
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
    
    if (subscription.tier === 'lifetime') {
      return true;
    }
    
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
    
    if (subscription.tier !== 'lifetime' && subscription.expires_at) {
      const expiresAt = new Date(subscription.expires_at);
      if (expiresAt <= new Date()) {
        return null;
      }
    }
    
    return subscription;
  } catch (error) {
    console.error('❌ Error fetching subscription:', error);
    return null;
  }
}

// ============================================
// GET AVAILABLE CREDITS
// ============================================
export async function getAvailableCredits(userId: string): Promise<Record<string, number>> {
  if (!supabase) return {};
  
  try {
    const { data, error } = await supabase
      .from('available_credits')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error fetching credits:', error);
      return {};
    }

    const credits: Record<string, number> = {};
    data?.forEach(row => {
      credits[row.feature_id] = row.credits;
    });

    console.log('📊 Available credits:', credits);
    return credits;
  } catch (error) {
    console.error('❌ Error fetching credits:', error);
    return {};
  }
}

// ============================================
// DECREMENT CREDIT (გამოყენებისას)
// ============================================
export async function decrementCredit(userId: string, featureId: string): Promise<boolean> {
  if (!supabase) return false;
  
  try {
    const { data: current, error: fetchError } = await supabase
      .from('available_credits')
      .select('credits')
      .eq('user_id', userId)
      .eq('feature_id', featureId)
      .single();

    if (fetchError || !current || current.credits <= 0) {
      return false;
    }

    const { error: updateError } = await supabase
      .from('available_credits')
      .update({ 
        credits: current.credits - 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('feature_id', featureId);

    if (updateError) {
      console.error('❌ Error decrementing credit:', updateError);
      return false;
    }

    console.log('✅ Credit decremented:', featureId, 'remaining:', current.credits - 1);
    return true;
  } catch (error) {
    console.error(' Error decrementing credit:', error);
    return false;
  }
}

// ============================================
// INCREMENT CREDIT (ყიდვისას)
// ============================================
export async function incrementCredit(userId: string, featureId: string, amount: number = 1): Promise<void> {
  if (!supabase) return;
  
  try {
    const { data: current, error: fetchError } = await supabase
      .from('available_credits')
      .select('credits')
      .eq('user_id', userId)
      .eq('feature_id', featureId)
      .single();

    if (fetchError || !current) {
      // არ არსებობს - შექმენი ახალი
      const { error: insertError } = await supabase
        .from('available_credits')
        .insert({
          user_id: userId,
          feature_id: featureId,
          credits: amount,
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Error inserting credit:', insertError);
      } else {
        console.log('✅ Credit created:', featureId, 'amount:', amount);
      }
    } else {
      // განაახლე არსებული
      const { error: updateError } = await supabase
        .from('available_credits')
        .update({
          credits: current.credits + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('feature_id', featureId);
      
      if (updateError) {
        console.error('❌ Error updating credit:', updateError);
      } else {
        console.log('✅ Credit incremented:', featureId, 'new total:', current.credits + amount);
      }
    }
  } catch (error) {
    console.error('❌ Error incrementing credit:', error);
  }
}

// ============================================
// ROLLBACK CREDIT (თუ reading ჩავარდა)
// ============================================
export async function rollbackCredit(userId: string, featureId: string): Promise<void> {
  await incrementCredit(userId, featureId, 1);
  console.log('🔄 Credit rolled back:', featureId);
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