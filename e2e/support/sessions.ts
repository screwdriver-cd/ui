export interface Session {
  username: string;
  scope: string[];
  isGuest: boolean;
  scmContext: string;
  token: string;
}

const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

// The React app decodes the token's claims (the signature is never checked); Ember reads the
// stored fields.
const session = (username: string, scmContext: string, scope: string[]): Session => ({
  username,
  scope,
  isGuest: scope.includes('guest'),
  scmContext,
  token: `e30.${b64url({ username, scmContext, scope })}.sig`
});

/** The default signed-in user, logged in to the mock pipeline's SCM (`github:github.com`). */
export const userJwtSession = session('test', 'github:github.com', ['user']);

/** The same user logged in to another SCM, so starting the mock pipeline is blocked. */
export const otherScmSession = session('test', 'test:github.com', ['user']);

export const guestJwtSession = session('guest/user', 'guest', ['guest']);
