import { getSession, isTokenExpired, SESSION_STORAGE_KEY, sessionFromToken } from './session';

const jwt = (claims: object) => `h.${btoa(JSON.stringify(claims))}.s`;

describe('session', () => {
  it('treats a token without exp as not expired', () => {
    expect(isTokenExpired(jwt({ username: 'u', scope: ['user'] }))).toBe(false);
  });

  it('expires tokens whose exp is in the past', () => {
    const exp = Math.floor(Date.now() / 1000) - 10;

    expect(isTokenExpired(jwt({ username: 'u', scope: ['user'], exp }))).toBe(true);
  });

  it('marks guests and defaults their scmContext', () => {
    expect(sessionFromToken(jwt({ username: 'guest/x', scope: ['guest'] }))).toMatchObject({
      isGuest: true,
      scmContext: 'guest'
    });
  });

  // Signed-in users keep their session across the switch from Ember because both apps read this shape.
  it('persists in the ember-simple-auth storage shape', () => {
    const token = jwt({ username: 'u', scope: ['user'], scmContext: 'github:github.com' });

    getSession().set(sessionFromToken(token));

    const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) as string);

    expect(stored.authenticated).toMatchObject({
      authenticator: 'authenticator:screwdriver-api',
      username: 'u',
      token
    });

    getSession().set(null);
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) as string)).toEqual({
      authenticated: {}
    });
  });
});
