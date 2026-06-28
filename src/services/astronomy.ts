// src/services/astronomy.ts
import * as Astronomy from 'astronomy-engine';

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
 * გამოთვლის პლანეტის სრულ ეკლიპტიკურ გრძედს (0-360°)
 */
function getPlanetLongitude(planetName: string, date: Date): number {
  // მზე - განსაკუთრებული შემთხვევა
  // მზის გეოცენტრული გრძედი = დედამიწის ელიოცენტრული გრძედი + 180°
  if (planetName === 'Sun') {
    const earthLon = Astronomy.EclipticLongitude('Earth', date);
    return (earthLon + 180) % 360;
  }
  
  // მთვარე და სხვა პლანეტები
  return Astronomy.EclipticLongitude(planetName, date);
}

/**
 * გამოთვლის პლანეტის პოზიციას კონკრეტულ თარიღზე
 */
export function calculatePlanetPosition(
  planetName: string, 
  date: Date
): { sign: string; degree: number; retrograde: boolean } {
  const eclipticLongitude = getPlanetLongitude(planetName, date);
  
  // ნიშნის განსაზღვრა (თითოეული 30°)
  const signIndex = Math.floor(eclipticLongitude / 30) % 12;
  const degree = eclipticLongitude % 30;
  
  // რეტროგრადულობის შემოწმება
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const lonYesterday = getPlanetLongitude(planetName, yesterday);
  
  let retrograde = false;
  if (eclipticLongitude < lonYesterday) {
    const diff = lonYesterday - eclipticLongitude;
    if (diff < 180) {
      retrograde = true;
    }
  }
  
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
  const eclipticLongitude = Astronomy.EclipticLongitude('Moon', date);
  
  const signIndex = Math.floor(eclipticLongitude / 30) % 12;
  const degree = eclipticLongitude % 30;
  
  const moonPhaseAngle = Astronomy.MoonPhase(date);
  const phaseIndex = Math.floor((moonPhaseAngle / 360) * 8) % 8;
  
  const illuminationData = Astronomy.Illumination('Moon', date);
  const illumination = illuminationData.phase_fraction * 100;
  
  return {
    phase: MOON_PHASES[phaseIndex],
    illumination: parseFloat(illumination.toFixed(2)),
    sign: ZODIAC_SIGNS[signIndex],
    degree: parseFloat(degree.toFixed(4))
  };
}

/**
 * გამოთვლის ყველა პლანეტის პოზიციას
 * აბრუნებს სრულ ეკლიპტიკურ გრძედსაც (ასპექტებისთვის)
 */
export function calculateAllPlanets(date: Date) {
  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  
  return planetNames.map(name => {
    if (name === 'Moon') {
      const moonData = calculateMoonData(date);
      const totalDegree = ZODIAC_SIGNS.indexOf(moonData.sign) * 30 + moonData.degree;
      return {
        name: 'Moon',
        sign: moonData.sign,
        degree: moonData.degree,
        totalDegree,
        retrograde: false
      };
    }
    
    const eclipticLongitude = getPlanetLongitude(name, date);
    const signIndex = Math.floor(eclipticLongitude / 30) % 12;
    const degree = eclipticLongitude % 30;
    const totalDegree = eclipticLongitude;
    
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const lonYesterday = getPlanetLongitude(name, yesterday);
    let retrograde = false;
    if (eclipticLongitude < lonYesterday) {
      const diff = lonYesterday - eclipticLongitude;
      if (diff < 180) retrograde = true;
    }
    
    return {
      name,
      sign: ZODIAC_SIGNS[signIndex],
      degree: parseFloat(degree.toFixed(4)),
      totalDegree,
      retrograde
    };
  });
}

/**
 * გამოთვლის ასპექტებს პლანეტებს შორის
 * იყენებს სრულ ეკლიპტიკურ გრძედს (totalDegree)
 */
export function calculateAspects(planets: Array<{ name: string; totalDegree: number }>) {
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
      
      // სრული ეკლიპტიკური გრძედის სხვაობა
      let angle = Math.abs(planet1.totalDegree - planet2.totalDegree);
      if (angle > 180) angle = 360 - angle;
      
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
  const moonData = calculateMoonData(date);
  const planets = calculateAllPlanets(date);
  const aspects = calculateAspects(planets);
  const sunData = planets.find(p => p.name === 'Sun');
  
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
  
  const energyLevel = Math.round(moonData.illumination);
  
  // ასპექტებიდან totalDegree-ის ამოღება (ფრონტენდისთვის არ გვჭირდება)
  const cleanAspects = aspects.map(({ planet1, planet2, aspect_type, degree, orb, influence }) => ({
    planet1, planet2, aspect_type, degree, orb, influence
  }));
  
  const cleanPlanets = planets.map(({ name, sign, degree, retrograde }) => ({
    name, sign, degree, retrograde
  }));
  
  return {
    date: date.toISOString().split('T')[0],
    moon: moonData,
    sun: {
      sign: sunData?.sign || 'Unknown',
      degree: sunData?.degree || 0
    },
    planets: cleanPlanets,
    aspects: cleanAspects,
    energy_level: energyLevel,
    dominant_element: dominantElement
  };
}