import { jwtDecode } from 'jwt-decode';
import { create } from 'zustand';
import { apiBase } from '~/config/config';

/**
 * The stored shape is deliberately the one ember-simple-auth wrote
 * (`localStorage['ember_simple_auth-session'] = {authenticated: {...}}`), so
 * users who are logged in when this UI replaces the Ember one stay logged in.
 */
export const SESSION_STORAGE_KEY = 'ember_simple_auth-session';
const AUTHENTICATOR = 'authenticator:screwdriver-api';

export interface SessionData {
  username: string;
  scope: string[];
  scmContext?: string;
  isGuest: boolean;
  token: string;
}

interface JwtClaims {
  username: string;
  scope: string[];
  scmContext?: string;
  exp?: number;
}

export function sessionFromToken(token: string): SessionData {
  const decoded = jwtDecode<JwtClaims>(token);
  const isGuest = decoded.scope.includes('guest');

  return {
    username: decoded.username,
    scope: decoded.scope,
    scmContext: isGuest ? decoded.scmContext || 'guest' : decoded.scmContext,
    isGuest,
    token
  };
}

/** Same rule as the Ember authenticator: a token without `exp` never expires. */
export function isTokenExpired(token: string, now = Date.now()): boolean {
  const { exp } = jwtDecode<JwtClaims>(token);

  return (exp as number) * 1000 < now;
}

function readStored(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    const token = raw ? JSON.parse(raw)?.authenticated?.token : null;

    if (!token || isTokenExpired(token)) {
      return null;
    }

    return sessionFromToken(token);
  } catch {
    return null;
  }
}

function writeStored(data: SessionData | null) {
  try {
    if (data) {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ authenticated: { authenticator: AUTHENTICATOR, ...data } })
      );
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ authenticated: {} }));
    }
  } catch {
    // storage unavailable: the session just lasts for this page load
  }
}

interface SessionState {
  data: SessionData | null;
  isAuthenticated: boolean;
  set: (data: SessionData | null) => void;
}

export const useSession = create<SessionState>(set => {
  const initial = readStored();

  return {
    data: initial,
    isAuthenticated: initial !== null,
    set: data => {
      writeStored(data);
      set({ data, isAuthenticated: data !== null });
    }
  };
});

export const getSession = () => useSession.getState();
export const getToken = () => useSession.getState().data?.token;

// Another tab logged in or out.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key === SESSION_STORAGE_KEY) {
      const data = readStored();

      useSession.setState({ data, isAuthenticated: data !== null });
    }
  });
}

async function fetchToken(): Promise<SessionData> {
  const response = await fetch(`${apiBase()}/auth/token`, { credentials: 'include' });

  if (!response.ok) {
    throw new Error('Could not get a token');
  }

  const { token } = await response.json();

  return sessionFromToken(token);
}

/**
 * Opens the SCM login popup and, once it closes, exchanges the API cookie
 * for a JWT (same flow as the Ember authenticator).
 */
export function login(scmContext?: string): Promise<SessionData> {
  const url = [`${apiBase()}/auth/login`, ...(scmContext ? [scmContext] : []), 'web'].join('/');
  const win = window.open(url, 'SDAuth', 'width=1024,height=768,resizable,alwaysRaised');

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (win === null || win.closed) {
        clearInterval(interval);
        fetchToken().then(data => {
          getSession().set(data);
          resolve(data);
        }, reject);
      } else {
        win.focus();
      }
    }, 100);
  });
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${apiBase()}/auth/logout`, { method: 'POST', credentials: 'include' });
  } finally {
    getSession().set(null);
  }
}
