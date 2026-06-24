import { supabase } from './supabase';

// Admin user ID - შეცვალე შენი ID-ით!
export const ADMIN_USER_ID = 'c9dbe3be-5c02-4034-8bfd-1d693eb02754';

// ============================================
// CHECK IF USER IS ADMIN
// ============================================
export async function isAdmin(userId: string): Promise<boolean> {
  return userId === ADMIN_USER_ID;
}

// ============================================
// GET ALL USERS WITH CREDITS
// ============================================
export async function getAllUsersWithCredits() {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return [];
  }

  try {
    // მიიღე ყველა მომხმარებელი
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return [];
    }

    // მიიღე ყველა credits
    const { data: credits, error: creditsError } = await supabase
      .from('available_credits')
      .select('*');

    if (creditsError) {
      console.error('❌ Error fetching credits:', creditsError);
      return [];
    }

    // გააერთიანე მონაცემები
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
  userId: string,
  featureId: string,
  newAmount: number
) {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return false;
  }

  try {
    const { error } = await supabase
      .from('available_credits')
      .upsert({
        user_id: userId,
        feature_id: featureId,
        credits: newAmount,
        updated_at: new Date()
      });

    if (error) {
      console.error('❌ Error updating credits:', error);
      return false;
    }

    console.log(`✅ Updated credits for ${userId}: ${featureId} = ${newAmount}`);
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
  userId: string,
  featureId: string,
  amount: number
) {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return false;
  }

  try {
    // მიიღე მიმდინარე credits
    const { data: current } = await supabase
      .from('available_credits')
      .select('credits')
      .eq('user_id', userId)
      .eq('feature_id', featureId)
      .single();

    const currentCredits = current?.credits || 0;
    const newAmount = currentCredits + amount;

    return await updateUserCredits(userId, featureId, newAmount);
  } catch (error) {
    console.error('❌ Error in addCreditsToUser:', error);
    return false;
  }
}

// ============================================
// DELETE USER CREDITS
// ============================================
export async function deleteUserCredits(
  userId: string,
  featureId: string
) {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return false;
  }

  try {
    const { error } = await supabase
      .from('available_credits')
      .delete()
      .eq('user_id', userId)
      .eq('feature_id', featureId);

    if (error) {
      console.error('❌ Error deleting credits:', error);
      return false;
    }

    console.log(`✅ Deleted credits for ${userId}: ${featureId}`);
    return true;
  } catch (error) {
    console.error('❌ Error in deleteUserCredits:', error);
    return false;
  }
}