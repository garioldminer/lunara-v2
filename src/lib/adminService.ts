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
// SUBSCRIPTION MANAGEMENT
// ============================================

export async function getAllSubscriptions(requestingUserId: string) {
  await requireAdmin(requestingUserId);

  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return [];
  }

  try {
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError);
      return [];
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, telegram_id, username');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return [];
    }

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
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', targetUserId)
      .eq('status', 'active');

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
    const { data: current, error: fetchError } = await supabase
      .from('subscriptions')
      .select('expires_at')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !current) {
      console.error('❌ Subscription not found');
      return false;
    }

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

// ============================================
// 🆕 FUNCTION MONITORING
// ============================================

export interface FunctionLog {
  id: string;
  function_name: string;
  status: 'success' | 'error' | 'timeout';
  response_time_ms: number | null;
  status_code: number | null;
  error_message: string | null;
  request_data: any;
  response_data: any;
  triggered_by: string;
  created_at: string;
}

export interface FunctionStatus {
  name: string;
  url: string;
  lastRun: FunctionLog | null;
  successRate: number;
  totalRuns: number;
  avgResponseTime: number;
}

// ყველა Edge Function-ის სია
export const EDGE_FUNCTIONS = [
  { name: 'daily-cosmic-runner', url: 'https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/daily-cosmic-runner' },
  { name: 'generate-horoscope', url: 'https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/generate-horoscope' },
  { name: 'telegram-webhook', url: 'https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/telegram-webhook' },
  { name: 'create-invoice', url: 'https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/create-invoice' },
];

// მიიღეთ ყველა function-ის სტატუსი
export async function getAllFunctionStatuses(adminId: string): Promise<FunctionStatus[]> {
  await requireAdmin(adminId);

  if (!supabase) return [];

  const statuses: FunctionStatus[] = [];

  for (const func of EDGE_FUNCTIONS) {
    // ბოლო 50 ლოგი ამ function-ისთვის
    const { data: logs } = await supabase
      .from('function_logs')
      .select('*')
      .eq('function_name', func.name)
      .order('created_at', { ascending: false })
      .limit(50);

    const lastRun = logs?.[0] || null;
    const totalRuns = logs?.length || 0;
    const successCount = logs?.filter(l => l.status === 'success').length || 0;
    const successRate = totalRuns > 0 ? (successCount / totalRuns) * 100 : 0;
    
    const responseTimes = logs?.filter(l => l.response_time_ms).map(l => l.response_time_ms!) || [];
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    statuses.push({
      name: func.name,
      url: func.url,
      lastRun,
      successRate,
      totalRuns,
      avgResponseTime: Math.round(avgResponseTime)
    });
  }

  return statuses;
}

// მიიღეთ ბოლო ლოგები
export async function getRecentLogs(adminId: string, limit: number = 50): Promise<FunctionLog[]> {
  await requireAdmin(adminId);

  if (!supabase) return [];

  const { data, error } = await supabase
    .from('function_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  return data || [];
}

// მიიღეთ კონკრეტული function-ის ლოგები
export async function getFunctionLogs(
  adminId: string, 
  functionName: string, 
  limit: number = 20
): Promise<FunctionLog[]> {
  await requireAdmin(adminId);

  if (!supabase) return [];

  const { data, error } = await supabase
    .from('function_logs')
    .select('*')
    .eq('function_name', functionName)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching function logs:', error);
    return [];
  }

  return data || [];
}

// ხელით გაუშვით function
export async function testFunction(adminId: string, functionName: string): Promise<{success: boolean; log?: FunctionLog; error?: string}> {
  await requireAdmin(adminId);

  if (!supabase) return { success: false, error: 'Supabase not initialized' };

  const func = EDGE_FUNCTIONS.find(f => f.name === functionName);
  if (!func) return { success: false, error: 'Function not found' };

  const startTime = Date.now();
  
  try {
    const response = await fetch(func.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });

    const responseTime = Date.now() - startTime;
    const responseData = await response.json().catch(() => null);

    const status = response.ok ? 'success' : 'error';
    
    // ჩაწერეთ ლოგი
    const { data: log, error: logError } = await supabase
      .from('function_logs')
      .insert({
        function_name: functionName,
        status,
        response_time_ms: responseTime,
        status_code: response.status,
        error_message: !response.ok ? responseData?.error : null,
        request_data: {},
        response_data: responseData,
        triggered_by: 'manual'
      })
      .select()
      .single();

    if (logError) console.error('Error logging:', logError);

    return { 
      success: response.ok, 
      log: log || undefined,
      error: !response.ok ? responseData?.error : undefined
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    // ჩაწერეთ error ლოგი
    await supabase.from('function_logs').insert({
      function_name: functionName,
      status: 'error',
      response_time_ms: responseTime,
      status_code: 0,
      error_message: error.message,
      request_data: {},
      response_data: null,
      triggered_by: 'manual'
    });

    return { success: false, error: error.message };
  }
}

// წაშალეთ ძველი ლოგები (30 დღეზე მეტი)
export async function cleanupOldLogs(adminId: string): Promise<boolean> {
  await requireAdmin(adminId);

  if (!supabase) return false;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { error } = await supabase
    .from('function_logs')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString());

  if (error) {
    console.error('Error cleaning up logs:', error);
    return false;
  }

  return true;
}