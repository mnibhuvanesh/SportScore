import { ApiResponse } from '../types';
import {
  MOCK_USERS,
  MOCK_SPORTS,
  MOCK_TEAMS,
  MOCK_VENUES,
  MOCK_TOURNAMENTS,
  MOCK_AUDIT_LOGS,
} from './mockData';

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function subscribeTokenRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

export class ApiError extends Error {
  code: string;
  details?: any;
  remainingSeconds?: number;
  status: number;

  constructor(status: number, message: string, code = 'API_ERROR', details?: any, remainingSeconds?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.remainingSeconds = remainingSeconds;
  }
}

// Fallback mock responder for static environments like Vercel
function handleMockFallback<T>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  const cleanEndpoint = endpoint.replace(/^\/api\/v1/, '').split('?')[0];

  // Auth: Login
  if (cleanEndpoint === '/auth/login' && method === 'POST') {
    let body: any = {};
    try {
      body = JSON.parse(options.body as string);
    } catch {
      // ignore
    }
    const email = (body.email || '').toLowerCase().trim();
    const matchedUser = MOCK_USERS.find((u) => u.email.toLowerCase() === email) || {
      _id: `usr_${Date.now()}`,
      name: 'Bhuvanesh Saminathan',
      email: email || 'admin@sportsplatform.edu',
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('sportscore_session_user', JSON.stringify(matchedUser));
    return { user: matchedUser } as unknown as T;
  }

  // Auth: Me
  if (cleanEndpoint === '/auth/me') {
    const saved = localStorage.getItem('sportscore_session_user');
    if (saved) {
      try {
        return { user: JSON.parse(saved) } as unknown as T;
      } catch {
        // ignore
      }
    }
    return { user: null } as unknown as T;
  }

  // Auth: Logout
  if (cleanEndpoint === '/auth/logout') {
    localStorage.removeItem('sportscore_session_user');
    return { success: true } as unknown as T;
  }

  // Users
  if (cleanEndpoint === '/users') {
    return { users: MOCK_USERS, pagination: { total: MOCK_USERS.length, page: 1, limit: 10 } } as unknown as T;
  }

  // Tournaments
  if (cleanEndpoint === '/tournaments' || cleanEndpoint.includes('/tournaments')) {
    return {
      tournaments: MOCK_TOURNAMENTS,
      tournament: MOCK_TOURNAMENTS[0],
      pagination: { total: MOCK_TOURNAMENTS.length, page: 1, limit: 10 },
    } as unknown as T;
  }

  // Teams
  if (cleanEndpoint === '/teams' || cleanEndpoint.includes('/teams')) {
    return { teams: MOCK_TEAMS, team: MOCK_TEAMS[0] } as unknown as T;
  }

  // Venues
  if (cleanEndpoint === '/venues' || cleanEndpoint.includes('/venues')) {
    return { venues: MOCK_VENUES, venue: MOCK_VENUES[0] } as unknown as T;
  }

  // Sports
  if (cleanEndpoint === '/sports' || cleanEndpoint.includes('/sports')) {
    return { sports: MOCK_SPORTS } as unknown as T;
  }

  // Audit logs
  if (cleanEndpoint.includes('/audit-logs')) {
    return { logs: MOCK_AUDIT_LOGS } as unknown as T;
  }

  // Generic fallback
  return {
    success: true,
    data: [],
    users: MOCK_USERS,
    tournaments: MOCK_TOURNAMENTS,
    teams: MOCK_TEAMS,
    venues: MOCK_VENUES,
    pagination: { total: 0, page: 1, limit: 10 },
  } as unknown as T;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `/api/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);

    // If server returned 401 Unauthorized, try refresh logic
    if (res.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (refreshRes.ok) {
            isRefreshing = false;
            onRefreshed(true);
            return apiRequest<T>(endpoint, options, true);
          } else {
            isRefreshing = false;
            onRefreshed(false);
          }
        } catch {
          isRefreshing = false;
          onRefreshed(false);
        }
      }
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/csv')) {
      return (await res.text()) as unknown as T;
    }

    // Check if the response is valid JSON from our backend
    if (contentType.includes('application/json')) {
      const data: ApiResponse<T> = await res.json();
      if (!res.ok || !data.success) {
        throw new ApiError(
          res.status,
          data.error?.message || 'An error occurred',
          data.error?.code || 'UNKNOWN_ERROR',
          data.error?.details,
          data.error?.remainingSeconds
        );
      }
      return data.data as T;
    }

    // If we received HTML or non-JSON (typical on static deployments like Vercel without a proxy)
    return handleMockFallback<T>(endpoint, options);
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    // Network failure (e.g. backend host not running) -> Fallback seamlessly to mock data
    return handleMockFallback<T>(endpoint, options);
  }
}
