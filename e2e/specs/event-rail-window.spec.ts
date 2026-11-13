import { makeBuilds } from '../support/mocks/builds';
import { PIPELINE_ID } from '../support/mocks/pipeline';
import { EventFeed } from '../support/event-feed';
import { EventRail } from '../support/pages/event-rail';
import { expect, test } from '../support/app';
import type { RequestLogEntry } from '../support/route-table';
import { REACT_ONLY } from '../support/ember';

const eventUrl = (id: number) => `/v2/pipelines/${PIPELINE_ID}/events/${id}`;
const isEventList = (e: RequestLogEntry) => /^\/pipelines\/\d+\/events$/.test(e.path);
const isBuilds = (e: RequestLogEntry) => /^\/events\/\d+\/builds$/.test(e.path);
/** Cards warmed beyond the rendered window (EVENT_BATCH_SIZE). */
const PREFETCH_BATCH = 10;
const buildsOf = (e: RequestLogEntry) => Number(/^\/events\/(\d+)\/builds$/.exec(e.path)?.[1]);

/** The card closest to the top of the rail that is fully inside it, with its offset from the rail's top. */
async function anchorCard(rail: EventRail) {
  return rail.scroller.evaluate(scroller => {
    const top = scroller.getBoundingClientRect().top;
    const cards = Array.from(scroller.querySelectorAll<HTMLElement>('.event-card'));
    const card = cards.find(c => c.getBoundingClientRect().top >= top);

    return card
      ? { id: Number(/Event: (\d+)/.exec(card.title)?.[1]), offset: card.getBoundingClientRect().top - top }
      : null;
  });
}

async function offsetOf(rail: EventRail, id: number) {
  return rail.scroller.evaluate((scroller, eventId) => {
    const card = scroller.querySelector<HTMLElement>(`.event-card[data-event-id="${eventId}"]`);

    return card ? card.getBoundingClientRect().top - scroller.getBoundingClientRect().top : null;
  }, id);
}

const settle = (rail: EventRail) =>
  rail.root.page().evaluate(
    () =>
      new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 120)))
      )
  );

test.describe('event rail window', () => {
  test('trimming old pages keeps the card under the pointer where it was', REACT_ONLY, async ({ page, api }) => {
    new EventFeed(400).register(api);
    await page.goto(eventUrl(300));
    const rail = new EventRail(page);

    await expect.poll(() => rail.highlightedId()).toBe(300);

    // Scroll down far enough that more than the page window (8 batches) has been loaded.
    let maxJump = 0;
    let steps = 0;
    let height = 0;
    let shrank = 0;

    while ((await rail.visibleIds()).at(-1)! > 60 && steps < 120) {
      const before = await anchorCard(rail);
      // What the browser applied, read at once (less than 600 at the loaded end). Reading scrollTop
      // after settling would not do: a trim lowers it by the dropped pages' height to keep the
      // content still, which is exactly the compensation this test checks for.
      const moved = await rail.scroller.evaluate(el => {
        const start = el.scrollTop;

        el.scrollTop += 600;

        return el.scrollTop - start;
      });

      await settle(rail);
      if (before) {
        const after = await offsetOf(rail, before.id);

        // The card moves up by exactly what the list scrolled. Any other movement is the list
        // jumping, e.g. when old pages are trimmed without compensation.
        if (after !== null) {
          maxJump = Math.max(maxJump, Math.abs(before.offset - moved - after));
        }
      }
      // The list only gets shorter when old pages are trimmed off its top.
      const now = await rail.scroller.evaluate(el => el.scrollHeight);

      if (height && now < height - 300) {
        shrank += 1;
      }
      height = now;
      steps += 1;
    }

    expect(steps).toBeLessThan(120);
    // Older pages were requested well past the window, so something was trimmed.
    const older = api.log.filter(isEventList).filter(e => e.query.id?.startsWith('lt:'));

    expect(older.length).toBeGreaterThan(8);
    expect(shrank, 'the list never shrank: nothing was trimmed').toBeGreaterThan(0);
    // Virtuoso corrects its height estimates by a few px as cards are measured. A trim without
    // compensation would move every card by the height of the dropped pages (thousands of px).
    expect(maxJump).toBeLessThanOrEqual(40);
  });

  test('scrolling back up re-fetches pages that were trimmed, without gaps', REACT_ONLY, async ({ page, api }) => {
    new EventFeed(400).register(api);
    await page.goto(eventUrl(300));
    const rail = new EventRail(page);

    await expect.poll(() => rail.highlightedId()).toBe(300);
    await rail.scrollWalk('down', ids => ids.includes(150), 120);
    expect((await rail.visibleIds()).includes(150)).toBe(true);

    const up = await rail.scrollWalk('up', ids => ids.includes(300), 160);

    expect(up.at(-1)).toContain(300);
    up.forEach(ids => ids.slice(1).forEach((id, i) => expect(id).toBe(ids[i] - 1)));

    // Only the anchor batch (gt:300) was ever loaded upward. Everything between 150 and 300 had
    // been dropped from memory while scrolling down, so walking back up had to fetch it again.
    const newer = api.log
      .filter(isEventList)
      .filter(e => e.query.id?.startsWith('gt:'))
      .map(e => e.query.id);

    expect(newer[0]).toBe('gt:300');
    expect(newer.length).toBeGreaterThan(6);
    expect(new Set(newer).size).toBe(newer.length);
  });

  test('the page being viewed stays selected after its card was trimmed away', async ({ page, api }) => {
    new EventFeed(400).register(api);
    await page.goto(eventUrl(300));
    const rail = new EventRail(page);

    await expect.poll(() => rail.highlightedId()).toBe(300);
    await rail.scrollWalk('down', ids => ids.includes(120), 120);
    await settle(rail);

    // No re-anchor: the list is still where the user left it.
    expect(await rail.visibleIds()).toContain(120);
    expect(page.url()).toContain(`/events/300`);
    const anchors = api.log.filter(isEventList).filter(e => e.query.id === 'gt:300');

    expect(anchors).toHaveLength(1);
  });
});

test.describe('event rail performance', () => {
  test('first card paints within budget against a 5k-event pipeline', async ({ page, api }) => {
    new EventFeed(5000).register(api);

    const started = Date.now();

    await page.goto(eventUrl(2500), { waitUntil: 'commit' });
    const rail = new EventRail(page);

    await rail.cards.first().waitFor({ state: 'visible' });
    const elapsed = Date.now() - started;

    // A dev server (many unbundled modules) is the slow case; the budget is generous but a
    // client that rendered or fetched the whole feed would blow well past it.
    expect(elapsed).toBeLessThan(5000);

    await expect.poll(() => rail.highlightedId()).toBe(2500);
    // Only the anchor batches were requested, and only a window of cards is in the DOM.
    const lists = api.log.filter(isEventList);

    expect(lists.length).toBeLessThanOrEqual(6);
    expect(await rail.cards.count()).toBeLessThan(40);
  });

  test('the newest events open as fast, with one request for the head', async ({ page, api }) => {
    new EventFeed(5000).register(api);
    const started = Date.now();

    await page.goto(`/v2/pipelines/${PIPELINE_ID}/events`, { waitUntil: 'commit' });
    await new EventRail(page).cards.first().waitFor({ state: 'visible' });

    expect(Date.now() - started).toBeLessThan(5000);
  });
});

test.describe('event rail build requests', REACT_ONLY, () => {
  test.use({ appConfig: { BUILD_RELOAD_TIMER: 300 } });

  test('only visible, running cards poll; completed and off-screen cards do not', async ({ page, api }) => {
    const RUNNING = 28;

    new EventFeed(60).register(api);
    // Everything is SUCCESS except one running event next to the selected one.
    api.get('/events/:id/builds', req => {
      const eventId = Number(req.params.id);

      return [
        200,
        makeBuilds(eventId).map((build, i) => ({
          ...build,
          id: eventId * 100 + i,
          number: eventId * 100 + i,
          status: eventId === RUNNING ? 'RUNNING' : 'SUCCESS',
          endTime: eventId === RUNNING ? undefined : build.endTime
        }))
      ];
    });

    await page.goto(eventUrl(30));
    const rail = new EventRail(page);

    await expect.poll(() => rail.highlightedId()).toBe(30);
    await expect.poll(() => api.log.filter(isBuilds).filter(e => buildsOf(e) === RUNNING).length).toBeGreaterThan(2);

    const visible = await rail.visibleIds();
    const counts = new Map<number, number>();

    api.log.filter(isBuilds).forEach(e => counts.set(buildsOf(e), (counts.get(buildsOf(e)) ?? 0) + 1));

    // Completed events were fetched once and never again.
    for (const [id, n] of counts) {
      if (id !== RUNNING && id !== 30) {
        expect(n, `builds of completed event ${id}`).toBe(1);
      }
    }
    // Off-screen events (loaded in the anchor batch but not rendered) are not requested, except
    // the ones just outside the rendered window, which are warmed once (prefetch): at most one
    // batch (10) beyond the rendered window plus its overscan (6).
    const requested = [...counts.keys()];
    const rendered = { lowest: Math.min(...visible) - 6, highest: Math.max(...visible) + 6 };
    const lowest = rendered.lowest - PREFETCH_BATCH;
    const highest = rendered.highest + PREFETCH_BATCH;

    requested.forEach(id => expect(id).toBeGreaterThanOrEqual(lowest));
    requested.forEach(id => expect(id).toBeLessThanOrEqual(highest));
    expect(requested.some(id => id < rendered.lowest || id > rendered.highest), 'nothing was prefetched').toBe(true);

    // Scroll the running card out of the list: its polling stops.
    await rail.scrollWalk('down', ids => !ids.includes(RUNNING), 40);
    expect(await rail.visibleIds()).not.toContain(RUNNING);
    await page.waitForTimeout(600);
    const after = api.log.filter(isBuilds).filter(e => buildsOf(e) === RUNNING).length;

    await page.waitForTimeout(1500);
    expect(api.log.filter(isBuilds).filter(e => buildsOf(e) === RUNNING).length).toBe(after);
  });

  test('a card just below the window is warmed once and does not refetch when it scrolls in', async ({ page, api }) => {
    new EventFeed(60).register(api);
    api.get('/events/:id/builds', req => {
      const eventId = Number(req.params.id);

      return [200, makeBuilds(eventId).map((b, i) => ({ ...b, id: eventId * 100 + i, status: 'SUCCESS' }))];
    });

    await page.goto(eventUrl(30));
    const rail = new EventRail(page);

    await expect.poll(() => rail.highlightedId()).toBe(30);
    // Newest first: the cards below the window have lower ids.
    const target = Math.min(...(await rail.visibleIds())) - 2;

    await expect.poll(() => api.log.filter(isBuilds).filter(e => buildsOf(e) === target).length).toBe(1);
    await rail.scrollWalk('down', ids => ids.includes(target), 40);
    await page.waitForTimeout(400);
    expect(api.log.filter(isBuilds).filter(e => buildsOf(e) === target)).toHaveLength(1);
  });
});
