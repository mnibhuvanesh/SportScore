import { ApiResponse } from '../types';

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

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `/api/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const config: RequestInit = {
    ...options,
    credentials: 'include', // essential for httpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);

    // Handle 401 Unauthorized with silent token refresh coordination
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
            throw new ApiError(401, 'Session expired. Please sign in again.', 'SESSION_EXPIRED');
          }
        } catch (refreshErr) {
          isRefreshing = false;
          onRefreshed(false);
          throw new ApiError(401, 'Session expired. Please sign in again.', 'SESSION_EXPIRED');
        }
      } else {
        // Wait for current refresh to complete
        const refreshSuccess = await new Promise<boolean>((resolve) => {
          subscribeTokenRefresh(resolve);
        });

        if (refreshSuccess) {
          return apiRequest<T>(endpoint, options, true);
        } else {
          throw new ApiError(401, 'Session expired. Please sign in again.', 'SESSION_EXPIRED');
        }
      }
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      return (await res.text()) as unknown as T;
    }

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
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, err.message || 'Network error occurred', 'NETWORK_ERROR');
  }
}
