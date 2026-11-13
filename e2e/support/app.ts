import { test as base, expect, type Page } from '@playwright/test';
import { mockEvents } from './mocks/events';
import { buildRoutes, eventRoutes, noBanners, pipelineRoutes, userSettingRoute } from './mocks/routes';
import { type Session, userJwtSession } from './sessions';
import { RouteTable } from './route-table';

// Matches config/environment.js defaults (also what a React dev build reads
// from public/assets/supplementary_config.js).
export const API_BASE = 'http://localhost:8080/v4';

interface Fixtures {
  api: RouteTable;
  /** Extra SUPPLEMENTARY_CONFIG keys, e.g. `{ EVENT_RELOAD_TIMER: 500 }`. */
  appConfig: Record<string, unknown>;
  /** Authenticated by default. Use `test.use({ session: null })` for logged out. */
  session: Session | null;
}

async function seedSession(page: Page, session: Session | null) {
  await page.addInitScript(
    ([data]) => {
      // Only seed once so reloads inside a test keep whatever the app wrote.
      if (!sessionStorage.getItem('e2e-seeded')) {
        sessionStorage.setItem('e2e-seeded', '1');
        if (data) {
          localStorage.setItem(
            'ember_simple_auth-session',
            JSON.stringify({
              authenticated: {
                authenticator: 'authenticator:screwdriver-api',
                ...data
              }
            })
          );
        }
      }
    },
    [session]
  );
}

/**
 * Endpoints the app calls that the routes copied from the Ember app's Pretender mocks never
 * covered (Pretender silently let unhandled requests through).
 */
function gapRoutes(api: RouteTable) {
  api.get('/auth/contexts', () => [
    200,
    [{ context: 'github:github.com', displayName: 'github.com' }]
  ]);
  api.get('/pipelines/:id/lastSuccessfulEvent', () => [200, mockEvents[0]]);
  // Ember's user-settings routes and create page load these up front and render
  // nothing when they are unmocked; the React app fetches them lazily.
  api.get('/tokens', () => [200, []]);
  // The pipeline header's "Add to collection" dropdown loads the user's collections.
  api.get('/collections', () => [200, []]);
  api.get('/templates', () => [200, []]);
}

export const test = base.extend<Fixtures>({
  session: [userJwtSession, { option: true }],
  appConfig: [{}, { option: true }],

  // auto: every test gets the mocks and session, even if it doesn't name `api`.
  api: [async ({ page, session, appConfig }, use) => {
    const api = new RouteTable(API_BASE);

    noBanners(api);
    userSettingRoute(api);
    pipelineRoutes(api);
    eventRoutes(api);
    buildRoutes(api);
    gapRoutes(api);

    // Same hook nginx uses in production, so the harness controls the API
    // host on any build regardless of config/local.js or the build defaults.
    await page.route('**/assets/supplementary_config.js', route =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `window.SUPPLEMENTARY_CONFIG = ${JSON.stringify({
          SDAPI_HOSTNAME: 'http://localhost:8080',
          SDAPI_NAMESPACE: 'v4',
          SDSTORE_HOSTNAME: 'http://localhost:8081',
          SDSTORE_NAMESPACE: 'v1',
          ...appConfig
        })};`
      })
    );
    await api.attach(page);
    await seedSession(page, session);
    await use(api);

    const unmocked = api.log.filter(entry => !entry.matched);

    expect(
      unmocked,
      `unmocked API calls:\n${unmocked.map(e => `${e.method} ${e.path}`).join('\n')}`
    ).toEqual([]);
  }, { auto: true }]
});

export { expect };
