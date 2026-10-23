import { Request, Response } from 'express';
import { User } from '../models/User';
import { Invitation } from '../models/Invitation';
import { PasswordReset } from '../models/PasswordReset';
import { sessionService } from '../services/session.service';
import { AuditService } from '../services/audit.service';
import {
  hashPassword,
  verifyPassword,
  generateRandomToken,
  hashToken,
} from '../utils/security';
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE_NAME } from '../utils/cookie';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createInvitationSchema,
  acceptInvitationSchema,
  changePasswordSchema,
} from '../validators/auth.validator';
import { env } from '../config/env';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.format() },
        });
        return;
      }

      const { email, password, rememberMe } = parsed.data;
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      // 1. Check failed login lockout
      const lockout = await sessionService.checkLockout(email, clientIp);
      if (lockout.isLocked) {
        res.status(429).json({
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: `Too many failed login attempts. Please try again in ${lockout.remainingSeconds} seconds.`,
            remainingSeconds: lockout.remainingSeconds,
          },
        });
        return;
      }

      // 2. Fetch user with password (supports email or username)
      const user = await User.findOne({
        $or: [{ email }, { username: email }],
      }).select('+passwordHash');
      if (!user || user.status !== 'ACTIVE') {
        const result = await sessionService.recordFailedLogin(email, clientIp);
        await AuditService.record({
          action: 'LOGIN_FAILED',
          resourceType: 'User',
          details: { email, reason: 'Invalid credentials or inactive user' },
          ipAddress: clientIp,
          userAgent: req.headers['user-agent'],
        });

        const message = result.isLocked
          ? `Too many failed login attempts. Account locked for ${result.remainingSeconds} seconds.`
          : 'Email or password is incorrect.';

        res.status(result.isLocked ? 429 : 401).json({
          success: false,
          error: {
            code: result.isLocked ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
            message,
            remainingSeconds: result.remainingSeconds,
          },
        });
        return;
      }

      // 3. Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        const result = await sessionService.recordFailedLogin(email, clientIp);
        await AuditService.record({
          userId: user._id,
          action: 'LOGIN_FAILED',
          resourceType: 'User',
          resourceId: user._id.toString(),
          details: { email, reason: 'Invalid password' },
          ipAddress: clientIp,
          userAgent: req.headers['user-agent'],
        });

        const message = result.isLocked
          ? `Too many failed login attempts. Account locked for ${result.remainingSeconds} seconds.`
          : 'Email or password is incorrect.';

        res.status(result.isLocked ? 429 : 401).json({
          success: false,
          error: {
            code: result.isLocked ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
            message,
            remainingSeconds: result.remainingSeconds,
          },
        });
        return;
      }

      // 4. Successful login
      await sessionService.clearFailedLogin(email, clientIp);
      user.lastLoginAt = new Date();
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
      await user.save();

      const { accessToken, refreshToken } = await sessionService.createSession(user, rememberMe);
      setAuthCookies(res, accessToken, refreshToken, rememberMe);

      await AuditService.record({
        userId: user._id,
        action: 'LOGIN_SUCCESS',
        resourceType: 'User',
        resourceId: user._id.toString(),
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON(),
          accessToken, // provided for clients if cookie fallback is required
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred during login' },
      });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      if (!rawRefreshToken) {
        res.status(401).json({
          success: false,
          error: { code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh token is missing' },
        });
        return;
      }

      const rotated = await sessionService.rotateRefreshToken(rawRefreshToken);
      if (!rotated) {
        clearAuthCookies(res);
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_REFRESH_TOKEN', message: 'Session expired or invalidated. Please sign in again.' },
        });
        return;
      }

      setAuthCookies(res, rotated.accessToken, rotated.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: rotated.user.toJSON(),
          accessToken: rotated.accessToken,
        },
      });
    } catch (err) {
      clearAuthCookies(res);
      res.status(401).json({
        success: false,
        error: { code: 'REFRESH_FAILED', message: 'Unable to refresh session' },
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      if (rawRefreshToken) {
        try {
          const { verifyRefreshToken } = require('../utils/security');
          const decoded = verifyRefreshToken(rawRefreshToken);
          if (decoded.familyId) {
            await sessionService.revokeFamily(decoded.familyId);
          }
        } catch {
          // Ignore invalid refresh token during logout
        }
      }

      if (req.user) {
        await AuditService.record({
          userId: req.user._id,
          action: 'LOGOUT',
          resourceType: 'User',
          resourceId: req.user._id.toString(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }

      clearAuthCookies(res);
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      clearAuthCookies(res);
      res.status(200).json({ success: true });
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user: req.user.toJSON() },
    });
  }

  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid password format', details: parsed.error.format() },
        });
        return;
      }

      const { currentPassword, newPassword } = parsed.data;
      const userWithPass = await User.findById(user._id).select('+passwordHash');
      if (!userWithPass) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }

      const isMatch = await verifyPassword(currentPassword, userWithPass.passwordHash);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PASSWORD', message: 'Current password does not match' },
        });
        return;
      }

      userWithPass.passwordHash = await hashPassword(newPassword);
      userWithPass.passwordChangedAt = new Date();
      await userWithPass.save();

      // Invalidate all prior sessions except current
      await sessionService.revokeAllUserSessions(user._id.toString());
      const { accessToken, refreshToken } = await sessionService.createSession(userWithPass);
      setAuthCookies(res, accessToken, refreshToken);

      await AuditService.record({
        userId: user._id,
        action: 'PASSWORD_CHANGED',
        resourceType: 'User',
        resourceId: user._id.toString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update password' } });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid email address' },
        });
        return;
      }

      const { email } = parsed.data;
      const user = await User.findOne({ email });

      // Always return identical message regardless of whether user exists to prevent account enumeration
      const genericResponse = {
        success: true,
        message: 'If an account exists with this email, password reset instructions have been generated.',
      };

      if (!user || user.status !== 'ACTIVE') {
        res.status(200).json(genericResponse);
        return;
      }

      const rawToken = generateRandomToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000);

      await PasswordReset.create({
        userId: user._id,
        tokenHash,
        expiresAt,
      });

      const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;

      // In development mode only, log the reset URL for developer convenience
      if (env.NODE_ENV !== 'production') {
        console.log(`[DEV ONLY] Password reset link for ${email}: ${resetUrl}`);
      }

      await AuditService.record({
        userId: user._id,
        action: 'PASSWORD_RESET_REQUESTED',
        resourceType: 'User',
        resourceId: user._id.toString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Include resetToken in dev response for automated testing convenience
      const responsePayload: any = { ...genericResponse };
      if (env.NODE_ENV !== 'production') {
        responsePayload.devResetUrl = resetUrl;
        responsePayload.devToken = rawToken;
      }

      res.status(200).json(responsePayload);
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process request' } });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid password or token', details: parsed.error.format() },
        });
        return;
      }

      const { token, password } = parsed.data;
      const tokenHash = hashToken(token);

      const resetRecord = await PasswordReset.findOne({
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      });

      if (!resetRecord) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_OR_EXPIRED_TOKEN', message: 'Password reset link is invalid or has expired.' },
        });
        return;
      }

      const user = await User.findById(resetRecord.userId).select('+passwordHash');
      if (!user) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }

      // Mark token used
      resetRecord.usedAt = new Date();
      await resetRecord.save();

      // Update password
      user.passwordHash = await hashPassword(password);
      user.passwordChangedAt = new Date();
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
      await user.save();

      // Invalidate all previous sessions
      await sessionService.revokeAllUserSessions(user._id.toString());
      clearAuthCookies(res);

      await AuditService.record({
        userId: user._id,
        action: 'PASSWORD_RESET_SUCCESS',
        resourceType: 'User',
        resourceId: user._id.toString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. Please sign in with your new password.',
      });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Password reset failed' } });
    }
  }

  static async createInvitation(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const parsed = createInvitationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid invitation data', details: parsed.error.format() },
        });
        return;
      }

      const { email, role } = parsed.data;

      // Prevent role escalation: Organizers cannot invite Admins or Organizers
      if (currentUser.role === 'ORGANIZER' && (role === 'ADMIN' || role === 'ORGANIZER')) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Organizers can only invite Coaches, Athletes, or Scorers' },
        });
        return;
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: { code: 'USER_EXISTS', message: 'A user with this email address already exists' },
        });
        return;
      }

      // Revoke any existing pending invitations for this email
      await Invitation.updateMany({ email, status: 'PENDING' }, { status: 'REVOKED' });

      const rawToken = generateRandomToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + env.INVITATION_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

      const invitation = await Invitation.create({
        email,
        role,
        tokenHash,
        invitedBy: currentUser._id,
        expiresAt,
        status: 'PENDING',
      });

      const inviteUrl = `${env.CLIENT_URL}/accept-invitation?token=${rawToken}`;
      if (env.NODE_ENV !== 'production') {
        console.log(`[DEV ONLY] Invitation link for ${email} (${role}): ${inviteUrl}`);
      }

      await AuditService.record({
        userId: currentUser._id,
        action: 'INVITATION_CREATED',
        resourceType: 'Invitation',
        resourceId: invitation._id.toString(),
        details: { email, role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        success: true,
        data: {
          invitation: {
            id: invitation._id,
            email: invitation.email,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
            status: invitation.status,
          },
          inviteUrl: env.NODE_ENV !== 'production' ? inviteUrl : undefined,
          devToken: env.NODE_ENV !== 'production' ? rawToken : undefined,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create invitation' } });
    }
  }

  static async acceptInvitation(req: Request, res: Response): Promise<void> {
    try {
      const parsed = acceptInvitationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: parsed.error.format() },
        });
        return;
      }

      const { token, name, password, phone } = parsed.data;
      const tokenHash = hashToken(token);

      const invitation = await Invitation.findOne({
        tokenHash,
        status: 'PENDING',
        expiresAt: { $gt: new Date() },
      });

      if (!invitation) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INVITATION', message: 'Invitation link is invalid, expired, or already used' },
        });
        return;
      }

      const existingUser = await User.findOne({ email: invitation.email });
      if (existingUser) {
        invitation.status = 'REVOKED';
        await invitation.save();
        res.status(409).json({
          success: false,
          error: { code: 'USER_EXISTS', message: 'An account with this email already exists' },
        });
        return;
      }

      const passwordHash = await hashPassword(password);
      const user = await User.create({
        name,
        email: invitation.email,
        passwordHash,
        role: invitation.role,
        status: 'ACTIVE',
        phone,
      });

      invitation.status = 'ACCEPTED';
      invitation.usedAt = new Date();
      await invitation.save();

      const { accessToken, refreshToken } = await sessionService.createSession(user);
      setAuthCookies(res, accessToken, refreshToken);

      await AuditService.record({
        userId: user._id,
        action: 'INVITATION_ACCEPTED',
        resourceType: 'User',
        resourceId: user._id.toString(),
        details: { email: user.email, role: user.role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          accessToken,
        },
      });
    } catch (err) {
      console.error('Accept invitation error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to accept invitation' } });
    }
  }

  static async getInvitationInfo(req: Request, res: Response): Promise<void> {
    try {
      const token = req.query.token as string;
      if (!token) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Token is required' } });
        return;
      }

      const tokenHash = hashToken(token);
      const invitation = await Invitation.findOne({
        tokenHash,
        status: 'PENDING',
        expiresAt: { $gt: new Date() },
      });

      if (!invitation) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Invitation not found, expired, or already accepted' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to query invitation' } });
    }
  }
}
