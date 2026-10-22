import { Router } from 'express';
import { SportController } from '../controllers/sport.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', SportController.listSports);
router.post('/', authenticate, authorize('ADMIN'), SportController.createSport);

export default router;
