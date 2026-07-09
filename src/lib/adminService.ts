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

// ✅ შევამოწმოთ Supabase client-ის კონფიგურაცია
export async function checkSupabaseConfig(): Promise<{
  hasClient: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  url?: string;
  canConnect: boolean;
}> {
  const result = {
    hasClient: !!supabase,
    hasUrl: false,
    hasKey: false,
    url: undefined as string | undefined,
    canConnect: false
  };

  if (!supabase) return result;

  try {
    // ✅ შევამოწმოთ კავშირი users ცხრილთან
    const { error } = await supabase.from('users').select('id').limit(1);
    result.canConnect = !error;
    result.hasUrl = true;
    result.hasKey = true;
    result.url = 'https://eutavdhcxpfhpfsyaskb.supabase.co';
    
    console.log('✅ Supabase Config:', result);
  } catch (error) {
    console.error('❌ Supabase Config Error:', error);
  }

  return result;
}

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

// ✅ ხელით გაუშვით function - გაუმჯობესებული fetch-ით
export async function testFunction(adminId: string, functionName: string): Promise<{success: boolean; log?: FunctionLog; error?: string}> {
  await requireAdmin(adminId);

  if (!supabase) return { success: false, error: 'Supabase not initialized' };

  const func = EDGE_FUNCTIONS.find(f => f.name === functionName);
  if (!func) return { success: false, error: `Function "${functionName}" not found` };

  const startTime = Date.now();
  let responseData: any = null;
  let errorMessage: string | null = null;
  let statusCode = 0;
  
  try {
    console.log(`🔍 Testing function: ${functionName}`);
    console.log(`📍 URL: ${func.url}`);
    
    // ✅ ვიღებთ Supabase-ის ავტორიზაციის token-ს
    const { data: sessionData } = await supabase.auth.getSession();
    const authToken = sessionData?.session?.access_token || 'anon';

    console.log(`🔑 Auth Token: ${authToken ? 'exists' : 'missing'}`);
    
    // ✅ ვგზავნით request სათანადო headers-ით
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const response = await fetch(func.url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({}),
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit'
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    statusCode = response.status;

    console.log(`📊 Response Status: ${statusCode}`);
    console.log(`⏱️ Response Time: ${responseTime}ms`);

    // ვცადოთ response-ის წაკითხვა
    try {
      const text = await response.text();
      console.log(`📄 Response Body (${text.length} chars):`, text.substring(0, 500));
      
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = { raw: text.substring(0, 500) };
      }
    } catch (parseError: any) {
      console.error('❌ Parse Error:', parseError);
      responseData = { parse_error: parseError.message };
    }

    // განვსაზღვროთ status
    const isSuccess = response.ok && statusCode === 200;
    
    // ამოვიღოთ error message
    if (!isSuccess) {
      if (responseData?.error) {
        errorMessage = String(responseData.error);
      } else if (responseData?.message) {
        errorMessage = String(responseData.message);
      } else if (responseData?.error_description) {
        errorMessage = String(responseData.error_description);
      } else if (responseData?.raw) {
        errorMessage = `HTTP ${statusCode}: ${String(responseData.raw).substring(0, 200)}`;
      } else {
        errorMessage = `HTTP ${statusCode} - ${response.statusText || 'Unknown error'}`;
      }
      console.error('❌ Error:', errorMessage);
    } else {
      console.log('✅ Success:', responseData);
    }

    const status = isSuccess ? 'success' : 'error';
    
    // ჩაწერეთ ლოგი
    const { data: log, error: logError } = await supabase
      .from('function_logs')
      .insert({
        function_name: functionName,
        status,
        response_time_ms: responseTime,
        status_code: statusCode,
        error_message: errorMessage,
        request_data: { 
          method: 'POST', 
          body: '{}',
          url: func.url,
          has_auth: !!authToken
        },
        response_data: responseData,
        triggered_by: 'manual'
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging function call:', logError);
    }

    if (isSuccess) {
      return { 
        success: true, 
        log: log || undefined
      };
    } else {
      return { 
        success: false, 
        log: log || undefined,
        error: errorMessage || `HTTP ${statusCode}`
      };
    }
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    console.error('❌ Fetch Error:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    
    // დეტალური error message
    let detailedError = 'Unknown error';
    
    if (error.name === 'TypeError') {
      if (error.message.includes('fetch') || error.message.includes('Load failed')) {
        detailedError = `Network Error: Failed to connect to Edge Function.

Possible causes:
1. CORS policy blocking the request
2. Function URL is unreachable from Telegram
3. HTTPS/SSL certificate issue
4. Function is not deployed

Function URL: ${func.url}

Try:
- Check if function is deployed
- Check browser console for CORS errors
- Try opening function URL directly in browser`;
      } else {
        detailedError = `TypeError: ${error.message}`;
      }
    } else if (error.name === 'AbortError') {
      detailedError = `Request Timeout: Function took more than 15 seconds to respond`;
    } else if (error.name === 'NetworkError') {
      detailedError = `Network Error: ${error.message}. Check your internet connection.`;
    } else if (error.message) {
      detailedError = `${error.name}: ${error.message}`;
    }
    
    // ჩაწერეთ error ლოგი
    try {
      await supabase.from('function_logs').insert({
        function_name: functionName,
        status: 'error',
        response_time_ms: responseTime,
        status_code: 0,
        error_message: detailedError,
        request_data: { 
          method: 'POST', 
          body: '{}',
          url: func.url
        },
        response_data: null,
        triggered_by: 'manual'
      });
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }

    return { success: false, error: detailedError };
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

// ============================================
// 👥 USER ANALYTICS
// ============================================

export interface UserAnalytics {
  id: string;
  display_name: string;
  username: string | null;
  telegram_id: number;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  gems: number;
  onboarding_completed: boolean;
  created_at: string;
  last_active_at: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  celtic_cross_credits: number;
  horseshoe_credits: number;
  relationship_credits: number;
  current_streak: number;
  longest_streak: number;
  total_readings: number;
  today_readings: number;
  last_reading_at: string | null;
  total_session_time: number; // წამებში
  last_session_duration: number | null; // წამებში
}

export interface UserAnalyticsOverview {
  total_users: number;
  active_today: number;
  premium_users: number;
  avg_streak: number;
  total_readings: number;
  total_revenue: number;
}

// მიიღეთ ყველა მომხმარებლის ანალიტიკა
export async function getAllUserAnalytics(adminId: string): Promise<UserAnalytics[]> {
  await requireAdmin(adminId);

  if (!supabase) return [];

  try {
    console.log('🔍 [UserAnalytics] Fetching all user data...');

    // 1. მიიღეთ ყველა user
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return [];
    }

    console.log(`✅ Loaded ${users.length} users`);

    // 2. მიიღეთ subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('user_id, status, plan_type, expires_at')
      .eq('status', 'active');

    console.log(`✅ Loaded ${subscriptions?.length || 0} active subscriptions`);

    // 3. მიიღეთ credits
    const { data: credits } = await supabase
      .from('available_credits')
      .select('user_id, feature_id, credits');

    console.log(`✅ Loaded ${credits?.length || 0} credits`);

    // 4. მიიღეთ streaks
    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('user_id, current_streak, longest_streak');

    console.log(`✅ Loaded ${streaks?.length || 0} streaks`);

    // 5. მიიღეთ reading stats
    const { data: readings } = await supabase
      .from('reading_history')
      .select('user_id, created_at')
      .order('created_at', { ascending: false });

    console.log(`✅ Loaded ${readings?.length || 0} readings`);

    // 6. მიიღეთ session stats
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('user_id, duration_seconds, ended_at')
      .order('ended_at', { ascending: false });

    console.log(`✅ Loaded ${sessions?.length || 0} sessions`);

    // Helper functions
    const getSubscription = (userId: string) => {
      const sub = subscriptions?.find(s => s.user_id === userId);
      return sub || null;
    };

    const getCredits = (userId: string, featureId: string) => {
      const credit = credits?.find(c => c.user_id === userId && c.feature_id === featureId);
      return credit?.credits || 0;
    };

    const getStreak = (userId: string) => {
      const streak = streaks?.find(s => s.user_id === userId);
      return streak || { current_streak: 0, longest_streak: 0 };
    };

    const getReadingStats = (userId: string) => {
      const userReadings = readings?.filter(r => r.user_id === userId) || [];
      const today = new Date().toISOString().split('T')[0];
      const todayReadings = userReadings.filter(r => r.created_at.startsWith(today)).length;
      const lastReading = userReadings.length > 0 ? userReadings[0].created_at : null;
      return {
        total: userReadings.length,
        today: todayReadings,
        last_at: lastReading
      };
    };

    const getSessionStats = (userId: string) => {
      const userSessions = sessions?.filter(s => s.user_id === userId) || [];
      const total = userSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      const last = userSessions.length > 0 ? userSessions[0].duration_seconds : null;
      return { total, last };
    };

    // ავაწყოთ analytics array
    const analytics: UserAnalytics[] = users.map(user => {
      const sub = getSubscription(user.id);
      const streak = getStreak(user.id);
      const readingStats = getReadingStats(user.id);
      const sessionStats = getSessionStats(user.id);

      return {
        ...user,
        subscription_status: sub?.status || null,
        subscription_plan: sub?.plan_type || null,
        subscription_expires_at: sub?.expires_at || null,
        celtic_cross_credits: getCredits(user.id, 'celtic_cross'),
        horseshoe_credits: getCredits(user.id, 'horseshoe'),
        relationship_credits: getCredits(user.id, 'relationship'),
        current_streak: streak.current_streak || 0,
        longest_streak: streak.longest_streak || 0,
        total_readings: readingStats.total,
        today_readings: readingStats.today,
        last_reading_at: readingStats.last_at,
        total_session_time: sessionStats.total,
        last_session_duration: sessionStats.last
      };
    });

    console.log(`✅ Successfully built analytics for ${analytics.length} users`);
    return analytics;
  } catch (error) {
    console.error('❌ Error in getAllUserAnalytics:', error);
    return [];
  }
}

// მიიღეთ overview სტატისტიკა
export async function getUserAnalyticsOverview(adminId: string): Promise<UserAnalyticsOverview> {
  await requireAdmin(adminId);

  if (!supabase) {
    return {
      total_users: 0,
      active_today: 0,
      premium_users: 0,
      avg_streak: 0,
      total_readings: 0,
      total_revenue: 0
    };
  }

  try {
    console.log('🔍 [UserAnalytics] Fetching overview stats...');
    const today = new Date().toISOString().split('T')[0];

    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Active today (last_active_at today)
    const { count: activeToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_at', `${today}T00:00:00`);

    // Premium users
    const { count: premiumUsers } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Avg streak
    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('current_streak');
    
    const avgStreak = streaks && streaks.length > 0
      ? streaks.reduce((sum, s) => sum + (s.current_streak || 0), 0) / streaks.length
      : 0;

    // Total readings
    const { count: totalReadings } = await supabase
      .from('reading_history')
      .select('*', { count: 'exact', head: true });

    // Total revenue (from subscriptions)
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('plan_type, created_at')
      .eq('status', 'active');
    
    // მარტივი revenue calculation (Monthly: $9.99, Yearly: $99.99)
    const totalRevenue = (activeSubs || []).reduce((sum, sub) => {
      return sum + (sub.plan_type === 'yearly' ? 99.99 : 9.99);
    }, 0);

    console.log('✅ Overview stats loaded:', {
      total_users: totalUsers || 0,
      active_today: activeToday || 0,
      premium_users: premiumUsers || 0,
      avg_streak: Math.round(avgStreak * 10) / 10,
      total_readings: totalReadings || 0,
      total_revenue: totalRevenue
    });

    return {
      total_users: totalUsers || 0,
      active_today: activeToday || 0,
      premium_users: premiumUsers || 0,
      avg_streak: Math.round(avgStreak * 10) / 10,
      total_readings: totalReadings || 0,
      total_revenue: totalRevenue
    };
  } catch (error) {
    console.error('❌ Error in getUserAnalyticsOverview:', error);
    return {
      total_users: 0,
      active_today: 0,
      premium_users: 0,
      avg_streak: 0,
      total_readings: 0,
      total_revenue: 0
    };
  }
}

// მიიღეთ კონკრეტული მომხმარებლის reading history
export async function getUserReadingHistory(
  adminId: string,
  userId: string,
  limit: number = 20
): Promise<any[]> {
  await requireAdmin(adminId);

  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reading_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching reading history:', error);
    return [];
  }

  return data || [];
}

// მიიღეთ კონკრეტული მომხმარებლის session history
export async function getUserSessionHistory(
  adminId: string,
  userId: string,
  limit: number = 20
): Promise<any[]> {
  await requireAdmin(adminId);

  if (!supabase) return [];

  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching session history:', error);
    return [];
  }

  return data || [];
}

// განაახლეთ user-ის last_active_at
export async function updateUserLastActive(userId: string): Promise<void> {
  if (!supabase) return;

  try {
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId);
  } catch (error) {
    console.error('Error updating last_active_at:', error);
  }
}

// ჩაწერეთ session
export async function logUserSession(
  userId: string,
  startedAt: string,
  endedAt: string,
  durationSeconds: number,
  deviceInfo?: any
): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.from('user_sessions').insert({
      user_id: userId,
      started_at: startedAt,
      ended_at: endedAt,
      duration_seconds: durationSeconds,
      device_info: deviceInfo || {}
    });
  } catch (error) {
    console.error('Error logging session:', error);
  }
}

// ჩაწერეთ reading
export async function logReading(
  userId: string,
  readingType: string,
  cardIds?: number[],
  resultSummary?: string
): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.from('reading_history').insert({
      user_id: userId,
      reading_type: readingType,
      card_ids: cardIds || [],
      result_summary: resultSummary || ''
    });
  } catch (error) {
    console.error('Error logging reading:', error);
  }
}