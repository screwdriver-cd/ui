import { getSession, sessionFromToken } from '~/auth/session';

const b64 = (value: object) =>
  btoa(JSON.stringify(value))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

export interface TokenClaims {
  username?: string;
  scope?: string[];
  scmContext?: string;
}

/** An unsigned JWT: the UI only decodes it. */
export const makeToken = (claims: TokenClaims = {}) =>
  `${b64({ alg: 'none' })}.${b64({
    username: 'batman',
    scope: ['user'],
    scmContext: 'github:github.com',
    ...claims
  })}.x`;

/** Signs in as batman (a github.com user) unless `claims` say otherwise. */
export function signIn(claims: TokenClaims = {}) {
  getSession().set(sessionFromToken(makeToken(claims)));
}

export const signOut = () => getSession().set(null);
