// src/services/astronomy.ts
import { Jupiter, Mars, Mercury, Moon, Neptune, Saturn, Sun, Uranus, Venus } from 'astronomia';
import { JulianDay } from 'astronomia/julian';

// ზოდიაქოს ნიშნები
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// მთვარის ფაზები
const MOON_PHASES = [
  'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
];

/**
 * გამოთვლის პლანეტის პოზიციას კონკრეტულ თარიღზე
 */
export function calculatePlanetPosition(
  planet: any, 
  date: Date
): { sign: string; degree: number; retrograde: boolean } {
  const jd = JulianDay.fromCalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  
  // პლანეტის გეოცენტრული პოზიცია
  const pos = planet.position(jd);
  
  // ეკლიპტიკური გრძედი (0-360°)
  const eclipticLongitude = pos.toEcliptic().lon * 180 / Math.PI;
  
  // ნიშნის განსაზღვრა (თითოეული 30°)
  const signIndex = Math.floor(eclipticLongitude / 30) % 12;
  const degree = eclipticLongitude % 30;
  
  // რეტროგრადულობის შემოწმება (მარტივი მეთოდი)
  const jdYesterday = jd - 1;
  const posYesterday = planet.position(jdYesterday);
  const lonYesterday = posYesterday.toEcliptic().lon * 180 / Math.PI;
  const retrograde = eclipticLongitude < lonYesterday;
  
  return {
    sign: ZODIAC_SIGNS[signIndex],
    degree: parseFloat(degree.toFixed(4)),
    retrograde
  };
}

/**
 * გამოთვლის მთვარის ფაზას და ნიშანს
 */
export function calculateMoonData(date: Date): {
  phase: string;
  illumination: number;
  sign: string;
  degree: number;
} {
  const jd = JulianDay.fromCalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  
  // მთვარის პოზიცია
  const moonPos = Moon.position(jd);
  const eclipticLongitude = moonPos.toEcliptic().lon * 180 / Math.PI;
  
  // ნიშანი
  const signIndex = Math.floor(eclipticLongitude / 30) % 12;
  const degree = eclipticLongitude % 30;
  
  // მთვარის ფაზა (მარტივი გამოთვლა)
  // სინოდური თვე ≈ 29.53 დღე
  const newMoonReference = JulianDay.fromCalendarDate(2000, 1, 6); // ცნობილი ახალმთვარე
  const daysSinceNewMoon = (jd - newMoonReference) % 29.53;
  const phaseIndex = Math.floor((daysSinceNewMoon / 29.53) * 8) % 8;
  
  // განათება (0-100%)
  const illumination = ((1 - Math.cos((daysSinceNewMoon / 29.53) * 2 * Math.PI)) / 2) * 100;
  
  return {
    phase: MOON_PHASES[phaseIndex],
    illumination: parseFloat(illumination.toFixed(2)),
    sign: ZODIAC_SIGNS[signIndex],
    degree: parseFloat(degree.toFixed(4))
  };
}

/**
 * გამოთვლის ყველა პლანეტის პოზიციას
 */
export function calculateAllPlanets(date: Date) {
  const planets = [
    { name: 'Sun', calculator: Sun },
    { name: 'Moon', calculator: Moon },
    { name: 'Mercury', calculator: Mercury },
    { name: 'Venus', calculator: Venus },
    { name: 'Mars', calculator: Mars },
    { name: 'Jupiter', calculator: Jupiter },
    { name: 'Saturn', calculator: Saturn },
    { name: 'Uranus', calculator: Uranus },
    { name: 'Neptune', calculator: Neptune }
  ];
  
  return planets.map(planet => ({
    name: planet.name,
    ...calculatePlanetPosition(planet.calculator, date)
  }));
}

/**
 * გამოთვლის ასპექტებს პლანეტებს შორის
 */
export function calculateAspects(planets: Array<{ name: string; degree: number }>) {
  const aspects = [];
  const aspectTypes = [
    { type: 'conjunction', angle: 0, orb: 8 },
    { type: 'sextile', angle: 60, orb: 6 },
    { type: 'square', angle: 90, orb: 7 },
    { type: 'trine', angle: 120, orb: 8 },
    { type: 'opposition', angle: 180, orb: 8 }
  ];
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      
      // კუთხე პლანეტებს შორის
      let angle = Math.abs(planet1.degree - planet2.degree);
      if (angle > 180) angle = 360 - angle;
      
      // შეამოწმე თითოეული ასპექტი
      for (const aspect of aspectTypes) {
        const orb = Math.abs(angle - aspect.angle);
        
        if (orb <= aspect.orb) {
          aspects.push({
            planet1: planet1.name,
            planet2: planet2.name,
            aspect_type: aspect.type,
            degree: parseFloat(angle.toFixed(4)),
            orb: parseFloat(orb.toFixed(2)),
            influence: aspect.type === 'trine' || aspect.type === 'sextile' ? 'harmonious' 
                     : aspect.type === 'square' || aspect.type === 'opposition' ? 'challenging' 
                     : 'neutral'
          });
        }
      }
    }
  }
  
  return aspects;
}

/**
 * მთავარი ფუნქცია - ყველაფრის გამოთვლა ერთდროულად
 */
export function calculateCosmicData(date: Date = new Date()) {
  // 1. მთვარის მონაცემები
  const moonData = calculateMoonData(date);
  
  // 2. ყველა პლანეტის პოზიცია
  const planets = calculateAllPlanets(date);
  
  // 3. ასპექტები
  const aspects = calculateAspects(planets);
  
  // 4. მზის ნიშანი
  const sunData = planets.find(p => p.name === 'Sun');
  
  // 5. დომინანტი ელემენტი (მარტივი ლოგიკა)
  const elementCounts = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const signToElement: Record<string, string> = {
    'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
    'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
    'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
    'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water'
  };
  
  planets.forEach(planet => {
    const element = signToElement[planet.sign];
    if (element) elementCounts[element as keyof typeof elementCounts]++;
  });
  
  const dominantElement = Object.entries(elementCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  // 6. ენერგიის დონე (მთვარის განათებაზე დაყრდნობით)
  const energyLevel = Math.round(moonData.illumination);
  
  return {
    date: date.toISOString().split('T')[0],
    moon: moonData,
    sun: {
      sign: sunData?.sign || 'Unknown',
      degree: sunData?.degree || 0
    },
    planets,
    aspects,
    energy_level: energyLevel,
    dominant_element: dominantElement
  };
}

// ტესტირებისთვის
if (typeof window === 'undefined') {
  const today = new Date();
  console.log('=== დღევანდელი კოსმოსური მონაცემები ===');
  console.log(JSON.stringify(calculateCosmicData(today), null, 2));
}