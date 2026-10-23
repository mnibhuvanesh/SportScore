import crypto from 'crypto';
import { getRedisClient } from '../config/redis';
import { env } from '../config/env';
import { IUser, User } from '../models/User';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/security';

const FAMILY_KEY_PREFIX = `${env.REDIS_KEY_PREFIX}auth:family:`;
const USER_FAMILIES_PREFIX = `${env.REDIS_KEY_PREFIX}auth:user_families:`;
const FAILED_LOGIN_PREFIX = `${env.REDIS_KEY_PREFIX}auth:failed:`;

export class SessionService {
  private redis = getRedisClient();

  async createSession(user: IUser, rememberMe = false): Promise<{ accessToken: string; refreshToken: string }> {
    const familyId = crypto.randomUUID();
    const version = 1;
    const ttlSeconds = rememberMe ? 30 * 24 * 3600 : 7 * 24 * 3600;

    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      familyId,
      version,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload, rememberMe);
    const tokenHash = hashToken(refreshToken);

    // Save session family in Redis
    const familyKey = `${FAMILY_KEY_PREFIX}${familyId}`;
    const sessionData = JSON.stringify({
      userId: user._id.toString(),
      version,
      tokenHash,
      createdAt: Date.now(),
    });

    await this.redis.set(familyKey, sessionData, 'EX', ttlSeconds);

    // Track family under user
    const userFamiliesKey = `${USER_FAMILIES_PREFIX}${user._id}`;
    const userFamiliesRaw = await this.redis.get(userFamiliesKey);
    const userFamilies: string[] = userFamiliesRaw ? JSON.parse(userFamiliesRaw) : [];
    userFamilies.push(familyId);
    await this.redis.set(userFamiliesKey, JSON.stringify(userFamilies), 'EX', 30 * 24 * 3600);

    return { accessToken, refreshToken };
  }

  async rotateRefreshToken(
    rawRefreshToken: string,
    rememberMe = false
  ): Promise<{ accessToken: string; refreshToken: string; user: IUser } | null> {
    try {
      const decoded = verifyRefreshToken(rawRefreshToken);
      if (!decoded.familyId || !decoded.userId || !decoded.version) {
        return null;
      }

      const familyKey = `${FAMILY_KEY_PREFIX}${decoded.familyId}`;
      const sessionRaw = await this.redis.get(familyKey);

      if (!sessionRaw) {
        // Family expired or already revoked
        return null;
      }

      const session = JSON.parse(sessionRaw);
      const incomingHash = hashToken(rawRefreshToken);

      // Check for token reuse!
      if (session.tokenHash !== incomingHash || session.version !== decoded.version) {
        console.warn(`🚨 Security Alert: Refresh token reuse detected for family ${decoded.familyId}. Revoking family.`);
        await this.revokeFamily(decoded.familyId);
        return null;
      }

      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'ACTIVE') {
        await this.revokeFamily(decoded.familyId);
        return null;
      }

      // Check if password changed after token issuance
      if (user.passwordChangedAt && decoded.iat && user.passwordChangedAt.getTime() > decoded.iat * 1000) {
        await this.revokeFamily(decoded.familyId);
        return null;
      }

      // Valid rotation: increment version
      const newVersion = session.version + 1;
      const ttlSeconds = rememberMe ? 30 * 24 * 3600 : 7 * 24 * 3600;

      const payload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        familyId: decoded.familyId,
        version: newVersion,
      };

      const newAccessToken = signAccessToken(payload);
      const newRefreshToken = signRefreshToken(payload, rememberMe);
      const newHash = hashToken(newRefreshToken);

      session.version = newVersion;
      session.tokenHash = newHash;
      session.rotatedAt = Date.now();

      await this.redis.set(familyKey, JSON.stringify(session), 'EX', ttlSeconds);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
    } catch (err) {
      return null;
    }
  }

  async revokeFamily(familyId: string): Promise<void> {
    const familyKey = `${FAMILY_KEY_PREFIX}${familyId}`;
    await this.redis.del(familyKey);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const userFamiliesKey = `${USER_FAMILIES_PREFIX}${userId}`;
    const userFamiliesRaw = await this.redis.get(userFamiliesKey);
    if (userFamiliesRaw) {
      const familyIds: string[] = JSON.parse(userFamiliesRaw);
      for (const fid of familyIds) {
        await this.revokeFamily(fid);
      }
      await this.redis.del(userFamiliesKey);
    }
  }

  async checkLockout(email: string, ip: string): Promise<{ isLocked: boolean; remainingSeconds: number }> {
    const accountKey = `${FAILED_LOGIN_PREFIX}account:${email.toLowerCase()}`;
    const ipKey = `${FAILED_LOGIN_PREFIX}ip:${ip}`;

    const [accountDataRaw, ipDataRaw] = await Promise.all([
      this.redis.get(accountKey),
      this.redis.get(ipKey),
    ]);

    const now = Date.now();
    let isLocked = false;
    let remainingSeconds = 0;

    if (accountDataRaw) {
      const data = JSON.parse(accountDataRaw);
      if (data.lockoutUntil && data.lockoutUntil > now) {
        isLocked = true;
        remainingSeconds = Math.max(remainingSeconds, Math.ceil((data.lockoutUntil - now) / 1000));
      }
    }

    if (ipDataRaw) {
      const data = JSON.parse(ipDataRaw);
      if (data.lockoutUntil && data.lockoutUntil > now) {
        isLocked = true;
        remainingSeconds = Math.max(remainingSeconds, Math.ceil((data.lockoutUntil - now) / 1000));
      }
    }

    return { isLocked, remainingSeconds };
  }

  async recordFailedLogin(email: string, ip: string): Promise<{ isLocked: boolean; remainingSeconds: number }> {
    const accountKey = `${FAILED_LOGIN_PREFIX}account:${email.toLowerCase()}`;
    const ipKey = `${FAILED_LOGIN_PREFIX}ip:${ip}`;
    const lockoutDurationSec = env.LOGIN_LOCKOUT_MINUTES * 60;
    const now = Date.now();

    // Update account failed attempts
    const accountRaw = await this.redis.get(accountKey);
    const account = accountRaw ? JSON.parse(accountRaw) : { attempts: 0, lockoutUntil: null };
    account.attempts += 1;

    let isLocked = false;
    let remainingSeconds = 0;

    if (account.attempts >= env.LOGIN_MAX_FAILED_ATTEMPTS) {
      account.lockoutUntil = now + lockoutDurationSec * 1000;
      isLocked = true;
      remainingSeconds = lockoutDurationSec;
    }
    await this.redis.set(accountKey, JSON.stringify(account), 'EX', lockoutDurationSec);

    // Update IP failed attempts
    const ipRaw = await this.redis.get(ipKey);
    const ipData = ipRaw ? JSON.parse(ipRaw) : { attempts: 0, lockoutUntil: null };
    ipData.attempts += 1;
    if (ipData.attempts >= env.LOGIN_MAX_FAILED_ATTEMPTS) {
      ipData.lockoutUntil = now + lockoutDurationSec * 1000;
      isLocked = true;
      remainingSeconds = Math.max(remainingSeconds, lockoutDurationSec);
    }
    await this.redis.set(ipKey, JSON.stringify(ipData), 'EX', lockoutDurationSec);

    return { isLocked, remainingSeconds };
  }

  async clearFailedLogin(email: string, ip: string): Promise<void> {
    const accountKey = `${FAILED_LOGIN_PREFIX}account:${email.toLowerCase()}`;
    const ipKey = `${FAILED_LOGIN_PREFIX}ip:${ip}`;
    await Promise.all([this.redis.del(accountKey), this.redis.del(ipKey)]);
  }
}

export const sessionService = new SessionService();
