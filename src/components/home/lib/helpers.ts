// ==========================================
// ✨ HomeScreen Helper Functions
// ==========================================

const ZODIAC_SYMBOLS: Record<string, string> = {
    aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
    leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
    sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓'
  };
  
  export const getZodiacSymbol = (signName: string): string => {
    if (!signName) return '✧';
    return ZODIAC_SYMBOLS[signName.toLowerCase()] || '✧';
  };
  
  export const hexToRgbVars = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r} ${g} ${b}`;
  };
  
  export const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  export const getXPToNextLevel = (level: number): number => {
    if (level === 1) return 100;
    if (level === 2) return 250;
    if (level === 3) return 500;
    if (level === 4) return 1000;
    if (level === 5) return 2000;
    return Math.floor(2000 * Math.pow(1.8, level - 5));
  };
  
  export const getLevelFromTotalXP = (totalXP: number) => {
    let level = 1;
    let xpRequiredForNext = getXPToNextLevel(level);
    let currentLevelXP = totalXP;
    
    while (currentLevelXP >= xpRequiredForNext) {
      currentLevelXP -= xpRequiredForNext;
      level++;
      xpRequiredForNext = getXPToNextLevel(level);
    }
    
    return { level, currentLevelXP, xpToNext: xpRequiredForNext };
  };

  // ==========================================
  // 🔥 STREAK TIER SYSTEM
  // ==========================================
  export interface StreakTier {
    min: number;
    max: number;
    icon: string;
    name: string;
    color: string;
    glowColor: string;
  }

  export const STREAK_TIERS: StreakTier[] = [
    { min: 0, max: 2, icon: '🔥', name: 'Newcomer', color: '#94a3b8', glowColor: 'rgba(148, 163, 184, 0.5)' },
    { min: 3, max: 6, icon: '🌱', name: 'Seedling', color: '#10b981', glowColor: 'rgba(16, 185, 129, 0.5)' },
    { min: 7, max: 13, icon: '🔥', name: 'Flame', color: '#f97316', glowColor: 'rgba(249, 115, 22, 0.5)' },
    { min: 14, max: 29, icon: '⭐', name: 'Star', color: '#fbbf24', glowColor: 'rgba(251, 191, 36, 0.5)' },
    { min: 30, max: 59, icon: '👑', name: 'Crown', color: '#fbbf24', glowColor: 'rgba(251, 191, 36, 0.6)' },
    { min: 60, max: 99, icon: '🏆', name: 'Trophy', color: '#fbbf24', glowColor: 'rgba(251, 191, 36, 0.7)' },
    { min: 100, max: Infinity, icon: '💎', name: 'Diamond', color: '#a78bfa', glowColor: 'rgba(167, 139, 250, 0.7)' }
  ];

  export function getStreakTier(streak: number): StreakTier {
    return STREAK_TIERS.find(t => streak >= t.min && streak <= t.max) || STREAK_TIERS[0];
  }

  export function getStreakTierIcon(streak: number): string {
    return getStreakTier(streak).icon;
  }

  export function getStreakTierName(streak: number): string {
    return getStreakTier(streak).name;
  }

  export function getStreakTierColor(streak: number): string {
    return getStreakTier(streak).color;
  }