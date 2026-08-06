import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================
// ✅ დავტოვეთ PremiumFeatureId - backward compatibility-ისთვის
// (telegramPaymentService და PremiumPaywall ჯერ კიდევ იყენებენ)
export type PremiumFeatureId = 
  | 'subscription_monthly' 
  | 'subscription_yearly'
  | 'celtic_cross' 
  | 'horseshoe' 
  | 'relationship' 
  | 'ai_weekly';

// ❌ ამოღებულია: PREMIUM_FEATURES hardcoded ობიექტი
// ✅ ეხლა ყველა feature/plan info მოდის premiumConfig.ts-დან (DB)

// ============================================
// CHECK PREMIUM STATUS
// ============================================
export async function isPremium(userId: string): Promise<boolean> {
  if (!supabase) return false;
  if (!userId) return false;
  
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error checking premium status:', error);
      return false;
    }

    return !!(data && data.length > 0);
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
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('❌ Error fetching subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching subscription:', error);
    return null;
  }
}

// ============================================
// CREDITS MANAGEMENT
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

    return credits;
  } catch (error) {
    console.error('❌ Error fetching credits:', error);
    return {};
  }
}

export async function decrementCredit(userId: string, featureId: string): Promise<boolean> {
  if (!supabase) return false;
  
  try {
    const { data: current, error: fetchError } = await supabase
      .from('available_credits')
      .select('credits')
      .eq('user_id', userId)
      .eq('feature_id', featureId)
      .single();

    if (fetchError || !current || current.credits <= 0) return false;

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

    return true;
  } catch (error) {
    console.error('❌ Error decrementing credit:', error);
    return false;
  }
}

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
      const { error: insertError } = await supabase
        .from('available_credits')
        .insert({
          user_id: userId,
          feature_id: featureId,
          credits: amount,
          updated_at: new Date().toISOString()
        });
      
      if (insertError) console.error('❌ Error inserting credit:', insertError);
    } else {
      const { error: updateError } = await supabase
        .from('available_credits')
        .update({
          credits: current.credits + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('feature_id', featureId);
      
      if (updateError) console.error('❌ Error updating credit:', updateError);
    }
  } catch (error) {
    console.error('❌ Error incrementing credit:', error);
  }
}

export async function rollbackCredit(userId: string, featureId: string): Promise<void> {
  await incrementCredit(userId, featureId, 1);
}

// ============================================
// FORMAT PRICE
// ============================================
export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}