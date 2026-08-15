export type TabType = 'today' | 'tomorrow' | 'weekly' | 'monthly';

export interface Toast { message: string; type: 'success' | 'error' | 'info'; }

export interface DebugLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warn' | 'perf';
  category: string;
  message: string;
  data?: any;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  phases: { name: string; startTime: number; endTime?: number; duration?: number }[];
}

export interface SignValidation {
  userSign: string;
  foundWrongSigns: string[];
  replacementsMade: number;
  originalSigns: { [key: string]: number };
}

export const ADMIN_USER_ID = 'c9dbe3be-5c02-4034-8bfd-1d693eb02754';

export const ERROR_MESSAGES = [
  "The stars are clouded today. Please try again.",
  "Cosmic connection interrupted. Mercury might be in retrograde.",
  "The universe needs a moment. Try again in a few minutes.",
  "The celestial wires are crossed. Please retry."
];

export const TAB_LABELS: Record<TabType, string> = {
  today: "TODAY'S HOROSCOPE",
  tomorrow: "TOMORROW'S HOROSCOPE",
  weekly: "WEEKLY HOROSCOPE",
  monthly: "MONTHLY HOROSCOPE"
};

export const TAB_PREDICTIONS_TITLE: Record<TabType, string> = {
  today: "TODAY'S PREDICTIONS",
  tomorrow: "TOMORROW'S PREDICTIONS",
  weekly: "THIS WEEK'S PREDICTIONS",
  monthly: "THIS MONTH'S PREDICTIONS"
};

export const TAB_HERO_FALLBACK: Record<TabType, string> = {
  today: "Cosmic winds fuel your mind",
  tomorrow: "Tomorrow holds new possibilities",
  weekly: "A week of transformation awaits",
  monthly: "The month brings cosmic shifts"
};

export const PREDICTION_SUBTITLES = {
  general: ["Insight", "Guidance", "Wisdom", "Vision", "Clarity"],
  love: ["Connections", "Romance", "Passion", "Harmony", "Devotion"],
  career: ["Path", "Growth", "Success", "Ambition", "Progress"],
  health: ["Wellness", "Vitality", "Balance", "Strength", "Healing"],
  finance: ["Prosperity", "Abundance", "Wealth", "Fortune", "Gains"]
};

export const ALL_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo',
  'virgo', 'libra', 'scorpio', 'sagittarius',
  'capricorn', 'aquarius', 'pisces'
];

export const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const safeExtractTransit = (transit: any) => ({
  planet1: safeString(transit?.planet1),
  aspect_type: safeString(transit?.aspect_type),
  planet2: safeString(transit?.planet2),
  influence: safeString(transit?.influence || 'neutral')
});

export const getEnergyEmojis = (level: string | undefined, emoji: string): string => {
  const normalized = level?.toLowerCase() || 'medium';
  if (normalized.includes('very')) return `${emoji}${emoji}${emoji}${emoji}`;
  if (normalized.includes('high')) return `${emoji}${emoji}${emoji}`;
  if (normalized.includes('medium')) return `${emoji}${emoji}`;
  if (normalized.includes('low')) return `${emoji}`;
  return `${emoji}${emoji}`;
};

export const getPredictionSubtitle = (category: keyof typeof PREDICTION_SUBTITLES, date?: string): string => {
  const subtitles = PREDICTION_SUBTITLES[category];
  if (!date) return subtitles[0];
  const dayIndex = new Date(date).getDate() % subtitles.length;
  return subtitles[dayIndex];
};

export const getMoonDescription = (moonPhase?: string): string => {
  if (!moonPhase) return "The moon guides your path through the cosmic landscape.";
  const phaseDescriptions: Record<string, string> = {
    'New Moon': "A time for new beginnings. Set your intentions and plant seeds for the future.",
    'Waxing Crescent': "Building momentum. Take action on your dreams and watch them grow.",
    'First Quarter': "Time for decisions. Push forward with determination and courage.",
    'Waxing Gibbous': "Refining your path. Make adjustments and stay focused on your goals.",
    'Full Moon': "Peak energy! Celebrate achievements and release what no longer serves you.",
    'Waning Gibbous': "Sharing wisdom. Express gratitude and share your light with others.",
    'Last Quarter': "Letting go. Release old patterns and make space for the new.",
    'Waning Crescent': "Rest and reflect. Prepare for the next cycle with inner peace."
  };
  return phaseDescriptions[moonPhase] || "The moon guides your path through the cosmic landscape.";
};

export const fixHoroscopeText = (
  text: string | undefined,
  userSign: string,
  onDetect?: (wrongSign: string) => void
): string => {
  if (!text || !userSign) return text || '';
  const userSignCapitalized = userSign.charAt(0).toUpperCase() + userSign.slice(1).toLowerCase();
  let result = text;

  ALL_SIGNS.forEach(sign => {
    if (sign === userSign) return;
    const signCap = sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();
    const matches = result.match(new RegExp(`\\b${signCap}\\b`, 'gi'));
    if (matches && matches.length > 0 && onDetect) onDetect(sign);
    result = result.replace(new RegExp(`\\bAs\\s+an?\\s+${signCap}\\b`, 'gi'), `As a ${userSignCapitalized}`);
    result = result.replace(new RegExp(`\\b(Dear|Hello)\\s+${signCap}\\b`, 'gi'), `$1 ${userSignCapitalized}`);
    result = result.replace(new RegExp(`\\b${signCap}\\b`, 'g'), userSignCapitalized);
  });
  return result;
};