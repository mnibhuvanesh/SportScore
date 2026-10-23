import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { AuditService } from '../services/audit.service';
import { sessionService } from '../services/session.service';

export class UserController {
  static async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const role = req.query.role as string;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const query: any = {};
      if (role) query.role = role;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const total = await User.countDocuments(query);
      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list users' } });
    }
  }

  static async getUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }
      res.status(200).json({ success: true, data: { user } });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user' } });
    }
  }

  static async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      if (!['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid status' } });
        return;
      }

      const targetUser = await User.findById(req.params.id);
      if (!targetUser) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }

      targetUser.status = status;
      await targetUser.save();

      if (status !== 'ACTIVE') {
        // Revoke active sessions for suspended or deactivated users
        await sessionService.revokeAllUserSessions(targetUser._id.toString());
      }

      await AuditService.record({
        userId: req.user!._id,
        action: 'USER_STATUS_UPDATED',
        resourceType: 'User',
        resourceId: targetUser._id.toString(),
        details: { newStatus: status, email: targetUser.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({ success: true, data: { user: targetUser } });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update user status' } });
    }
  }

  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, username, phone, role, status } = req.body;
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }

      if (username) {
        const normalizedUsername = username.toLowerCase().trim();
        const existing = await User.findOne({
          username: normalizedUsername,
          _id: { $ne: targetUser._id },
        });
        if (existing) {
          res.status(409).json({
            success: false,
            error: { code: 'USERNAME_EXISTS', message: 'Username is already taken' },
          });
          return;
        }
        targetUser.username = normalizedUsername;
      }

      if (name) targetUser.name = name.trim();
      if (phone !== undefined) targetUser.phone = phone.trim();
      if (role && ['ADMIN', 'ORGANIZER', 'COACH', 'ATHLETE', 'SCORER'].includes(role)) {
        targetUser.role = role;
      }
      if (status && ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
        targetUser.status = status;
        if (status !== 'ACTIVE') {
          await sessionService.revokeAllUserSessions(targetUser._id.toString());
        }
      }

      await targetUser.save();

      await AuditService.record({
        userId: req.user!._id,
        action: 'USER_UPDATED',
        resourceType: 'User',
        resourceId: targetUser._id.toString(),
        details: { name, username, role, status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({ success: true, data: { user: targetUser } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to update user' } });
    }
  }

  static async listAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 25;
      const action = req.query.action as string;
      const resourceType = req.query.resourceType as string;

      const query: any = {};
      if (action) query.action = action;
      if (resourceType) query.resourceType = resourceType;

      const total = await AuditLog.countDocuments(query);
      const logs = await AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list audit logs' } });
    }
  }
}
