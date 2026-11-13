import { expect, test } from '@playwright/test';
import { benchUrl, ensureGraphServer, GRAPH } from './graph-server';
import { REACT_ONLY } from '../support/ember';

// Layout time budgets. "ready" = bench page mounted until every React Flow node is measured and visible,
// i.e. decorate + ELK layout (Web Worker) + first render. Budgets are ~5-10x the numbers measured on a
// laptop against the Vite dev server (stress ~0.4s, small graphs ~0.15s) so they catch order-of-magnitude
// regressions without flaking on a loaded CI machine.

const BUDGETS: Record<string, { ms: number; minNodes: number }> = {
  stages: { ms: 3000, minNodes: 10 },
  collapsed: { ms: 3000, minNodes: 6 },
  production: { ms: 3000, minNodes: 20 },
  'pr-chain': { ms: 3000, minNodes: 6 },
  external: { ms: 3000, minNodes: 6 },
  joins: { ms: 3000, minNodes: 6 },
  mini: { ms: 3000, minNodes: 10 },
  stress: { ms: 8000, minNodes: 300 }
};

test.skip(!GRAPH, 'set E2E_GRAPH=1 to run the graph specs (see e2e/README.md)');

test.beforeAll(async () => {
  // A cold vite dev server (dependency optimisation) can take over a minute on CI.
  test.setTimeout(180_000);
  await ensureGraphServer(150_000);
});

for (const [fixture, budget] of Object.entries(BUDGETS)) {
  test(`${fixture} is laid out and rendered within ${budget.ms}ms`, REACT_ONLY, async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', e => errors.push(e.message));
    await page.goto(benchUrl(fixture));
    await page.waitForSelector('body[data-graph-ready="true"]', { timeout: 30_000 });

    const result = await page.evaluate(() => (window as unknown as { __graph: { ready: boolean; ms: number; nodes: number } }).__graph);

    expect(result.nodes).toBeGreaterThanOrEqual(budget.minNodes);
    expect(result.ms).toBeLessThan(budget.ms);
    expect(errors).toEqual([]);
  });
}

test('layout runs off the main thread: the page stays responsive while the stress graph lays out', REACT_ONLY, async ({ page }) => {
  await page.addInitScript(() => {
    // Longest gap between animation frames while the graph is loading.
    const w = window as unknown as { __maxGap: number };

    w.__maxGap = 0;

    let last = performance.now();
    const tick = (now: number) => {
      w.__maxGap = Math.max(w.__maxGap, now - last);
      last = now;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
  await page.goto(benchUrl('stress'));
  await page.waitForSelector('body[data-graph-ready="true"]', { timeout: 30_000 });

  const gap = await page.evaluate(() => (window as unknown as { __maxGap: number }).__maxGap);

  // React rendering of 300+ nodes still blocks for a moment; ELK itself must not (it is the multi-second part for big graphs).
  expect(gap).toBeLessThan(2000);
});
