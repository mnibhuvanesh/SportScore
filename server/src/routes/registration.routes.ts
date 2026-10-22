import { Router } from 'express';
import { RegistrationController } from '../controllers/registration.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize('COACH', 'ORGANIZER', 'ADMIN'), RegistrationController.requestRegistration);
router.get('/my', authorize('COACH', 'ADMIN'), RegistrationController.listCoachRegistrations);
router.get('/team/:teamId', RegistrationController.listTeamRegistrations);
router.get('/tournament/:tournamentId', authorize('ORGANIZER', 'ADMIN'), RegistrationController.listTournamentRegistrations);
router.patch('/:id/review', authorize('ORGANIZER', 'ADMIN'), RegistrationController.reviewRegistration);

export default router;
