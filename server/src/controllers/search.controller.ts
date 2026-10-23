import { Request, Response } from 'express';
import { Tournament } from '../models/Tournament';
import { Team } from '../models/Team';
import { Player } from '../models/Player';
import { Venue } from '../models/Venue';

export class SearchController {
  static async globalSearch(req: Request, res: Response): Promise<void> {
    try {
      const q = (req.query.q as string)?.trim();
      if (!q || q.length < 2) {
        res.status(200).json({
          success: true,
          data: { tournaments: [], teams: [], players: [], venues: [] },
        });
        return;
      }

      const regex = { $regex: q, $options: 'i' };

      const [tournaments, teams, players, venues] = await Promise.all([
        Tournament.find({ name: regex, isPublic: true }).limit(5).select('name slug status format'),
        Team.find({ name: regex, isActive: true }).limit(5).select('name code logoUrl'),
        Player.find({
          $or: [{ firstName: regex }, { lastName: regex }],
          status: 'ACTIVE',
        })
          .limit(5)
          .select('firstName lastName jerseyNumber position teamId')
          .populate('teamId', 'name code'),
        Venue.find({ name: regex, isActive: true }).limit(5).select('name code location capacity'),
      ]);

      res.status(200).json({
        success: true,
        data: { tournaments, teams, players, venues },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Search failed' } });
    }
  }
}
