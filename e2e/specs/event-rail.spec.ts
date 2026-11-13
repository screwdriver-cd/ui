import { PIPELINE_ID } from '../support/mocks/pipeline';
import { EventFeed } from '../support/event-feed';
import { EventRail } from '../support/pages/event-rail';
import { expect, test } from '../support/app';
import type { RequestLogEntry } from '../support/route-table';
import { REACT_ONLY } from '../support/ember';

const BATCH = 10;
const eventUrl = (id: number) => `/v2/pipelines/${PIPELINE_ID}/events/${id}`;
const isEventList = (e: RequestLogEntry) => /^\/pipelines\/\d+\/events$/.test(e.path);

/** Every rendered window must be a gap-free, duplicate-free run of ids. */
function expectContiguous(snapshots: number[][], descending = true) {
  for (const ids of snapshots) {
    ids.slice(1).forEach((id, i) => {
      expect(id, `ids ${ids.join(',')}`).toBe(ids[i] + (descending ? -1 : 1));
    });
  }
}

test.describe('event rail', () => {
  test('selecting a visible card keeps the rail mounted and fetches no new event pages', REACT_ONLY, async ({ page, api }) => {
    new EventFeed(60).register(api);
    await page.goto(eventUrl(30));
    const rail = new EventRail(page);

    await expect.poll(() => rail.highlightedId()).toBe(30);
    // Tag the live scroller: a remount would replace the node and lose the tag.
    await rail.scroller.evaluate(el => el.setAttribute('data-test-mounted', '1'));
    const listsBefore = api.log.filter(isEventList).length;

    await rail.cards.filter({ hasText: 'Event: 29' }).first().click();
    await expect(page).toHaveURL(new RegExp('/events/29$'));
    await expect.poll(() => rail.highlightedId()).toBe(29);

    await expect(rail.scroller).toHaveAttribute('data-test-mounted', '1');
    expect(api.log.filter(isEventList).length).toBe(listsBefore);
  });

  test('a deep link loads the neighbours around the event and highlights it', async ({ page, api }) => {
    new EventFeed(60).register(api);
    await page.goto(eventUrl(30));
    const rail = new EventRail(page);

    await expect.poll(() => rail.highlightedId()).toBe(30);

    const lists = api.log.filter(isEventList);

    expect(lists.map(e => e.query)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'gt:30', sort: 'ascending', count: `${BATCH}`, type: 'pipeline' }),
        expect.objectContaining({ id: 'lt:30', sort: 'descending', count: `${BATCH}`, type: 'pipeline' })
      ])
    );
    expectContiguous([await rail.visibleIds()]);
  });

  test('scrolling down loads older batches with no gaps or duplicates', async ({ page, api }) => {
    new EventFeed(60).register(api);
    await page.goto(eventUrl(30));
    const rail = new EventRail(page);

    await expect.poll(() => rail.highlightedId()).toBe(30);
    const snapshots = await rail.scrollWalk('down', ids => ids.includes(1));

    expect(snapshots.at(-1)).toContain(1);
    expectContiguous(snapshots);

    // Each older request continued from the oldest event loaded so far.
    const older = api.log.filter(isEventList).filter(e => e.query.id?.startsWith('lt:'));

    expect(older.map(e => e.query.id)).toEqual(['lt:30', 'lt:20', 'lt:10']);
  });

  test('reaching the oldest event stops older requests', async ({ page, api }) => {
    new EventFeed(25).register(api);
    await page.goto(eventUrl(12));
    const rail = new EventRail(page);

    await expect.poll(() => rail.highlightedId()).toBe(12);
    await rail.scrollWalk('down', ids => ids.includes(1));
    await rail.scrollWalk('down', () => false, 5);

    const olderCount = () =>
      api.log.filter(isEventList).filter(e => e.query.id?.startsWith('lt:')).length;
    const before = olderCount();

    await rail.scrollWalk('down', () => false, 5);
    expect(olderCount()).toBe(before);
  });

  test('scrolling up loads newer batches with no gaps or duplicates', async ({ page, api }) => {
    new EventFeed(60).register(api);
    await page.goto(eventUrl(30));
    const rail = new EventRail(page);

    await expect.poll(() => rail.highlightedId()).toBe(30);
    const snapshots = await rail.scrollWalk('up', ids => ids.includes(60));

    expect(snapshots.at(-1)).toContain(60);
    expectContiguous(snapshots);

    const newer = api.log.filter(isEventList).filter(e => e.query.id?.startsWith('gt:'));

    const cursors = newer.map(e => e.query.id);

    // Each newer request continued from the newest event loaded so far, and none was repeated. The
    // last one, from the newest event once the top is reached, returns nothing and starts polling.
    expect(cursors).toEqual(['gt:30', 'gt:40', 'gt:50', 'gt:60']);
  });

  test.describe('scheduler filter', () => {
    test('is applied to every request when the pipeline setting is on', async ({ page, api }) => {
      const feed = new EventFeed(40, { schedulerEvery: 4, filterSchedulerEvents: true });

      feed.register(api);
      await page.goto(eventUrl(39));
      const rail = new EventRail(page);

      await expect.poll(() => rail.highlightedId()).toBe(39);
      await rail.scrollWalk('down', ids => ids.includes(1), 40);

      const lists = api.log.filter(isEventList);

      expect(lists.length).toBeGreaterThan(0);
      lists.forEach(e => expect(e.query.creator).toBe('ne:sd:scheduler'));

      // No scheduler-created event (every 4th id) ever reaches the rail.
      const seen = (await rail.visibleIds()).filter(id => id % 4 === 0);

      expect(seen).toEqual([]);
    });

    test('is not applied when the pipeline setting is off', async ({ page, api }) => {
      new EventFeed(40, { schedulerEvery: 4 }).register(api);
      await page.goto(eventUrl(39));
      await expect.poll(() => new EventRail(page).highlightedId()).toBe(39);

      api.log.filter(isEventList).forEach(e => expect(e.query.creator).toBeUndefined());
    });
  });

  test.describe('new events', () => {
    test.use({ appConfig: { EVENT_RELOAD_TIMER: 500 } });

    test('appear at the top while the user is on the latest event', async ({ page, api }) => {
      const feed = new EventFeed(30);

      feed.register(api);
      await page.goto(eventUrl(30));
      const rail = new EventRail(page);

      await expect.poll(() => rail.highlightedId()).toBe(30);
      expect(await rail.visibleIds()).not.toContain(31);

      feed.add();
      await expect.poll(async () => (await rail.visibleIds())[0], { timeout: 10_000 }).toBe(31);
      expectContiguous([await rail.visibleIds()]);
    });
  });
});
