import { AuditLog } from '../models/AuditLog';
import { Types } from 'mongoose';

export interface AuditParams {
  userId?: string | Types.ObjectId | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async record(params: AuditParams): Promise<void> {
    try {
      // Deep sanitize details to ensure no tokens, passwords or secrets are ever recorded
      const sanitizedDetails = { ...params.details };
      const sensitiveKeys = ['password', 'passwordHash', 'token', 'refreshToken', 'tokenHash', 'secret'];

      for (const key of Object.keys(sanitizedDetails)) {
        if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
          sanitizedDetails[key] = '[REDACTED]';
        }
      }

      await AuditLog.create({
        userId: params.userId || null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        details: sanitizedDetails,
        ipAddress: params.ipAddress || 'unknown',
        userAgent: params.userAgent || 'unknown',
      });
    } catch (err) {
      console.error('⚠️ Failed to record audit log:', err);
    }
  }
}
