import { supabase } from './supabase';

// ✅ მხოლოდ შენი User ID - არავის სხვას!
export const ADMIN_USER_ID = 'c9dbe3be-5c02-4034-8bfd-1d693eb02754';

// ============================================
// CHECK IF USER IS ADMIN - მკაცრი შემოწმება
// ============================================
export async function isAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  // ✅ მკაცრი შემოწმება - მხოლოდ ზუსტი ID
  const isAdminUser = userId === ADMIN_USER_ID;
  
  if (!isAdminUser) {
    console.warn('⛔ Unauthorized admin access attempt:', userId);
  }
  
  return isAdminUser;
}

// ============================================
// ADMIN GUARD - ყველა ფუნქციის დაცვა
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
  // ✅ დაცვა - მხოლოდ admin-ს შეუძლია
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
  // ✅ დაცვა
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
  // ✅ დაცვა
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
  // ✅ დაცვა
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