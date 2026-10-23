import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Publicly readable teams & rosters
router.get('/', TeamController.listTeams);
router.get('/:id', TeamController.getTeam);

// Protected coach/admin routes
router.post('/', authenticate, authorize('COACH', 'ORGANIZER', 'ADMIN'), TeamController.createTeam);
router.patch('/:id', authenticate, authorize('COACH', 'ORGANIZER', 'ADMIN'), TeamController.updateTeam);
router.delete('/:id', authenticate, authorize('COACH', 'ORGANIZER', 'ADMIN'), TeamController.deleteTeam);
router.post('/:id/players', authenticate, authorize('COACH', 'ORGANIZER', 'ADMIN'), TeamController.addPlayer);
router.patch('/:id/players/:playerId', authenticate, authorize('COACH', 'ORGANIZER', 'ADMIN'), TeamController.updatePlayer);
router.delete('/:id/players/:playerId', authenticate, authorize('COACH', 'ORGANIZER', 'ADMIN'), TeamController.deletePlayer);

export default router;
