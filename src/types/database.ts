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
    created_at: string;
    updated_at: string;
  }
  
  export interface Reading {
    id: string;
    user_id: string;
    type: 'daily_card' | 'love_spread' | 'celtic_cross' | 'past_present_future';
    cards: Array<{
      id: string;
      name: string;
      position: string;
      reversed?: boolean;
    }>;
    interpretation: string | null;
    created_at: string;
  }
  
  export interface CardCollection {
    id: string;
    user_id: string;
    card_id: string;
    collected_at: string;
    times_drawn: number;
  }
  
  export interface Achievement {
    id: string;
    user_id: string;
    achievement_id: string;
    unlocked_at: string;
    progress: number;
  }