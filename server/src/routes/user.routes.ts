import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Admin-only endpoints
router.get('/', authorize('ADMIN'), UserController.listUsers);
router.get('/audit-logs', authorize('ADMIN'), UserController.listAuditLogs);
router.get('/:id', authorize('ADMIN'), UserController.getUser);
router.put('/:id', authorize('ADMIN'), UserController.updateUser);
router.patch('/:id/status', authorize('ADMIN'), UserController.updateUserStatus);

export default router;
