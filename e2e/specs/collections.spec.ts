import { expect, test } from '../support/app';
import type { RouteTable } from '../support/route-table';

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 }
];

const pipelines = [
  { id: 101, name: 'screwdriver-cd/ui', scmRepo: { name: 'screwdriver-cd/ui', branch: 'main' }, scmContext: 'github:github.com' },
  { id: 102, name: 'screwdriver-cd/api', scmRepo: { name: 'screwdriver-cd/api', branch: 'main' }, scmContext: 'github:github.com' }
];
const defaultCollection = { id: 1, name: 'My Pipelines', type: 'default', description: '', pipelineIds: [101, 102], pipelines };

function mockCollections(api: RouteTable, list = [defaultCollection]) {
  api.get('/collections', () => [200, list.map(({ pipelines: _p, ...rest }) => rest)]);
  api.get('/collections/:id', req => {
    const found = list.find(c => `${c.id}` === req.params.id);

    return found ? [200, found] : [404, { message: 'not found' }];
  });
  api.get('/pipelines/:id/metrics', () => [200, []]);
  api.get('/pipelines/:id/events', () => [200, []]);
}

const noScroll = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (document.scrollingElement as Element).scrollHeight - window.innerHeight);

test.describe('collections and home', () => {
  test('/ lands on the default collection', async ({ page, api }) => {
    mockCollections(api);
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboards\/1$/);
    await expect(page.getByText('screwdriver-cd/ui').first()).toBeVisible();
  });

  test('/ goes to the last viewed collection', async ({ page, api }) => {
    mockCollections(api, [defaultCollection, { ...defaultCollection, id: 2, name: 'Team', type: 'normal' }]);
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('seeded-last')) {
        sessionStorage.setItem('seeded-last', '1');
        localStorage.setItem('lastViewedCollectionId', '2');
      }
    });
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboards\/2$/);
  });

  test('/dashboards goes to the newest collection, or search when there is none', async ({ page, api }) => {
    mockCollections(api, []);
    await page.goto('/dashboards');
    await expect(page).toHaveURL(/\/search$/);
  });

  test('a missing collection shows not found', async ({ page, api }) => {
    mockCollections(api);
    await page.goto('/dashboards/999');
    await expect(page).not.toHaveURL(/\/dashboards\/1$/);
  });

  test('the home page shows the hero when there is no collection to open', async ({ page, api }) => {
    api.get('/collections', () => [200, []]);
    await page.goto('/');
    await expect(page.getByText('Build. Test. Deliver.')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  for (const viewport of VIEWPORTS) {
    test(`the dashboard does not scroll the page at ${viewport.width}x${viewport.height}`, async ({ page, api }) => {
      const many = Array.from({ length: 60 }, (_v, i) => ({
        id: 1000 + i,
        name: `org/pipeline-${i}`,
        scmRepo: { name: `org/pipeline-${i}`, branch: 'main' },
        scmContext: 'github:github.com'
      }));

      mockCollections(api, [{ ...defaultCollection, pipelineIds: many.map(p => p.id), pipelines: many as never }]);
      await page.setViewportSize(viewport);
      await page.goto('/dashboards/1');
      await expect(page.getByText('org/pipeline-0', { exact: true }).first()).toBeVisible();
      expect(await noScroll(page)).toBeLessThanOrEqual(0);
    });
  }
});
