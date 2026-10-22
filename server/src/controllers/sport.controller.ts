import { Request, Response } from 'express';
import { Sport } from '../models/Sport';

export class SportController {
  static async listSports(_req: Request, res: Response): Promise<void> {
    try {
      const sports = await Sport.find({ isActive: true }).sort({ name: 1 });
      res.status(200).json({ success: true, data: { sports } });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list sports' } });
    }
  }

  static async createSport(req: Request, res: Response): Promise<void> {
    try {
      const { name, code, scoringType, minPlayersPerTeam, maxPlayersPerTeam, matchDurationMinutes, pointsConfig, description, rules } = req.body;
      const sport = await Sport.create({
        name,
        code: code.toUpperCase(),
        scoringType,
        minPlayersPerTeam,
        maxPlayersPerTeam,
        matchDurationMinutes,
        pointsConfig,
        description,
        rules,
      });

      res.status(201).json({ success: true, data: { sport } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
    }
  }
}
