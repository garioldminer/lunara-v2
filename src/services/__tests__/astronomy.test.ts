// src/services/__tests__/astronomy.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCosmicData, calculateMoonData, calculateAllPlanets } from '../astronomy';

describe('Astronomy Service', () => {
  it('should calculate moon data', () => {
    const date = new Date('2025-01-01');
    const moonData = calculateMoonData(date);
    
    expect(moonData).toHaveProperty('phase');
    expect(moonData).toHaveProperty('illumination');
    expect(moonData).toHaveProperty('sign');
    expect(moonData).toHaveProperty('degree');
    
    console.log('🌙 Moon Data:', moonData);
  });

  it('should calculate all planets', () => {
    const date = new Date('2025-01-01');
    const planets = calculateAllPlanets(date);
    
    expect(planets.length).toBeGreaterThan(0);
    expect(planets[0]).toHaveProperty('name');
    expect(planets[0]).toHaveProperty('sign');
    expect(planets[0]).toHaveProperty('degree');
    
    console.log('🪐 Planets:', planets);
  });

  it('should calculate full cosmic data', () => {
    const date = new Date('2025-01-01');
    const cosmicData = calculateCosmicData(date);
    
    expect(cosmicData).toHaveProperty('date');
    expect(cosmicData).toHaveProperty('moon');
    expect(cosmicData).toHaveProperty('sun');
    expect(cosmicData).toHaveProperty('planets');
    expect(cosmicData).toHaveProperty('aspects');
    expect(cosmicData).toHaveProperty('energy_level');
    expect(cosmicData).toHaveProperty('dominant_element');
    
    console.log('✨ Full Cosmic Data:', JSON.stringify(cosmicData, null, 2));
  });
});