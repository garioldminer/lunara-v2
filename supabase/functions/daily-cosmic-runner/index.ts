import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as Astronomy from 'https://esm.sh/astronomy-engine@2.1.0';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const MOON_PHASES = [
  'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
];

type BodyName = 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Earth';

function getPlanetLongitude(planetName: BodyName, date: Date): number {
  if (planetName === 'Sun') {
    const earthLon = Astronomy.EclipticLongitude('Earth' as Astronomy.Body, date);
    return (earthLon + 180) % 360;
  }
  return Astronomy.EclipticLongitude(planetName as Astronomy.Body, date);
}

function calculateMoonData(date: Date) {
  const eclipticLongitude = Astronomy.EclipticLongitude('Moon' as Astronomy.Body, date);
  const signIndex = Math.floor(eclipticLongitude / 30) % 12;
  const degree = eclipticLongitude % 30;
  const moonPhaseAngle = Astronomy.MoonPhase(date);
  const phaseIndex = Math.floor((moonPhaseAngle / 360) * 8) % 8;
  const illuminationData = Astronomy.Illumination('Moon' as Astronomy.Body, date);
  const illumination = illuminationData.phase_fraction * 100;
  
  return {
    name: 'Moon',
    phase: MOON_PHASES[phaseIndex],
    illumination: parseFloat(illumination.toFixed(2)),
    sign: ZODIAC_SIGNS[signIndex],
    degree: parseFloat(degree.toFixed(4)),
    totalDegree: eclipticLongitude,
    retrograde: false
  };
}

function calculateAllPlanets(date: Date) {
  const planetNames: BodyName[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  
  return planetNames.map(name => {
    if (name === 'Moon') {
      return calculateMoonData(date);
    }
    
    const eclipticLongitude = getPlanetLongitude(name, date);
    const signIndex = Math.floor(eclipticLongitude / 30) % 12;
    const degree = eclipticLongitude % 30;
    
    return {
      name,
      sign: ZODIAC_SIGNS[signIndex],
      degree: parseFloat(degree.toFixed(4)),
      totalDegree: eclipticLongitude,
      retrograde: false
    };
  });
}

function calculateAspects(planets: Array<{ name: string; totalDegree: number }>) {
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

serve(async (req) => {
  const startTime = Date.now(); // ✅ დროის დაფიქსირება
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    console.log(`Starting daily cosmic calculation for ${dateStr}`);

    const moonData = calculateMoonData(today);
    const planets = calculateAllPlanets(today);
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

    // ✅ 1. Upsert cosmic_daily_data
    const { error: cosmicError } = await supabase
      .from('cosmic_daily_data')
      .upsert({
        date: dateStr,
        moon_phase: moonData.phase,
        moon_illumination: moonData.illumination,
        moon_sign: moonData.sign,
        moon_degree: moonData.degree,
        sun_sign: sunData?.sign || 'Unknown',
        sun_degree: sunData?.degree || 0,
        energy_level: Math.round(moonData.illumination),
        dominant_element: dominantElement,
        daily_theme: 'Daily Cosmic Update',
        key_advice: 'Trust the cosmic flow today.',
        best_ritual: 'Meditation & Reflection',
        lucky_color: 'Blue',
        lucky_number: 7
      }, { onConflict: 'date' });

    if (cosmicError) throw cosmicError;

    // ✅ 2. Upsert planet_positions
    const planetRecords = planets.map(p => ({
      date: dateStr,
      planet_name: p.name,
      sign: p.sign,
      degree: p.degree,
      retrograde: p.retrograde || false
    }));

    const { error: planetsError } = await supabase
      .from('planet_positions')
      .upsert(planetRecords, { onConflict: 'date,planet_name' });

    if (planetsError) throw planetsError;

    // ✅ 3. DELETE + INSERT aspects
    const aspectRecords = aspects.map(a => ({
      date: dateStr,
      planet1: a.planet1,
      planet2: a.planet2,
      aspect_type: a.aspect_type,
      degree: a.degree,
      orb: a.orb,
      influence: a.influence
    }));

    console.log(`Deleting old aspects for ${dateStr}...`);
    const { error: deleteError, count } = await supabase
      .from('aspects')
      .delete()
      .eq('date', dateStr);

    if (deleteError) {
      console.error('Error deleting old aspects:', deleteError);
      throw deleteError;
    }
    console.log(`Deleted ${count} old aspects`);

    if (aspectRecords.length > 0) {
      console.log(`Inserting ${aspectRecords.length} new aspects...`);
      const { error: aspectsError } = await supabase
        .from('aspects')
        .insert(aspectRecords);

      if (aspectsError) {
        console.error('Error inserting aspects:', aspectsError);
        throw aspectsError;
      }
      console.log(`Successfully inserted ${aspectRecords.length} aspects`);
    }

    console.log(`✅ Successfully saved cosmic data for ${dateStr}`);
    console.log(`🌙 Moon: ${moonData.phase} in ${moonData.sign} (${moonData.illumination}%)`);
    console.log(`☀️ Sun: ${sunData?.sign} ${sunData?.degree}°`);
    console.log(`🪐 Planets: ${planets.length}`);
    console.log(`🔗 Aspects: ${aspects.length}`);

    // ✅ 4. ჩაწერეთ ლოგი function_logs ცხრილში
    try {
      await supabase.from('function_logs').insert({
        function_name: 'daily-cosmic-runner',
        status: 'success',
        response_time_ms: Date.now() - startTime,
        status_code: 200,
        error_message: null,
        request_data: { method: req.method, triggered_by: 'cron_or_manual' },
        response_data: { 
          date: dateStr,
          moon: moonData.phase,
          sun: sunData?.sign,
          planets_count: planets.length,
          aspects_count: aspects.length
        },
        triggered_by: 'cron'
      });
    } catch (logErr) {
      console.error('Failed to log success:', logErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        date: dateStr,
        moon: moonData,
        sun: sunData,
        planets_count: planets.length,
        aspects_count: aspects.length
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    
    // ✅ ჩაწერეთ error ლოგი
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      await supabase.from('function_logs').insert({
        function_name: 'daily-cosmic-runner',
        status: 'error',
        response_time_ms: Date.now() - startTime,
        status_code: 500,
        error_message: error.message,
        request_data: { method: req.method },
        response_data: null,
        triggered_by: 'cron'
      });
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});