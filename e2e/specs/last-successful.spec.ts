import { makeBuilds } from '../support/mocks/builds';
import { PIPELINE_ID } from '../support/mocks/pipeline';
import { EventFeed } from '../support/event-feed';
import { EventRail } from '../support/pages/event-rail';
import { expect, test } from '../support/app';
import { REACT_ONLY } from '../support/ember';
import type { RouteTable } from '../support/route-table';

// Ember v2 only badges the card; the jump buttons are new in React.

const eventUrl = (id: number) => `/v2/pipelines/${PIPELINE_ID}/events/${id}`;
const card = (rail: EventRail, id: number) => rail.cards.filter({ hasText: `Event: ${id}` }).first();

/** A feed still running, so no card in view takes the badge from the API's answer. */
function runningFeed(api: RouteTable, count: number) {
  new EventFeed(count).register(api);
  api.get('/events/:id/builds', req => [
    200,
    makeBuilds(Number(req.params.id)).map((build, i) => ({
      ...build,
      id: Number(req.params.id) * 100 + i,
      status: 'RUNNING'
    }))
  ]);
}

test.describe('rail jumps', REACT_ONLY, () => {
  test('Last successful opens an event outside the loaded window', async ({ page, api }) => {
    runningFeed(api, 60);
    api.get('/pipelines/:id/lastSuccessfulEvent', () => [200, { id: 12 }]);
    await page.goto(eventUrl(60));
    const rail = new EventRail(page);

    await expect.poll(() => rail.highlightedId()).toBe(60);
    await page.locator('#last-successful-event-button').click();

    await expect(page).toHaveURL(new RegExp('/events/12$'));
    await expect.poll(() => rail.highlightedId()).toBe(12);
    await expect(card(rail, 12).locator('.last-successful')).toBeVisible();
    await expect(page.locator('#last-successful-event-button')).toHaveAttribute('aria-current', 'page');
  });

  test('Latest commit opens the newest event of the branch head', async ({ page, api }) => {
    runningFeed(api, 60);
    api.get('/pipelines/:id/latestCommitEvent', () => [200, { id: 40, sha: (40).toString(16).padStart(40, '0') }]);
    await page.goto(eventUrl(60));
    const rail = new EventRail(page);

    await expect.poll(() => rail.highlightedId()).toBe(60);
    await page.locator('#latest-commit-event-button').click();

    await expect(page).toHaveURL(new RegExp('/events/40$'));
    await expect.poll(() => rail.highlightedId()).toBe(40);
  });

  test('are hidden when the API has no such event', async ({ page, api }) => {
    runningFeed(api, 5);
    api.get('/pipelines/:id/lastSuccessfulEvent', () => [404, { message: 'Successful event does not exist' }]);
    api.get('/pipelines/:id/latestCommitEvent', () => [404, { message: 'Event does not exist' }]);
    await page.goto(eventUrl(5));

    await expect.poll(() => new EventRail(page).highlightedId()).toBe(5);
    await expect(page.locator('#last-successful-event-button')).toHaveCount(0);
    await expect(page.locator('#latest-commit-event-button')).toHaveCount(0);
  });
});

test('a newer event that succeeds in view takes the Last successful badge', REACT_ONLY, async ({ page, api }) => {
  // Every feed build is SUCCESS, so event 60 succeeds once its card has its builds.
  new EventFeed(60).register(api);
  api.get('/pipelines/:id/lastSuccessfulEvent', () => [200, { id: 58 }]);
  await page.goto(eventUrl(60));
  const rail = new EventRail(page);

  await expect(card(rail, 60).locator('.last-successful')).toBeVisible();
  await expect(rail.root.locator('.last-successful')).toHaveCount(1);
  await expect(page.locator('#last-successful-event-button')).toHaveAttribute('href', new RegExp('/events/60$'));
});
