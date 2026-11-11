import { describe, it, expect } from 'vitest';
import { BUILDINGS, STARTING_CASH, BUILDING_IDS } from './buildings';
import { SCHOOLS, SCHOOL_IDS, PLOTS_PER_SCHOOL, MAX_PLAYERS } from './schools';

describe('economy configuration', () => {
  describe('buildings', () => {
    it('has all required buildings', () => {
      const required = [
        'admissions', 'classroom', 'dormitory', 'dining', 'library',
        'specialty', 'recreation', 'stadium', 'president', 'display'
      ];
      for (const id of required) {
        expect(BUILDINGS[id]).toBeDefined();
      }
    });

    it('admissions is free and has no prerequisites', () => {
      const admissions = BUILDINGS.admissions;
      expect(admissions.basePrice).toBe(0);
      expect(admissions.prerequisites).toEqual([]);
    });

    it('first purchase is affordable with starting cash', () => {
      const affordableBuildings = Object.values(BUILDINGS).filter(
        b => b.basePrice <= STARTING_CASH && b.prerequisites.length === 0
      );
      expect(affordableBuildings.length).toBeGreaterThan(0);
    });

    it('all buildings have valid prerequisites', () => {
      for (const building of Object.values(BUILDINGS)) {
        for (const prereq of building.prerequisites) {
          expect(BUILDINGS[prereq]).toBeDefined();
        }
      }
    });

    it('all buildings have positive footprints', () => {
      for (const building of Object.values(BUILDINGS)) {
        expect(building.footprint.width).toBeGreaterThan(0);
        expect(building.footprint.depth).toBeGreaterThan(0);
        expect(building.height).toBeGreaterThan(0);
      }
    });

    it('upgrade levels increase in price', () => {
      for (const building of Object.values(BUILDINGS)) {
        for (let i = 1; i < building.upgrades.length; i++) {
          expect(building.upgrades[i].price).toBeGreaterThan(building.upgrades[i-1].price);
        }
      }
    });
  });

  describe('schools', () => {
    it('has three schools', () => {
      expect(SCHOOL_IDS.length).toBe(3);
    });

    it('all schools have required properties', () => {
      for (const school of Object.values(SCHOOLS)) {
        expect(school.name).toBeTruthy();
        expect(school.color).toBeTruthy();
        expect(school.colorHex).toBeGreaterThan(0);
        expect(school.motto).toBeTruthy();
        expect(school.emblemShape).toBeTruthy();
      }
    });

    it('school colors are distinct', () => {
      const colors = new Set(Object.values(SCHOOLS).map(s => s.colorHex));
      expect(colors.size).toBe(3);
    });
  });

  describe('player capacity', () => {
    it('can support max players', () => {
      const totalPlots = SCHOOL_IDS.length * PLOTS_PER_SCHOOL;
      expect(totalPlots).toBeGreaterThanOrEqual(MAX_PLAYERS);
    });

    it('plots per school equals 4', () => {
      expect(PLOTS_PER_SCHOOL).toBe(4);
    });
  });
});
