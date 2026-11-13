import { expect, test } from '../support/app';
import { REACT_ONLY } from '../support/ember';
import { BUILD_ID, BUILD_URL, registerBuild } from '../support/fixtures';

// Tail-first loading of a long log whose step is still running: a React addition.

const START = 6000;

test.use({ appConfig: { LOG_RELOAD_TIMER: 300 } });

test.describe('tail-first logs of a running step', REACT_ONLY, () => {
  test('opens at the tail, follows new lines, and leaves the reader alone after scrolling up', async ({ page, api }) => {
    let total = START;

    registerBuild(api);
    api.get('/builds/:id', () => [
      200,
      {
        id: BUILD_ID,
        jobId: 1,
        eventId: 5,
        sha: 'c96f36886e084d18bd068b8156d095cd9b31e1d6',
        status: 'RUNNING',
        createTime: '2020-01-01T09:59:00.000Z',
        startTime: '2020-01-01T10:00:00.000Z',
        steps: [{ name: 'install', startTime: '2020-01-01T10:00:00.000Z' }]
      }
    ]);
    api.get('/builds/:id/steps/:step/logs', ({ queryParams }) => {
      const from = Number(queryParams.from ?? 0);
      const to = Math.min(total, from + Number(queryParams.pages ?? 1) * 100);

      return [200, Array.from({ length: Math.max(0, to - from) }, (_, i) => ({ t: 1577872800000 + (from + i) * 1000, m: `log line ${from + i}`, n: from + i }))];
    });

    await page.goto(`${BUILD_URL}/steps/install`);
    await expect(page.getByText(`log line ${START - 1}`, { exact: true })).toBeVisible();

    const reads = () => api.requests(/\/steps\/install\/logs$/).map(r => Number(r.query.from));

    // Nothing below the probe threshold was read, in particular not line 0.
    expect(reads().every(from => from >= 2000)).toBe(true);
    await expect(page.getByTestId('log-earlier')).toBeVisible();

    // New output arrives and the view follows it.
    total += 50;
    await expect(page.getByText(`log line ${total - 1}`, { exact: true })).toBeVisible();

    // The reader scrolls up: later output must not pull the view back down.
    const scroller = page.getByTestId('log-scroll');

    await scroller.evaluate(el => {
      el.scrollTop = el.scrollHeight / 2;
    });
    await page.waitForTimeout(150);
    const before = await scroller.evaluate(el => el.scrollTop);

    total += 50;
    await expect.poll(() => reads().filter(from => from >= total - 50 - 100).length).toBeGreaterThan(2);
    await page.waitForTimeout(700);
    expect(await scroller.evaluate(el => el.scrollTop)).toBeGreaterThanOrEqual(before - 5);
    expect(await scroller.evaluate(el => el.scrollTop)).toBeLessThanOrEqual(before + 5);
    await expect(page.getByText(`log line ${total - 1}`, { exact: true })).not.toBeVisible();
  });
});
