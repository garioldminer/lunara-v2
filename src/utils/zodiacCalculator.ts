/**
 * Zodiac Calculator Utility
 * გამოითვლის zodiac sign-ს birth date-დან
 */

/**
 * გამოითვლის zodiac sign-ს birth date-დან
 * @param birthDate - Date string format: "YYYY-MM-DD"
 * @returns Zodiac sign name (lowercase)
 */
export function calculateZodiacSign(birthDate: string): string {
    const date = new Date(birthDate);
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate(); // 1-31
  
    // Zodiac date ranges
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
      return 'aries';
    }
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
      return 'taurus';
    }
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
      return 'gemini';
    }
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
      return 'cancer';
    }
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
      return 'leo';
    }
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
      return 'virgo';
    }
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
      return 'libra';
    }
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
      return 'scorpio';
    }
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
      return 'sagittarius';
    }
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
      return 'capricorn';
    }
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
      return 'aquarius';
    }
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
      return 'pisces';
    }
  
    // Fallback (should never reach here)
    console.warn('⚠️ Could not calculate zodiac sign for date:', birthDate);
    return 'leo';
  }
  
  /**
   * Validate-ს გაუკეთებს birth date-ს
   * @param date - Date string format: "YYYY-MM-DD"
   * @returns boolean - true if valid, false if invalid
   */
  export function validateBirthDate(date: string): boolean {
    const parsed = new Date(date);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(parsed.getTime())) {
      console.error('❌ Invalid date format:', date);
      return false;
    }
    
    // Check if date is not in the future
    if (parsed > now) {
      console.error('❌ Birth date cannot be in the future');
      return false;
    }
    
    // Check if date is not too old (max 120 years)
    const minDate = new Date();
    minDate.setFullYear(now.getFullYear() - 120);
    if (parsed < minDate) {
      console.error('❌ Birth date is too old (max 120 years)');
      return false;
    }
    
    return true;
  }
  
  /**
   * Helper: Get zodiac sign symbol
   * @param signName - Zodiac sign name (lowercase)
   * @returns Symbol character
   */
  export function getZodiacSymbol(signName: string): string {
    const symbols: Record<string, string> = {
      'aries': '♈',
      'taurus': '♉',
      'gemini': '♊',
      'cancer': '♋',
      'leo': '♌',
      'virgo': '♍',
      'libra': '♎',
      'scorpio': '♏',
      'sagittarius': '♐',
      'capricorn': '♑',
      'aquarius': '♒',
      'pisces': '♓',
    };
    
    return symbols[signName.toLowerCase()] || '♌';
  }
  
  /**
   * Helper: Get zodiac sign label (capitalized)
   * @param signName - Zodiac sign name (lowercase)
   * @returns Capitalized label
   */
  export function getZodiacLabel(signName: string): string {
    const labels: Record<string, string> = {
      'aries': 'Aries',
      'taurus': 'Taurus',
      'gemini': 'Gemini',
      'cancer': 'Cancer',
      'leo': 'Leo',
      'virgo': 'Virgo',
      'libra': 'Libra',
      'scorpio': 'Scorpio',
      'sagittarius': 'Sagittarius',
      'capricorn': 'Capricorn',
      'aquarius': 'Aquarius',
      'pisces': 'Pisces',
    };
    
    return labels[signName.toLowerCase()] || 'Leo';
  }