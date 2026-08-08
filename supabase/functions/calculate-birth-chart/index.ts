import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as Astronomy from 'https://esm.sh/astronomy-engine@2.1.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// ✅ Major cities with coordinates and timezone offsets
const CITY_DATABASE: Record<string, { lat: number; lon: number; tz: number }> = {
  'tbilisi': { lat: 41.7151, lon: 44.8271, tz: 4 },
  'batumi': { lat: 41.6168, lon: 41.6367, tz: 4 },
  'kutaisi': { lat: 42.2679, lon: 42.7180, tz: 4 },
  'new york': { lat: 40.7128, lon: -74.0060, tz: -5 },
  'london': { lat: 51.5074, lon: -0.1278, tz: 0 },
  'paris': { lat: 48.8566, lon: 2.3522, tz: 1 },
  'moscow': { lat: 55.7558, lon: 37.6173, tz: 3 },
  'istanbul': { lat: 41.0082, lon: 28.9784, tz: 3 },
  'dubai': { lat: 25.2048, lon: 55.2708, tz: 4 },
  'tokyo': { lat: 35.6762, lon: 139.6503, tz: 9 },
  'los angeles': { lat: 34.0522, lon: -118.2437, tz: -8 },
  'chicago': { lat: 41.8781, lon: -87.6298, tz: -6 },
  'berlin': { lat: 52.5200, lon: 13.4050, tz: 1 },
  'rome': { lat: 41.9028, lon: 12.4964, tz: 1 },
  'madrid': { lat: 40.4168, lon: -3.7038, tz: 1 },
  'beijing': { lat: 39.9042, lon: 116.4074, tz: 8 },
  'mumbai': { lat: 19.0760, lon: 72.8777, tz: 5.5 },
  'sydney': { lat: -33.8688, lon: 151.2093, tz: 10 },
  'toronto': { lat: 43.6532, lon: -79.3832, tz: -5 },
  'miami': { lat: 25.7617, lon: -80.1918, tz: -5 },
};

function findCity(cityName: string): { lat: number; lon: number; tz: number } | null {
  const normalized = cityName.toLowerCase().trim();
  
  // Exact match
  if (CITY_DATABASE[normalized]) return CITY_DATABASE[normalized];
  
  // Partial match
  for (const [name, data] of Object.entries(CITY_DATABASE)) {
    if (name.includes(normalized) || normalized.includes(name)) {
      return data;
    }
  }
  
  return null;
}

function getSignFromLongitude(longitude: number): string {
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30) % 12;
  return ZODIAC_SIGNS[signIndex];
}

function calculateMoonSign(date: Date): string {
  const eclipticLongitude = Astronomy.EclipticLongitude('Moon' as Astronomy.Body, date);
  return getSignFromLongitude(eclipticLongitude);
}

function calculateSunSign(date: Date): string {
  const earthLon = Astronomy.EclipticLongitude('Earth' as Astronomy.Body, date);
  const sunLon = (earthLon + 180) % 360;
  return getSignFromLongitude(sunLon);
}

function calculateRisingSign(date: Date, lat: number, lon: number): string {
  // Simplified rising sign calculation
  // Real calculation requires Local Sidereal Time (LST)
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getUTCFullYear(), 0, 0).getTime()) / 86400000);
  
  // Approximate LST (Local Sidereal Time)
  const lst = (100.46 + 0.985647 * dayOfYear + lon + 15 * hours) % 360;
  
  // Ascendant approximation (simplified)
  const ram = lst * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const obliquity = 23.4393 * Math.PI / 180;
  
  const ascendant = Math.atan2(
    Math.cos(ram),
    -(Math.sin(ram) * Math.cos(obliquity) + Math.tan(latRad) * Math.sin(obliquity))
  );
  
  let ascendantDeg = ascendant * 180 / Math.PI;
  if (ascendantDeg < 0) ascendantDeg += 360;
  
  return getSignFromLongitude(ascendantDeg);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { birth_date, birth_time, birth_place } = await req.json();

    if (!birth_date || !birth_time || !birth_place) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'birth_date, birth_time, and birth_place are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse birth date and time
    const [year, month, day] = birth_date.split('-').map(Number);
    const [hours, minutes] = birth_time.split(':').map(Number);

    // Find city coordinates
    const city = findCity(birth_place);
    if (!city) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `City "${birth_place}" not found. Try: Tbilisi, Batumi, New York, London, etc.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create exact birth moment in UTC
    const birthDateLocal = new Date(year, month - 1, day, hours, minutes);
    const birthDateUTC = new Date(birthDateLocal.getTime() - city.tz * 3600000);

    console.log(`🔮 Calculating birth chart for: ${birth_date} ${birth_time} in ${birth_place}`);
    console.log(`   Local: ${birthDateLocal.toISOString()}`);
    console.log(`   UTC: ${birthDateUTC.toISOString()}`);
    console.log(`   Coords: ${city.lat}°N, ${city.lon}°E`);

    // Calculate three big signs
    const sunSign = calculateSunSign(birthDateUTC);
    const moonSign = calculateMoonSign(birthDateUTC);
    const risingSign = calculateRisingSign(birthDateUTC, city.lat, city.lon);

    console.log(`   ☀️ Sun: ${sunSign}`);
    console.log(`   🌙 Moon: ${moonSign}`);
    console.log(`   🌅 Rising: ${risingSign}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sun_sign: sunSign.toLowerCase(),
          moon_sign: moonSign.toLowerCase(),
          rising_sign: risingSign.toLowerCase(),
          birth_location: {
            city: birth_place,
            latitude: city.lat,
            longitude: city.lon,
            timezone: city.tz
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Birth Chart Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});