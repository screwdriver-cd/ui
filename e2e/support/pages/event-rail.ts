import type { Locator, Page } from '@playwright/test';

/**
 * The only place that knows how the event rail is built. When the React
 * rewrite lands it has to satisfy these hooks (ids / titles / classes), or
 * this file is the one thing to change.
 */
export class EventRail {
  readonly root: Locator;

  readonly scroller: Locator;

  readonly cards: Locator;

  constructor(private page: Page) {
    this.root = page.locator('#event-rail');
    this.scroller = page.locator('#event-cards-container');
    this.cards = this.scroller.locator('.event-card');
  }

  /** Event ids of the rendered cards, in DOM (top-to-bottom) order. */
  async visibleIds(): Promise<number[]> {
    const titles = await this.cards.evaluateAll(els =>
      els.map(el => el.getAttribute('title') ?? '')
    );

    return titles.map(title => Number(/Event: (\d+)/.exec(title)?.[1]));
  }

  async highlightedId(): Promise<number | null> {
    const title = await this.cards
      .locator('xpath=self::*[contains(@class, "highlighted")]')
      .first()
      .getAttribute('title', { timeout: 100 })
      .catch(() => null);

    return title ? Number(/Event: (\d+)/.exec(title)?.[1]) : null;
  }

  /** Lets the virtual list render after a scroll. */
  private async settle() {
    await this.page.evaluate(
      () =>
        new Promise<void>(resolve =>
          requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 50)))
        )
    );
  }

  /**
   * Scrolls the rail a page at a time, recording the rendered ids at each
   * step, until `done(ids)` or `maxSteps`.
   */
  async scrollWalk(
    direction: 'down' | 'up',
    done: (ids: number[]) => boolean,
    maxSteps = 60
  ): Promise<number[][]> {
    const snapshots: number[][] = [await this.visibleIds()];

    for (let step = 0; step < maxSteps && !done(snapshots[snapshots.length - 1]); step += 1) {
      await this.scroller.evaluate((el, dir) => {
        el.scrollTop += (dir === 'down' ? 1 : -1) * el.clientHeight * 0.8;
      }, direction);
      await this.settle();
      snapshots.push(await this.visibleIds());
    }

    return snapshots;
  }
}
