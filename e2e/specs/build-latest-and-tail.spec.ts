import { expect, test } from '../support/app';
import { BUILD_ID, BUILD_URL, registerBuild } from '../support/fixtures';
import { REACT_ONLY } from '../support/ember';

test.describe('job latest build route', () => {
  test('/pipelines/:id/jobs/:name lands on the latest build, with the status filter', async ({ page, api }) => {
    registerBuild(api);
    api.get('/pipelines/4/jobs/:name/latestBuild', () => [200, { id: BUILD_ID }]);

    await page.goto('/pipelines/4/jobs/main?status=failure');
    await expect(page).toHaveURL(new RegExp(`/pipelines/4/builds/${BUILD_ID}/steps/install$`));
    expect(api.requests(/\/latestBuild$/)[0]?.query).toEqual({ status: 'FAILURE' });
  });

  test('keeps the step when the URL names one', async ({ page, api }) => {
    registerBuild(api);
    api.get('/pipelines/4/jobs/:name/latestBuild', () => [200, { id: BUILD_ID }]);

    await page.goto('/pipelines/4/jobs/main/steps/test');
    await expect(page).toHaveURL(new RegExp(`/pipelines/4/builds/${BUILD_ID}/steps/test$`));
  });

  test('says so when the job has no build', REACT_ONLY, async ({ page, api }) => {
    api.get('/pipelines/4/jobs/:name/latestBuild', () => [404, { message: 'none' }]);
    await page.goto('/pipelines/4/jobs/ghost');
    await expect(page.getByText('No build found for job ghost.')).toBeVisible();
  });

  test('the v1 pipeline URL redirects to the v2 events page', async ({ page, api }) => {
    api.get('/pipelines/4', () => [200, { id: 4, name: 'p', state: 'ACTIVE', scmRepo: { name: 'o/r', branch: 'main', url: 'https://example.test/o/r' } }]);
    api.get('/pipelines/4/jobs', () => [200, []]);
    api.get('/pipelines/4/events', () => [200, []]);
    api.get('/pipelines/4/stages', () => [200, []]);
    api.get('/pipelines/4/triggers', () => [200, []]);
    api.get('/banners', () => [200, []]);
    api.get('/users/settings', () => [200, {}]);
    await page.goto('/pipelines/4');
    await expect(page).toHaveURL(/\/v2\/pipelines\/4\/events$/);
  });
});

test.describe('tail-first logs', () => {
  const TOTAL = 6000;

  test('a long finished step opens at its tail and pages upward without refetching', REACT_ONLY, async ({ page, api }) => {
    registerBuild(api, { lines: TOTAL });
    api.get('/builds/:id/steps/:step/logs', ({ queryParams }) => {
      const from = Number(queryParams.from ?? 0);
      const to = Math.min(TOTAL, from + Number(queryParams.pages ?? 1) * 100);

      return [200, Array.from({ length: Math.max(0, to - from) }, (_, i) => ({ t: 1577872800000 + (from + i) * 1000, m: `log line ${from + i}`, n: from + i }))];
    });

    await page.goto(BUILD_URL);
    await expect(page.getByText(`log line ${TOTAL - 1}`)).toBeVisible();

    const first = api.requests(/\/steps\/install\/logs$/);

    expect(first.map(r => Number(r.query.from))).toEqual([TOTAL - 1000]);

    await page.getByRole('button', { name: 'Load earlier lines' }).click();
    await expect.poll(() => api.requests(/\/steps\/install\/logs$/).length).toBe(2);
    expect(Number(api.requests(/\/steps\/install\/logs$/)[1]?.query.from)).toBe(TOTAL - 2000);

    await page.getByRole('button', { name: 'Go to top' }).click();
    await expect(page.getByText('log line 0', { exact: true })).toBeVisible();
    const froms = api.requests(/\/steps\/install\/logs$/).map(r => Number(r.query.from));

    expect(new Set(froms).size).toBe(froms.length);
    await expect(page.getByTestId('log-earlier')).toHaveCount(0);
  });
});
