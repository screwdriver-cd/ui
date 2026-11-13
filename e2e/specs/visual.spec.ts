import type { Page } from '@playwright/test';
import { expect, test } from '../support/app';
import { registerTemplates } from '../support/fixtures';
import type { RouteTable } from '../support/route-table';
import { REACT_ONLY } from '../support/ember';

/**
 * Visual regression for the screens this suite owns, in English, Japanese and
 * the elongated pseudo-locale (en-XA). Opt-in: `E2E_VISUAL=1` (baselines are
 * per platform, see e2e/README.md). The overflow checks at the bottom run
 * whenever the visual suite is enabled and do not depend on baselines.
 */
const ENABLED = process.env.E2E_VISUAL === '1';
const LOCALES = ['en', 'ja', 'en-XA'] as const;
const FIXED_NOW = new Date('2024-03-15T12:00:00.000Z');

const pipelines = [
  { id: 101, name: 'screwdriver-cd/ui', scmRepo: { name: 'screwdriver-cd/ui', branch: 'main' }, scmContext: 'github:github.com' },
  { id: 102, name: 'screwdriver-cd/screwdriver-with-a-very-long-pipeline-name', scmRepo: { name: 'screwdriver-cd/screwdriver-with-a-very-long-pipeline-name', branch: 'feature/a-long-branch-name' }, scmContext: 'github:github.com' }
];
const collection = { id: 1, name: 'My Pipelines', type: 'default', description: 'Pipelines I care about', pipelineIds: [101, 102], pipelines };

const metrics = (status: string) => [
  { id: 1, createTime: '2024-03-14T09:30:00.000Z', status, duration: 754, sha: 'abcdef1234567', commit: { message: 'fix: keep it deterministic' } },
  { id: 2, createTime: '2024-03-13T09:30:00.000Z', status: 'success', duration: 640, sha: '1234567abcdef' }
];

function mockCollections(api: RouteTable) {
  api.get('/collections', () => [200, [{ ...collection, pipelines: undefined }]]);
  api.get('/collections/:id', () => [200, collection]);
  api.get('/pipelines/:id/metrics', req => [200, metrics(req.params.id === '101' ? 'success' : 'failure')]);
  api.get('/pipelines/:id/events', () => [200, []]);
}

const results = [1, 2, 3].map(i => ({
  id: 300 + i,
  name: `org/repo-${i}`,
  scmRepo: { name: `org/repo-${i}`, branch: 'main' },
  scmContext: 'github:github.com'
}));

const validResult = {
  errors: [],
  jobs: {
    main: [{ image: 'node:20', commands: [{ name: 'install', command: 'npm ci' }, { name: 'test', command: 'npm test' }] }],
    publish: [{ image: 'node:20', commands: [{ name: 'publish', command: 'npm publish' }] }]
  },
  workflowGraph: {
    nodes: [{ name: '~commit' }, { name: 'main' }, { name: 'publish' }],
    edges: [{ src: '~commit', dest: 'main' }, { src: 'main', dest: 'publish' }]
  }
};

interface Screen {
  name: string;
  path: string;
  signedOut?: boolean;
  prepare?: (api: RouteTable) => void;
  ready: (page: Page) => Promise<void>;
  act?: (page: Page) => Promise<void>;
}

const SCREENS: Screen[] = [
  {
    name: 'login',
    path: '/login',
    signedOut: true,
    ready: page => expect(page.getByRole('link', { name: /github\.com|GitHub|ｇｉｔ/i })).toBeVisible()
  },
  {
    name: 'dashboard',
    path: '/dashboards/1',
    prepare: mockCollections,
    ready: page => expect(page.locator('main').getByText('screwdriver-cd/ui').first()).toBeVisible()
  },
  {
    name: 'search',
    path: '/search?query=repo',
    prepare: api => {
      api.get('/collections', () => [200, []]);
      api.get('/pipelines', () => [200, results]);
    },
    ready: page => expect(page.getByText('org/repo-3')).toBeVisible()
  },
  {
    name: 'validator',
    path: '/validator',
    prepare: api => api.post('/validator', () => [200, validResult]),
    act: async page => {
      await page.locator('.cm-content').click();
      await page.keyboard.type('jobs:');
    },
    ready: page => expect(page.getByText('npm publish')).toBeVisible()
  },
  {
    name: 'user-settings',
    path: '/user-settings/preferences',
    prepare: api => api.get('/users/settings', () => [200, { displayJobNameLength: 30, timestampFormat: 'UTC' }]),
    ready: page => expect(page.locator('select[aria-labelledby="pref-timestamp"]')).toHaveValue('UTC')
  },
  {
    name: 'templates',
    path: '/templates/job',
    prepare: registerTemplates,
    ready: page => expect(page.getByText('publish', { exact: true })).toBeVisible()
  },
  {
    name: 'jobs',
    path: '/v2/pipelines/4/jobs',
    ready: page => expect(page.locator('#jobs-page-table tr[data-job="main"]')).toBeVisible()
  }
];

const withLocale = (path: string, locale: string) => `${path}${path.includes('?') ? '&' : '?'}locale=${locale}`;

async function open(page: Page, api: RouteTable, screen: Screen, locale: string) {
  screen.prepare?.(api);
  // Dates ("last run", "2 days ago") must not depend on when the suite runs.
  await page.clock.setFixedTime(FIXED_NOW);
  await page.goto(withLocale(screen.path, locale));
  await screen.act?.(page);
  await screen.ready(page);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
}

test.describe('visual regression', REACT_ONLY, () => {
  test.skip(!ENABLED, 'set E2E_VISUAL=1 to run (see e2e/README.md)');

  for (const screen of SCREENS) {
    test.describe(screen.name, () => {
      if (screen.signedOut) {
        test.use({ session: null });
      }
      test.use({ timezoneId: 'UTC', viewport: { width: 1280, height: 720 } });

      for (const locale of LOCALES) {
        test(`${screen.name} (${locale})`, async ({ page, api }) => {
          await open(page, api, screen, locale);
          await expect(page).toHaveScreenshot(`${screen.name}-${locale}.png`, {
            animations: 'disabled',
            caret: 'hide',
            maxDiffPixelRatio: 0.002,
            mask: [page.locator('.cm-cursor, .cm-cursorLayer')]
          });
        });
      }
    });
  }
});

test.describe('no horizontal overflow in Japanese and pseudo-locale layouts', REACT_ONLY, () => {
  test.skip(!ENABLED, 'part of the visual suite: set E2E_VISUAL=1');

  for (const screen of SCREENS) {
    test.describe(screen.name, () => {
      if (screen.signedOut) {
        test.use({ session: null });
      }
      test.use({ timezoneId: 'UTC' });

      for (const locale of ['ja', 'en-XA'] as const) {
        for (const width of [1280, 1024]) {
          test(`${screen.name} (${locale}) fits ${width}px`, async ({ page, api }) => {
            await page.setViewportSize({ width, height: 720 });
            await open(page, api, screen, locale);

            const { page: pageOverflow, offenders } = await page.evaluate(() => {
              const root = document.documentElement;
              const limit = window.innerWidth;
              // Anything poking out of the viewport that is not inside a deliberate scroll region.
              const scrollers = (el: Element | null) => {
                for (let node = el; node && node !== document.body; node = node.parentElement) {
                  const overflowX = getComputedStyle(node).overflowX;

                  if (['auto', 'scroll'].includes(overflowX)) {
                    return true;
                  }
                }

                return false;
              };
              const out = [...document.querySelectorAll('body *')]
                .filter(el => {
                  const rect = el.getBoundingClientRect();

                  return rect.width > 0 && rect.right > limit + 1 && !scrollers(el.parentElement);
                })
                .slice(0, 5)
                .map(el => `${el.tagName.toLowerCase()}.${(el as HTMLElement).className}`.slice(0, 80));

              return { page: root.scrollWidth - limit, offenders: out };
            });

            expect(pageOverflow, 'document is wider than the viewport').toBeLessThanOrEqual(0);
            expect(offenders, 'elements outside the viewport').toEqual([]);
          });
        }
      }
    });
  }
});
