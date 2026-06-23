const TOKEN_KEY = 'bilimdon_token';

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

let token: string | null = readStoredToken();

export function getToken(): string | null {
  return token;
}

/** Persists the token. `remember=true` (default) survives browser restarts via
 * localStorage; `remember=false` keeps it in sessionStorage so it's gone once the
 * tab closes — this is what the login screen's "Eslab qolish" checkbox controls. */
export function setToken(next: string | null, remember = true) {
  token = next;
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  if (next) {
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, next);
  }
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    let body: { error?: { code?: string; message?: string } } | null = null;
    try {
      body = await res.json();
    } catch {
      // non-JSON error body, fall through to generic message
    }
    throw new ApiError(res.status, body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? 'Xatolik yuz berdi');
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
};
