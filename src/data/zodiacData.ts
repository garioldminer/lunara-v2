export interface ZodiacData {
    imageUrl: string;
    symbol: string;
    dateRange: string;
    element: string;
    planet: string;
    quality: string;
  }
  
  export const ZODIAC_SIGNS: Record<string, ZodiacData> = {
    aries: {
      imageUrl: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Aries.jpg',
      symbol: '♈',
      dateRange: 'MAR 21 - APR 19',
      element: 'Fire',
      planet: 'Mars',
      quality: 'Cardinal'
    },
    taurus: {
      imageUrl: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Taurus.jpg',
      symbol: '♉',
      dateRange: 'APR 20 - MAY 20',
      element: 'Earth',
      planet: 'Venus',
      quality: 'Fixed'
    },
    gemini: {
      imageUrl: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Gemini.jpg',
      symbol: '♊',
      dateRange: 'MAY 21 - JUN 20',
      element: 'Air',
      planet: 'Mercury',
      quality: 'Mutable'
    },
    cancer: {
      imageUrl: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Cancer1.jpg',
      symbol: '♋',
      dateRange: 'JUN 21 - JUL 22',
      element: 'Water',
      planet: 'Moon',
      quality: 'Cardinal'
    },
    leo: {
      imageUrl: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Leo1.jpg',
      symbol: '♌',
      dateRange: 'JUL 23 - AUG 22',
      element: 'Fire',
      planet: 'Sun',
      quality: 'Fixed'
    },
    virgo: {
      imageUrl: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Virgo.jpg',
      symbol: '♍',
      dateRange: 'AUG 23 - SEP 22',
      element: 'Earth',
      planet: 'Mercury',
      quality: 'Mutable'
    },
    libra: {
      imageUrl: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Libra.jpg',
      symbol: '♎',
      dateRange: 'SEP 23 - OCT 22',
      element: 'Air',
      planet: 'Venus',
      quality: 'Cardinal'
    },
    scorpio: {
      imageUrl: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Scorpio.jpg',
      symbol: '♏',
      dateRange: 'OCT 23 - NOV 21',
      element: 'Water',
      planet: 'Pluto',
      quality: 'Fixed'
    },
    sagittarius: {
      imageUrl: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Sagittarius.jpg',
      symbol: '♐',
      dateRange: 'NOV 22 - DEC 21',
      element: 'Fire',
      planet: 'Jupiter',
      quality: 'Mutable'
    },
    capricorn: {
      imageUrl: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Capricorn.jpg',
      symbol: '♑',
      dateRange: 'DEC 22 - JAN 19',
      element: 'Earth',
      planet: 'Saturn',
      quality: 'Cardinal'
    },
    aquarius: {
      imageUrl: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Aquarius.jpg',
      symbol: '♒',
      dateRange: 'JAN 20 - FEB 18',
      element: 'Air',
      planet: 'Uranus',
      quality: 'Fixed'
    },
    pisces: {
      imageUrl: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Pisces.jpg',
      symbol: '♓',
      dateRange: 'FEB 19 - MAR 20',
      element: 'Water',
      planet: 'Neptune',
      quality: 'Mutable'
    }
  };
  
  export const BACKGROUND_IMAGE = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/Horoscope/Background.jpg';