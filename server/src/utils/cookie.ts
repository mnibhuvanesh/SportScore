import { Response, CookieOptions } from 'express';
import { env } from '../config/env';

export const ACCESS_COOKIE_NAME = 'access_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';

export function getCookieOptions(maxAgeMs?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    sameSite: env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none',
    domain: env.NODE_ENV === 'production' ? env.COOKIE_DOMAIN : undefined,
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  rememberMe = false
): void {
  // Access token: 15 minutes
  const accessMaxAge = 15 * 60 * 1000;
  // Refresh token: 7 days or 30 days
  const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

  res.cookie(ACCESS_COOKIE_NAME, accessToken, getCookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(refreshMaxAge));
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE_NAME, getCookieOptions());
  res.clearCookie(REFRESH_COOKIE_NAME, getCookieOptions());
}
