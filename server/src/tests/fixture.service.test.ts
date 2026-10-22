import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { FixtureService } from '../services/fixture.service';

describe('FixtureService', () => {
  describe('getBracketSize', () => {
    it('should calculate the nearest upper power of 2 correctly', () => {
      expect(FixtureService.getBracketSize(2)).toBe(2);
      expect(FixtureService.getBracketSize(3)).toBe(4);
      expect(FixtureService.getBracketSize(4)).toBe(4);
      expect(FixtureService.getBracketSize(5)).toBe(8);
      expect(FixtureService.getBracketSize(8)).toBe(8);
      expect(FixtureService.getBracketSize(9)).toBe(16);
      expect(FixtureService.getBracketSize(16)).toBe(16);
    });
  });

  describe('getSeedOrder', () => {
    it('should generate standard seeded order for 4 teams', () => {
      // 1 vs 4, 2 vs 3
      const seeds = FixtureService.getSeedOrder(4);
      expect(seeds).toEqual([1, 4, 2, 3]);
    });

    it('should generate standard seeded order for 8 teams', () => {
      // 1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6
      const seeds = FixtureService.getSeedOrder(8);
      expect(seeds).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    });
  });

  describe('generateRoundRobinFixtures', () => {
    it('should generate N-1 rounds for an even number of teams (4 teams -> 3 rounds, 6 matches)', () => {
      const teams = [
        new Types.ObjectId(),
        new Types.ObjectId(),
        new Types.ObjectId(),
        new Types.ObjectId(),
      ];

      const fixtures = FixtureService.generateRoundRobinFixtures(teams, false);

      // 4 teams: 3 rounds * 2 matches/round = 6 total matches
      expect(fixtures.length).toBe(6);

      // Verify rounds
      const rounds = new Set(fixtures.map((f) => f.round));
      expect(rounds.size).toBe(3);

      // Check no byes with even team count
      const byes = fixtures.filter((f) => f.isBye);
      expect(byes.length).toBe(0);
    });

    it('should correctly introduce byes for odd number of teams (3 teams -> 3 rounds with byes)', () => {
      const teams = [
        new Types.ObjectId(),
        new Types.ObjectId(),
        new Types.ObjectId(),
      ];

      const fixtures = FixtureService.generateRoundRobinFixtures(teams, false);

      // 3 teams + 1 bye dummy = 4 virtual teams -> 3 rounds * 2 matches/round = 6 fixtures (3 real, 3 byes)
      expect(fixtures.length).toBe(6);
      const byes = fixtures.filter((f) => f.isBye);
      expect(byes.length).toBe(3);
    });

    it('should double the fixtures for double round-robin tournaments', () => {
      const teams = [
        new Types.ObjectId(),
        new Types.ObjectId(),
        new Types.ObjectId(),
        new Types.ObjectId(),
      ];

      const single = FixtureService.generateRoundRobinFixtures(teams, false);
      const double = FixtureService.generateRoundRobinFixtures(teams, true);

      expect(double.length).toBe(single.length * 2);
      expect(double.length).toBe(12);
    });
  });

  describe('generateSingleEliminationFixtures', () => {
    it('should generate proper rounds and matches for 4 teams', () => {
      const teams = [
        new Types.ObjectId(),
        new Types.ObjectId(),
        new Types.ObjectId(),
        new Types.ObjectId(),
      ];

      const fixtures = FixtureService.generateSingleEliminationFixtures(teams);

      // 4 teams: Round 1 (Semifinals) has 2 matches, Round 2 (Final) has 1 match = 3 total matches
      expect(fixtures.length).toBe(3);

      const finals = fixtures.filter((f) => f.roundName === 'Final');
      expect(finals.length).toBe(1);

      const semis = fixtures.filter((f) => f.roundName.includes('Semifinal'));
      expect(semis.length).toBe(2);
    });
  });
});
