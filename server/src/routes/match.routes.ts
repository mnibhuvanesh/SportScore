import { Router } from 'express';
import { MatchController } from '../controllers/match.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Publicly readable match list & details
router.get('/', MatchController.listMatches);
router.get('/:id', MatchController.getMatch);

// Protected scheduling, status & scoring operations
router.post('/:id/schedule', authenticate, authorize('ORGANIZER', 'ADMIN'), MatchController.scheduleMatch);
router.post('/:id/reschedule', authenticate, authorize('ORGANIZER', 'ADMIN'), MatchController.rescheduleMatch);
router.post('/:id/assign-scorer', authenticate, authorize('ORGANIZER', 'ADMIN'), MatchController.assignScorer);

// Scorer operations (Scorers, Organizers, Admins)
router.patch('/:id/status', authenticate, authorize('SCORER', 'ORGANIZER', 'ADMIN'), MatchController.updateStatus);
router.post('/:id/score', authenticate, authorize('SCORER', 'ORGANIZER', 'ADMIN'), MatchController.recordScore);
router.post('/:id/events/:eventId/reverse', authenticate, authorize('SCORER', 'ORGANIZER', 'ADMIN'), MatchController.reverseEvent);

export default router;
