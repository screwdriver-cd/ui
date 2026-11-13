import { apiBase, storeBase } from '~/config/config';
import { getSession, getToken } from '~/auth/session';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
    message?: string
  ) {
    super(message ?? `Request failed with status ${status}`);
  }

  get isNotFound() {
    return this.status === 404;
  }
}

type QueryValue = string | number | boolean | null | undefined | Array<string | number>;
export type Query = Record<string, QueryValue>;

export interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** `store` talks to the artifact store instead of the API. */
  host?: 'api' | 'store';
  /** Return the Response's text instead of parsing JSON (build logs). */
  raw?: boolean;
  signal?: AbortSignal;
}

/** `ids[]=1&ids[]=2` for arrays, like jQuery.param did for the Ember app. */
export function toSearch(query: Query = {}): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach(item => params.append(`${key}[]`, String(item)));
    } else {
      params.append(key, String(value));
    }
  }

  const search = params.toString();

  return search ? `?${search}` : '';
}

export async function request<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  { query, body, host = 'api', raw = false, signal }: RequestOptions = {}
): Promise<T> {
  const token = getToken();
  const base = host === 'store' ? storeBase() : apiBase();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
  }

  const response = await fetch(`${base}${path}${toSearch(query)}`, {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
    signal
  });

  const text = await response.text();

  if (!response.ok) {
    let parsed: unknown = text;

    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      // keep the text body
    }

    // Only the token that was refused: another tab may have renewed the session meanwhile.
    if (response.status === 401 && token && getToken() === token) {
      getSession().set(null);
    }

    const message = (parsed as { message?: string } | undefined)?.message;

    throw new ApiError(response.status, parsed, message);
  }

  if (raw) {
    return text as T;
  }

  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T = unknown>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, options)
};
