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