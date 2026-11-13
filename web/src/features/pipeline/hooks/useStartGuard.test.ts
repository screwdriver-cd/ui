import { scmToSignIn } from './useStartGuard';

const contexts = [
  { context: 'github:github.com', displayName: 'github.com' },
  { context: 'github:target.example', displayName: 'Target' },
  { context: 'gitlab:read.example', displayName: 'Read only', readOnly: true }
];

describe('scmToSignIn', () => {
  it('needs nothing when signed in to the pipeline SCM, signed out, or the SCM is unknown', () => {
    expect(scmToSignIn('github:github.com', 'github:github.com', contexts)).toBeNull();
    expect(scmToSignIn('github:target.example', undefined, contexts)).toBeNull();
    expect(scmToSignIn(undefined, 'github:github.com', contexts)).toBeNull();
  });

  it('names the SCM to sign in to, falling back to its context', () => {
    expect(scmToSignIn('github:target.example', 'github:github.com', contexts)).toBe('Target');
    expect(scmToSignIn('github:other.example', 'github:github.com', contexts)).toBe(
      'github:other.example'
    );
  });

  it('lets read-only SCMs start with any login', () => {
    expect(scmToSignIn('gitlab:read.example', 'github:github.com', contexts)).toBeNull();
  });
});
