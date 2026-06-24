import { supabase } from './supabase';

// Admin user ID - მხოლოდ შენი ID
export const ADMIN_USER_ID = 'c9dbe3be-5c02-4034-8bfd-1d693eb02754';

// ============================================
// CHECK IF USER IS ADMIN
// ============================================
export async function isAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  return userId === ADMIN_USER_ID;
}

// ============================================
// ADMIN GUARD
// ============================================
async function requireAdmin(userId: string): Promise<boolean> {
  const adminCheck = await isAdmin(userId);
  if (!adminCheck) {
    throw new Error('⛔ Unauthorized: Admin access required');
  }
  return true;
}

// ============================================
// GET ALL USERS WITH CREDITS
// ============================================
export async function getAllUsersWithCredits(requestingUserId: string) {
  await requireAdmin(requestingUserId);

  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return [];
  }

  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return [];
    }

    const { data: credits, error: creditsError } = await supabase
      .from('available_credits')
      .select('*');

    if (creditsError) {
      console.error('❌ Error fetching credits:', creditsError);
      return [];
    }

    const usersWithCredits = users.map(user => {
      const userCredits = credits.filter(c => c.user_id === user.id);
      return {
        ...user,
        credits: userCredits
      };
    });

    return usersWithCredits;
  } catch (error) {
    console.error('❌ Error in getAllUsersWithCredits:', error);
    return [];
  }
}

// ============================================
// UPDATE USER CREDITS
// ============================================
export async function updateUserCredits(
  requestingUserId: string,
  targetUserId: string,
  featureId: string,
  newAmount: number
) {
  await requireAdmin(requestingUserId);

  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return false;
  }

  try {
    const { error } = await supabase
      .from('available_credits')
      .upsert({
        user_id: targetUserId,
        feature_id: featureId,
        credits: newAmount,
        updated_at: new Date()
      });

    if (error) {
      console.error('❌ Error updating credits:', error);
      return false;
    }

    console.log(`✅ [ADMIN] Updated credits for ${targetUserId}: ${featureId} = ${newAmount}`);
    return true;
  } catch (error) {
    console.error('❌ Error in updateUserCredits:', error);
    return false;
  }
}

// ============================================
// ADD CREDITS TO USER
// ============================================
export async function addCreditsToUser(
  requestingUserId: string,
  targetUserId: string,
  featureId: string,
  amount: number
) {
  await requireAdmin(requestingUserId);

  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return false;
  }

  try {
    const { data: current } = await supabase
      .from('available_credits')
      .select('credits')
      .eq('user_id', targetUserId)
      .eq('feature_id', featureId)
      .single();

    const currentCredits = current?.credits || 0;
    const newAmount = currentCredits + amount;

    return await updateUserCredits(requestingUserId, targetUserId, featureId, newAmount);
  } catch (error) {
    console.error('❌ Error in addCreditsToUser:', error);
    return false;
  }
}

// ============================================
// DELETE USER CREDITS
// ============================================
export async function deleteUserCredits(
  requestingUserId: string,
  targetUserId: string,
  featureId: string
) {
  await requireAdmin(requestingUserId);

  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return false;
  }

  try {
    const { error } = await supabase
      .from('available_credits')
      .delete()
      .eq('user_id', targetUserId)
      .eq('feature_id', featureId);

    if (error) {
      console.error('❌ Error deleting credits:', error);
      return false;
    }

    console.log(`✅ [ADMIN] Deleted credits for ${targetUserId}: ${featureId}`);
    return true;
  } catch (error) {
    console.error('❌ Error in deleteUserCredits:', error);
    return false;
  }
}

// ============================================
// SUBSCRIPTION MANAGEMENT - ახალი!
// ============================================

// ============================================
// GET ALL SUBSCRIPTIONS
// ============================================
export async function getAllSubscriptions(requestingUserId: string) {
  await requireAdmin(requestingUserId);

  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return [];
  }

  try {
    // მიიღე ყველა subscription
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError);
      return [];
    }

    // მიიღე ყველა მომხმარებელი
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, telegram_id, username');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return [];
    }

    // გააერთიანე მონაცემები
    const subscriptionsWithUsers = subscriptions.map(sub => {
      const user = users.find(u => u.id === sub.user_id);
      return {
        ...sub,
        user: user || { display_name: 'Unknown', telegram_id: 0, username: null }
      };
    });

    return subscriptionsWithUsers;
  } catch (error) {
    console.error('❌ Error in getAllSubscriptions:', error);
    return [];
  }
}

// ============================================
// CREATE SUBSCRIPTION FOR USER
// ============================================
export async function createSubscriptionForUser(
  requestingUserId: string,
  targetUserId: string,
  planType: 'monthly' | 'yearly',
  days: number = 30
) {
  await requireAdmin(requestingUserId);

  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return false;
  }

  try {
    // ჯერ გავაუქმოთ ნებისმიერი აქტიური subscription
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', targetUserId)
      .eq('status', 'active');

    // გამოთვალე expires_at
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const { error } = await supabase
      .from('subscriptions')
      .insert([{
        user_id: targetUserId,
        plan_type: planType,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('❌ Error creating subscription:', error);
      return false;
    }

    console.log(`✅ [ADMIN] Created ${planType} subscription for ${targetUserId} (${days} days)`);
    return true;
  } catch (error) {
    console.error('❌ Error in createSubscriptionForUser:', error);
    return false;
  }
}

// ============================================
// CANCEL SUBSCRIPTION FOR USER
// ============================================
export async function cancelSubscriptionForUser(
  requestingUserId: string,
  subscriptionId: string
) {
  await requireAdmin(requestingUserId);

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
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('❌ Error cancelling subscription:', error);
      return false;
    }

    console.log(`✅ [ADMIN] Cancelled subscription ${subscriptionId}`);
    return true;
  } catch (error) {
    console.error('❌ Error in cancelSubscriptionForUser:', error);
    return false;
  }
}

// ============================================
// EXTEND SUBSCRIPTION
// ============================================
export async function extendSubscription(
  requestingUserId: string,
  subscriptionId: string,
  additionalDays: number
) {
  await requireAdmin(requestingUserId);

  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return false;
  }

  try {
    // მიიღე მიმდინარე subscription
    const { data: current, error: fetchError } = await supabase
      .from('subscriptions')
      .select('expires_at')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !current) {
      console.error('❌ Subscription not found');
      return false;
    }

    // გამოთვალე ახალი expires_at
    const currentExpires = new Date(current.expires_at);
    currentExpires.setDate(currentExpires.getDate() + additionalDays);

    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        expires_at: currentExpires.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('❌ Error extending subscription:', error);
      return false;
    }

    console.log(`✅ [ADMIN] Extended subscription ${subscriptionId} by ${additionalDays} days`);
    return true;
  } catch (error) {
    console.error('❌ Error in extendSubscription:', error);
    return false;
  }
}