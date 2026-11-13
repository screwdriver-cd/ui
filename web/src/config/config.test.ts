import { readConfig } from './config';

describe('readConfig', () => {
  it('defaults to a local API and store, with the standard reload timers', () => {
    expect(readConfig()).toMatchObject({
      apiHost: 'http://localhost:8080',
      apiNamespace: 'v4',
      storeHost: 'http://localhost:8081',
      storeNamespace: 'v1',
      buildReloadTimer: 5000,
      eventReloadTimer: 60000,
      logReloadTimer: 3000,
      showAvatar: true,
      rootURL: '/'
    });
  });

  it('applies supplementary overrides with type coercion', () => {
    const cfg = readConfig({
      SDAPI_HOSTNAME: 'https://api.example.com',
      EVENT_RELOAD_TIMER: '500',
      BUILD_RELOAD_TIMER: 'not-a-number',
      SHOW_AVATAR: 'false',
      ROOT_URL: '/sd/'
    });

    expect(cfg.apiHost).toBe('https://api.example.com');
    expect(cfg.eventReloadTimer).toBe(500);
    expect(cfg.buildReloadTimer).toBe(5000);
    expect(cfg.showAvatar).toBe(false);
    expect(cfg.rootURL).toBe('/sd');
  });
});
