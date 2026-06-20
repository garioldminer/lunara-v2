import { createContext, useContext, useState, ReactNode } from 'react';

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
  onboarding_completed: boolean; // ✅ ახალი field
  created_at: string;
  updated_at: string;
}

// Context-ის ტიპი
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

// Context-ის შექმნა
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  return (
    <UserContext.Provider value={{ user, setUser, loading, setLoading }}>
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