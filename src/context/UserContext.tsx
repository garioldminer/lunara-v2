import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// User-ის ტიპი
export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  partner_sign: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  level: number;
  xp: number;
  gems: number;
  streak: number;
  current_plan: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// განახლებადი ველები (updateUser-ისთვის)
export type UserUpdateFields = Partial<{
  sun_sign: string;
  moon_sign: string;
  rising_sign: string;
  partner_sign: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  onboarding_completed: boolean;
  level: number;
  xp: number;
  gems: number;
  streak: number;
  current_plan: string;
}>;

// Context-ის ტიპი
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: UserUpdateFields) => Promise<void>;
}

// Context-ის შექმნა
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ updateUser ფუნქცია - Supabase-ში განახლება
  const updateUser = async (updates: UserUpdateFields) => {
    if (!user) {
      throw new Error('No user to update');
    }

    try {
      console.log('🔄 Updating user:', updates);

      // Supabase-ში განახლება
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating user:', error);
        throw error;
      }

      console.log('✅ User updated successfully:', data);

      // Local state-ის განახლება
      setUser(data);
    } catch (error) {
      console.error('❌ Update failed:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      loading, 
      setLoading,
      updateUser 
    }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook რომელიც ყველა კომპონენტი გამოიყენებს
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}