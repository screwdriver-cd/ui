import { shouldNotify } from './notify';

describe('shouldNotify', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('notifies when a running event finishes and the user allowed it', () => {
    vi.stubGlobal('Notification', { permission: 'granted' });
    expect(shouldNotify('RUNNING', 'SUCCESS', true)).toBe(true);
    expect(shouldNotify('QUEUED', 'FAILURE', true)).toBe(true);
  });

  it('stays quiet without the preference, permission or a running start', () => {
    vi.stubGlobal('Notification', { permission: 'granted' });
    expect(shouldNotify('RUNNING', 'SUCCESS', false)).toBe(false);
    expect(shouldNotify(undefined, 'SUCCESS', true)).toBe(false);
    expect(shouldNotify('SUCCESS', 'FAILURE', true)).toBe(false);
    expect(shouldNotify('RUNNING', 'WARNING', true)).toBe(false);
    vi.stubGlobal('Notification', { permission: 'denied' });
    expect(shouldNotify('RUNNING', 'SUCCESS', true)).toBe(false);
  });
});
