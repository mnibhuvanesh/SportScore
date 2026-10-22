import { Router } from 'express';
import { TournamentController } from '../controllers/tournament.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Publicly readable tournament details & standings
router.get('/', TournamentController.listTournaments);
router.get('/:id', TournamentController.getTournament);
router.get('/:id/standings', TournamentController.getStandings);
router.get('/:id/standings/csv', TournamentController.exportStandingsCSV);

// Protected organizer/admin routes
router.post('/', authenticate, authorize('ADMIN', 'ORGANIZER'), TournamentController.createTournament);
router.patch('/:id', authenticate, authorize('ADMIN', 'ORGANIZER'), TournamentController.updateTournament);
router.post('/:id/fixtures/generate', authenticate, authorize('ADMIN', 'ORGANIZER'), TournamentController.generateFixtures);

export default router;
