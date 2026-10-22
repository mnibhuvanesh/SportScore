import { Types } from 'mongoose';
import { Match, IMatch, MatchStage } from '../models/Match';
import { Tournament } from '../models/Tournament';
import { TournamentRegistration } from '../models/TournamentRegistration';

export interface FixturePair {
  round: number;
  matchNumber: number;
  roundName: string;
  stage: MatchStage;
  groupIndex?: number | null;
  homeTeamId: Types.ObjectId | null;
  awayTeamId: Types.ObjectId | null;
  isBye: boolean;
  nextMatchSlot?: 'home' | 'away' | null;
  bracketIndex?: number;
}

export class FixtureService {
  /**
   * Generates single or double round-robin fixtures using the canonical Circle Method.
   */
  static generateRoundRobinFixtures(
    teamIds: Types.ObjectId[],
    doubleRoundRobin = false
  ): FixturePair[] {
    const teams: (Types.ObjectId | null)[] = [...teamIds];

    // If odd number of teams, add a dummy team representing a bye
    if (teams.length % 2 !== 0) {
      teams.push(null);
    }

    const n = teams.length;
    const roundsCount = n - 1;
    const matchesPerRound = n / 2;
    const fixtures: FixturePair[] = [];
    let matchCounter = 1;

    // Rotation array excluding the first fixed team
    const fixed = teams[0];
    const rotating = teams.slice(1);

    for (let r = 0; r < roundsCount; r++) {
      const currentRoundTeams = [fixed, ...rotating];
      const roundNumber = r + 1;

      for (let m = 0; m < matchesPerRound; m++) {
        const home = currentRoundTeams[m];
        const away = currentRoundTeams[n - 1 - m];

        // Alternate home/away for the fixed team to maintain balance
        const [homeTeam, awayTeam] =
          m === 0 && r % 2 === 1 ? [away, home] : [home, away];

        const isBye = homeTeam === null || awayTeam === null;

        fixtures.push({
          round: roundNumber,
          matchNumber: matchCounter++,
          roundName: `Round ${roundNumber}`,
          stage: 'REGULAR',
          groupIndex: null,
          homeTeamId: homeTeam,
          awayTeamId: awayTeam,
          isBye,
        });
      }

      // Rotate: pop last element and unshift to front
      const last = rotating.pop()!;
      rotating.unshift(last);
    }

    // Double round-robin: mirror the first leg with inverted home/away
    if (doubleRoundRobin) {
      const firstLegCount = fixtures.length;
      for (let i = 0; i < firstLegCount; i++) {
        const leg1 = fixtures[i];
        const secondLegRound = leg1.round + roundsCount;
        fixtures.push({
          round: secondLegRound,
          matchNumber: matchCounter++,
          roundName: `Round ${secondLegRound}`,
          stage: 'REGULAR',
          groupIndex: null,
          homeTeamId: leg1.awayTeamId,
          awayTeamId: leg1.homeTeamId,
          isBye: leg1.isBye,
        });
      }
    }

    return fixtures;
  }

  /**
   * Next power of 2 for bracket size (e.g., 5 -> 8, 6 -> 8, 7 -> 8, 8 -> 8, 12 -> 16).
   */
  static getBracketSize(teamCount: number): number {
    let size = 2;
    while (size < teamCount) {
      size *= 2;
    }
    return size;
  }

  /**
   * Deterministic Standard Tournament Seeding Pattern for bracket size N.
   * Ensures #1 plays #N, #2 plays #N-1, with seeds placed to meet in finals if winning.
   */
  static getSeedOrder(bracketSize: number): number[] {
    let rounds = Math.log2(bracketSize) - 1;
    let seedOrder = [1, 2];

    for (let i = 0; i < rounds; i++) {
      const nextSeeds: number[] = [];
      const sum = seedOrder.length * 2 + 1;
      for (const seed of seedOrder) {
        nextSeeds.push(seed);
        nextSeeds.push(sum - seed);
      }
      seedOrder = nextSeeds;
    }
    return seedOrder;
  }

  /**
   * Generates single-elimination tournament bracket matches with deterministic seed order and byes.
   */
  static generateSingleEliminationFixtures(
    seededTeamIds: (Types.ObjectId | null)[]
  ): {
    round: number;
    matchNumber: number;
    roundName: string;
    stage: MatchStage;
    homeTeamId: Types.ObjectId | null;
    awayTeamId: Types.ObjectId | null;
    isBye: boolean;
    bracketRound: number;
    matchInRound: number;
  }[] {
    const numTeams = seededTeamIds.length;
    const bracketSize = this.getBracketSize(numTeams);
    const numRounds = Math.log2(bracketSize);

    // Map seed order to teams
    const seedOrder = this.getSeedOrder(bracketSize);
    const round1Slots: (Types.ObjectId | null)[] = seedOrder.map((seed) => {
      return seed <= numTeams ? seededTeamIds[seed - 1] : null;
    });

    const matches: {
      round: number;
      matchNumber: number;
      roundName: string;
      stage: MatchStage;
      homeTeamId: Types.ObjectId | null;
      awayTeamId: Types.ObjectId | null;
      isBye: boolean;
      bracketRound: number;
      matchInRound: number;
    }[] = [];

    let matchNumber = 1;

    // Round 1 matches
    const round1MatchesCount = bracketSize / 2;
    for (let i = 0; i < round1MatchesCount; i++) {
      const home = round1Slots[i * 2];
      const away = round1Slots[i * 2 + 1];
      const isBye = home === null || away === null;

      let roundName = 'Round 1';
      if (bracketSize === 2) roundName = 'Final';
      else if (bracketSize === 4) roundName = 'Semifinal';
      else if (bracketSize === 8) roundName = 'Quarterfinal';
      else if (bracketSize === 16) roundName = 'Round of 16';

      matches.push({
        round: 1,
        matchNumber: matchNumber++,
        roundName,
        stage: 'KNOCKOUT',
        homeTeamId: home,
        awayTeamId: away,
        isBye,
        bracketRound: 1,
        matchInRound: i + 1,
      });
    }

    // Subsequent rounds (teams to be determined dynamically upon progression)
    let currentMatchesInRound = round1MatchesCount / 2;
    for (let r = 2; r <= numRounds; r++) {
      let roundName = `Round ${r}`;
      if (currentMatchesInRound === 1) roundName = 'Final';
      else if (currentMatchesInRound === 2) roundName = 'Semifinal';
      else if (currentMatchesInRound === 4) roundName = 'Quarterfinal';

      for (let m = 0; m < currentMatchesInRound; m++) {
        matches.push({
          round: r,
          matchNumber: matchNumber++,
          roundName,
          stage: 'KNOCKOUT',
          homeTeamId: null,
          awayTeamId: null,
          isBye: false,
          bracketRound: r,
          matchInRound: m + 1,
        });
      }
      currentMatchesInRound /= 2;
    }

    return matches;
  }

  /**
   * Persists tournament fixtures idempotently and connects bracket advancement relationships.
   */
  static async generateTournamentFixtures(tournamentId: Types.ObjectId | string): Promise<IMatch[]> {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');

    // Verify registrations
    const registrations = await TournamentRegistration.find({
      tournamentId: tournament._id,
      status: 'APPROVED',
    }).sort({ seedNumber: 1, createdAt: 1 });

    if (registrations.length < tournament.minTeams) {
      throw new Error(`Insufficient approved teams. Minimum required: ${tournament.minTeams}`);
    }

    // Check if played matches exist before regenerating
    const existingPlayed = await Match.findOne({
      tournamentId: tournament._id,
      status: { $in: ['LIVE', 'COMPLETED'] },
    });

    if (existingPlayed) {
      throw new Error('Cannot regenerate fixtures: Tournament already has matches that are live or completed.');
    }

    // Clean up any unplayed draft/scheduled matches
    await Match.deleteMany({ tournamentId: tournament._id });

    const teamIds = registrations.map((r) => r.teamId);
    const createdMatches: IMatch[] = [];

    if (tournament.format === 'ROUND_ROBIN' || tournament.format === 'DOUBLE_ROUND_ROBIN') {
      const isDouble = tournament.format === 'DOUBLE_ROUND_ROBIN';
      const fixtures = this.generateRoundRobinFixtures(teamIds, isDouble);

      for (const f of fixtures) {
        const match = await Match.create({
          tournamentId: tournament._id,
          round: f.round,
          matchNumber: f.matchNumber,
          roundName: f.roundName,
          stage: f.stage,
          homeTeamId: f.homeTeamId,
          awayTeamId: f.awayTeamId,
          isBye: f.isBye,
          status: f.isBye ? 'COMPLETED' : 'SCHEDULED',
          winnerTeamId: f.isBye ? f.homeTeamId || f.awayTeamId : null,
        });
        createdMatches.push(match);
      }
    } else if (tournament.format === 'SINGLE_ELIMINATION') {
      const fixtures = this.generateSingleEliminationFixtures(teamIds);
      const matchMap = new Map<string, IMatch>();

      // First create all matches
      for (const f of fixtures) {
        const match = await Match.create({
          tournamentId: tournament._id,
          round: f.round,
          matchNumber: f.matchNumber,
          roundName: f.roundName,
          stage: 'KNOCKOUT',
          homeTeamId: f.homeTeamId,
          awayTeamId: f.awayTeamId,
          isBye: f.isBye,
          status: f.isBye ? 'COMPLETED' : 'SCHEDULED',
          winnerTeamId: f.isBye ? f.homeTeamId || f.awayTeamId : null,
        });
        matchMap.set(`${f.bracketRound}-${f.matchInRound}`, match);
        createdMatches.push(match);
      }

      // Link next-round dependencies: Match i in round r advances to Match Math.ceil(i/2) in round r+1
      for (const f of fixtures) {
        const currentMatch = matchMap.get(`${f.bracketRound}-${f.matchInRound}`)!;
        const nextRound = f.bracketRound + 1;
        const nextMatchInRound = Math.ceil(f.matchInRound / 2);
        const nextMatch = matchMap.get(`${nextRound}-${nextMatchInRound}`);

        if (nextMatch) {
          const slot = f.matchInRound % 2 === 1 ? 'home' : 'away';
          currentMatch.nextMatchId = nextMatch._id;
          currentMatch.nextMatchSlot = slot;
          await currentMatch.save();

          // If current match is a Bye, advance the winner automatically!
          if (currentMatch.isBye && currentMatch.winnerTeamId) {
            if (slot === 'home') {
              nextMatch.homeTeamId = currentMatch.winnerTeamId;
            } else {
              nextMatch.awayTeamId = currentMatch.winnerTeamId;
            }
            await nextMatch.save();
          }
        }
      }
    } else if (tournament.format === 'GROUP_AND_KNOCKOUT') {
      // Group Stage: divide teams into groupCount groups
      const groupCount = tournament.groupCount || 2;
      const groups: Types.ObjectId[][] = Array.from({ length: groupCount }, () => []);

      teamIds.forEach((teamId, index) => {
        groups[index % groupCount].push(teamId);
      });

      let matchNumber = 1;
      for (let g = 0; g < groupCount; g++) {
        const groupTeamIds = groups[g];
        const groupLetter = String.fromCharCode(65 + g);
        const groupFixtures = this.generateRoundRobinFixtures(groupTeamIds, false);

        for (const f of groupFixtures) {
          const match = await Match.create({
            tournamentId: tournament._id,
            round: f.round,
            matchNumber: matchNumber++,
            roundName: `Group ${groupLetter} - Round ${f.round}`,
            stage: 'GROUP_STAGE',
            groupIndex: g,
            homeTeamId: f.homeTeamId,
            awayTeamId: f.awayTeamId,
            isBye: f.isBye,
            status: f.isBye ? 'COMPLETED' : 'SCHEDULED',
            winnerTeamId: f.isBye ? f.homeTeamId || f.awayTeamId : null,
          });
          createdMatches.push(match);
        }
      }
    }

    tournament.fixturesGenerated = true;
    if (tournament.status === 'REGISTRATION_OPEN') {
      tournament.status = 'IN_PROGRESS';
    }
    await tournament.save();

    return createdMatches;
  }

  /**
   * Advances the winner of a completed match to the downstream bracket match.
   * If an earlier result is reversed or modified, safely resets downstream dependent matches without deleting event histories.
   */
  static async handleMatchCompletionProgression(
    matchId: Types.ObjectId | string,
    winnerTeamId: Types.ObjectId | null
  ): Promise<void> {
    const match = await Match.findById(matchId);
    if (!match || !match.nextMatchId || !match.nextMatchSlot) return;

    const nextMatch = await Match.findById(match.nextMatchId);
    if (!nextMatch) return;

    if (match.nextMatchSlot === 'home') {
      nextMatch.homeTeamId = winnerTeamId;
    } else {
      nextMatch.awayTeamId = winnerTeamId;
    }

    // If an earlier result changed and downstream match was already finished, safely reset status to SCHEDULED
    if (nextMatch.status === 'COMPLETED' && nextMatch.winnerTeamId) {
      nextMatch.status = 'SCHEDULED';
      nextMatch.winnerTeamId = null;
      nextMatch.homeScore = 0;
      nextMatch.awayScore = 0;
    }

    await nextMatch.save();
  }
}
