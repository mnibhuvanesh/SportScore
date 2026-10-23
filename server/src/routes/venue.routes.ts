import { Router } from 'express';
import { VenueController } from '../controllers/venue.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Publicly readable venues & resources
router.get('/', VenueController.listVenues);
router.get('/resources', VenueController.listResources);
router.get('/:id', VenueController.getVenue);

// Protected organizer/admin operations
router.post('/', authenticate, authorize('ORGANIZER', 'ADMIN'), VenueController.createVenue);
router.post('/resources', authenticate, authorize('ORGANIZER', 'ADMIN'), VenueController.createResource);
router.post('/resources/:id/reserve', authenticate, authorize('ORGANIZER', 'ADMIN'), VenueController.reserveResource);

export default router;
