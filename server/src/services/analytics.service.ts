import { Types } from 'mongoose';
import { Tournament } from '../models/Tournament';
import { Match } from '../models/Match';
import { Sport } from '../models/Sport';
import { MatchEvent } from '../models/MatchEvent';
import { TournamentRegistration } from '../models/TournamentRegistration';

export interface TeamStanding {
  teamId: string;
  teamName: string;
  teamCode: string;
  logoUrl?: string;
  groupIndex?: number | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export class AnalyticsService {
  /**
   * Calculates deterministic standings for a tournament based on sport-specific rules.
   */
  static async getTournamentStandings(
    tournamentId: string | Types.ObjectId,
    groupIndex?: number
  ): Promise<TeamStanding[]> {
    const tournament = await Tournament.findById(tournamentId).populate('sportId');
    if (!tournament) throw new Error('Tournament not found');

    const sport = await Sport.findById(tournament.sportId);
    const winPoints = sport?.pointsConfig?.win ?? 3;
    const drawPoints = sport?.pointsConfig?.draw ?? 1;
    const lossPoints = sport?.pointsConfig?.loss ?? 0;

    // Get approved teams
    const regQuery: any = { tournamentId: tournament._id, status: 'APPROVED' };
    if (groupIndex !== undefined && groupIndex !== null) {
      regQuery.groupIndex = groupIndex;
    }

    const registrations = await TournamentRegistration.find(regQuery).populate('teamId');
    const standingsMap = new Map<string, TeamStanding>();

    for (const reg of registrations) {
      const team = reg.teamId as any;
      if (team && team._id) {
        standingsMap.set(team._id.toString(), {
          teamId: team._id.toString(),
          teamName: team.name,
          teamCode: team.code,
          logoUrl: team.logoUrl,
          groupIndex: reg.groupIndex ?? null,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          pointDifference: 0,
          points: 0,
          form: [],
        });
      }
    }

    // Get completed matches
    const matchQuery: any = { tournamentId: tournament._id, status: 'COMPLETED' };
    if (groupIndex !== undefined && groupIndex !== null) {
      matchQuery.groupIndex = groupIndex;
    }

    const matches = await Match.find(matchQuery).sort({ actualEndTime: 1, updatedAt: 1 });

    for (const match of matches) {
      if (!match.homeTeamId || !match.awayTeamId || match.isBye) continue;

      const homeId = match.homeTeamId.toString();
      const awayId = match.awayTeamId.toString();

      const homeStanding = standingsMap.get(homeId);
      const awayStanding = standingsMap.get(awayId);

      if (homeStanding) {
        homeStanding.played += 1;
        homeStanding.pointsFor += match.homeScore;
        homeStanding.pointsAgainst += match.awayScore;
        homeStanding.pointDifference = homeStanding.pointsFor - homeStanding.pointsAgainst;

        if (match.isDraw) {
          homeStanding.drawn += 1;
          homeStanding.points += drawPoints;
          homeStanding.form.push('D');
        } else if (match.winnerTeamId && match.winnerTeamId.toString() === homeId) {
          homeStanding.won += 1;
          homeStanding.points += winPoints;
          homeStanding.form.push('W');
        } else {
          homeStanding.lost += 1;
          homeStanding.points += lossPoints;
          homeStanding.form.push('L');
        }
      }

      if (awayStanding) {
        awayStanding.played += 1;
        awayStanding.pointsFor += match.awayScore;
        awayStanding.pointsAgainst += match.homeScore;
        awayStanding.pointDifference = awayStanding.pointsFor - awayStanding.pointsAgainst;

        if (match.isDraw) {
          awayStanding.drawn += 1;
          awayStanding.points += drawPoints;
          awayStanding.form.push('D');
        } else if (match.winnerTeamId && match.winnerTeamId.toString() === awayId) {
          awayStanding.won += 1;
          awayStanding.points += winPoints;
          awayStanding.form.push('W');
        } else {
          awayStanding.lost += 1;
          awayStanding.points += lossPoints;
          awayStanding.form.push('L');
        }
      }
    }

    // Limit form array to last 5 results
    const standings = Array.from(standingsMap.values()).map((s) => ({
      ...s,
      form: s.form.slice(-5),
    }));

    // Deterministic Sort: Points desc, Point Difference desc, Points For desc, Team Name asc
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
      if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
      return a.teamName.localeCompare(b.teamName);
    });

    return standings;
  }

  /**
   * Generates sanitized CSV string safe against formula injection.
   */
  static generateSafeCSV(headers: string[], rows: (string | number)[][]): string {
    const sanitizeCell = (val: string | number): string => {
      if (val === null || val === undefined) return '""';
      let str = String(val);

      // Spreadsheet formula injection mitigation: prepend single quote if starting with formula operators
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }

      // Escape quotes
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerLine = headers.map(sanitizeCell).join(',');
    const rowLines = rows.map((row) => row.map(sanitizeCell).join(','));

    return [headerLine, ...rowLines].join('\n');
  }

  /**
   * Player statistics aggregation using MongoDB aggregation pipelines.
   */
  static async getTopScorers(tournamentId?: string | Types.ObjectId, limit = 10): Promise<any[]> {
    const matchStage: any = {
      isReversed: false,
      playerId: { $ne: null },
      type: { $in: ['SCORE_GOAL', 'SCORE_POINT'] },
    };

    if (tournamentId) {
      const matchIds = await Match.find({ tournamentId }).distinct('_id');
      matchStage.matchId = { $in: matchIds };
    }

    return MatchEvent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$playerId',
          totalPoints: { $sum: '$points' },
          eventsCount: { $sum: 1 },
          teamId: { $first: '$teamId' },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'players',
          localField: '_id',
          foreignField: '_id',
          as: 'player',
        },
      },
      { $unwind: '$player' },
      {
        $lookup: {
          from: 'teams',
          localField: 'teamId',
          foreignField: '_id',
          as: 'team',
        },
      },
      { $unwind: { path: '$team', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          playerId: '$_id',
          playerName: { $concat: ['$player.firstName', ' ', '$player.lastName'] },
          jerseyNumber: '$player.jerseyNumber',
          position: '$player.position',
          teamName: '$team.name',
          totalPoints: 1,
          eventsCount: 1,
        },
      },
    ]);
  }

  /**
   * Team performance analytics: matches played, win rate, average score, clean sheets.
   */
  static async getTeamAnalytics(teamId: string | Types.ObjectId): Promise<any> {
    const matches = await Match.find({
      $or: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      status: 'COMPLETED',
    }).sort({ scheduledStartTime: -1 });

    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let scored = 0;
    let conceded = 0;
    const history: any[] = [];

    for (const m of matches) {
      played++;
      const isHome = m.homeTeamId && m.homeTeamId.toString() === teamId.toString();
      const teamScore = isHome ? m.homeScore : m.awayScore;
      const opponentScore = isHome ? m.awayScore : m.homeScore;

      scored += teamScore;
      conceded += opponentScore;

      let result: 'W' | 'D' | 'L' = 'D';
      if (m.isDraw) {
        drawn++;
        result = 'D';
      } else if (m.winnerTeamId && m.winnerTeamId.toString() === teamId.toString()) {
        won++;
        result = 'W';
      } else {
        lost++;
        result = 'L';
      }

      history.push({
        matchId: m._id,
        roundName: m.roundName,
        teamScore,
        opponentScore,
        result,
        date: m.actualEndTime || m.scheduledStartTime,
      });
    }

    const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
    const avgScored = played > 0 ? (scored / played).toFixed(1) : '0';
    const avgConceded = played > 0 ? (conceded / played).toFixed(1) : '0';

    return {
      played,
      won,
      drawn,
      lost,
      winRate,
      scored,
      conceded,
      avgScored,
      avgConceded,
      history: history.slice(0, 10),
    };
  }
}
