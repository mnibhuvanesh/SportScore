import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh', AuthController.refresh);
router.get('/me', authenticate, AuthController.me);
router.post('/change-password', authenticate, AuthController.changePassword);

router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Invitation workflow
router.post(
  '/invitations',
  authenticate,
  authorize('ADMIN', 'ORGANIZER'),
  AuthController.createInvitation
);
router.get('/invitations/info', AuthController.getInvitationInfo);
router.post('/invitations/accept', AuthController.acceptInvitation);

export default router;
