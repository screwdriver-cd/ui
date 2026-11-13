import { expect, test, type Page } from '@playwright/test';
import { benchUrl, ensureGraphServer, GRAPH } from './graph-server';
import { REACT_ONLY } from '../support/ember';

// Visual baselines and rendering checks for the workflow graph's bench page.
// Screenshots also need E2E_VISUAL=1, like specs/visual.spec.ts: baselines are per platform
// (darwin and linux are committed). Refresh them with `npm run test:visual:update` (see README.md).

const FIXTURES = ['stages', 'collapsed', 'production', 'pr-chain', 'external', 'joins', 'stress', 'mini', 'only-detached', 'fan-out'] as const;
const LOCALES = ['en', 'ja'] as const;
const VISUAL = process.env.E2E_VISUAL === '1';

test.skip(!GRAPH, 'set E2E_GRAPH=1 to run the graph specs (see e2e/README.md)');

test.beforeAll(async () => {
  // A cold vite dev server (dependency optimisation) can take over a minute on CI.
  test.setTimeout(180_000);
  await ensureGraphServer(150_000);
});

async function open(page: Page, fixture: string, locale: 'en' | 'ja') {
  await page.goto(benchUrl(fixture, locale));
  await page.waitForSelector('body[data-graph-ready="true"]', { timeout: 30_000 });
  // fitView animates for 0ms on first layout, but let React Flow settle its viewport transform.
  await page.waitForTimeout(250);
}

for (const locale of LOCALES) {
  test.describe(`workflow graph visual (${locale})`, REACT_ONLY, () => {
    for (const fixture of FIXTURES) {
      test(`${fixture}`, async ({ page }) => {
        test.skip(!VISUAL, 'set E2E_VISUAL=1 to compare screenshots (see e2e/README.md)');
        await open(page, fixture, locale);

        await expect(page.locator('#bench-frame')).toHaveScreenshot(`graph-${fixture}-${locale}.png`, {
          animations: 'disabled',
          maxDiffPixelRatio: 0.01
        });
      });
    }

    test('localized controls', async ({ page }) => {
      await open(page, 'stages', locale);

      const fit = page.getByRole('button', { name: locale === 'ja' ? '全体を表示' : 'Fit to view' });

      await expect(fit).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
    });
  });
}

test.describe('workflow graph content', REACT_ONLY, () => {
  test('uses the screwdriver icon font from the same origin', async ({ page }) => {
    const fontRequests: string[] = [];

    page.on('request', r => {
      if (/screwdriver\.(woff|ttf)/.test(r.url())) fontRequests.push(r.url());
    });
    await open(page, 'stages', 'en');

    const loaded = await page.evaluate(async () => {
      await document.fonts.load("20px 'screwdriver'", '');

      return document.fonts.check("20px 'screwdriver'", '');
    });

    expect(loaded).toBe(true);
    expect(fontRequests.length).toBeGreaterThan(0);
    fontRequests.forEach(u => expect(new URL(u).origin).toBe(new URL(page.url()).origin));
  });

  test('a disabled node is dashed but its status icon is not boxed', async ({ page }) => {
    await open(page, 'stages', 'en');

    const styles = await page.evaluate(() => {
      const host = document.querySelector('.wg-node') as HTMLElement;
      const node = document.createElement('div');
      const icon = document.createElement('span');

      node.className = 'wg-node wg-status--DISABLED';
      icon.className = 'wg-icon wg-status--DISABLED';
      node.append(icon);
      host.parentElement?.append(node);

      const n = getComputedStyle(node);
      const i = getComputedStyle(icon);

      return { node: [n.borderStyle, n.opacity], icon: [i.borderStyle, i.opacity] };
    });

    expect(styles.node).toEqual(['dashed', '0.8']);
    expect(styles.icon).toEqual(['none', '1']);
  });

  test('a trigger without its label centres its icon in the circle', async ({ page }) => {
    await open(page, 'stages', 'en');

    const offset = await page.evaluate(() => {
      const host = document.querySelector('.wg-node') as HTMLElement;
      const node = document.createElement('div');
      const icon = document.createElement('span');

      // The 32px label-less trigger of layout/input.ts, as TriggerNode renders a STARTED_FROM one.
      node.className = 'wg-node wg-trigger wg-status--STARTED_FROM wg-unlabelled';
      node.style.cssText = 'position: absolute; width: 32px; height: 32px';
      icon.className = 'wg-icon wg-status--STARTED_FROM';
      icon.textContent = '\ue907';
      node.append(icon);
      host.parentElement?.append(node);

      const n = node.getBoundingClientRect();
      const i = icon.getBoundingClientRect();

      return [i.left + i.width / 2 - (n.left + n.width / 2), i.top + i.height / 2 - (n.top + n.height / 2)];
    });

    expect(Math.abs(offset[0])).toBeLessThan(0.5);
    expect(Math.abs(offset[1])).toBeLessThan(0.5);
  });

  test('with labels hidden, a join badge stays inside its node', async ({ page }) => {
    await open(page, 'joins', 'en');
    await page.getByRole('button', { name: 'Hide labels' }).click();
    // The label-less layout is computed off the main thread: wait for the narrower nodes.
    await page.waitForFunction(() => {
      const joined = document.querySelector<HTMLElement>('.wg-node[data-node="deploy"]');

      // offsetWidth: the layout size, before the viewport's zoom.
      return !!joined && joined.offsetWidth < 150;
    });

    const overflows = await page.evaluate(() =>
      [...document.querySelectorAll('.wg-node')]
        .filter(n => n.querySelector('.wg-join'))
        .map(n => {
          const node = n as HTMLElement;
          const badge = n.querySelector<HTMLElement>('.wg-join')!;

          // Both in the node's own (unzoomed) pixels; 2px is its border.
          return { node: node.dataset.node, over: badge.offsetLeft + badge.offsetWidth - (node.offsetWidth - 2) };
        })
        .filter(o => o.over > 0)
    );

    expect(overflows).toEqual([]);
  });

  test('mini variant is static, small and status-coloured', async ({ page }) => {
    await open(page, 'mini', 'en');

    await expect(page.locator('.wg-toolbar')).toHaveCount(0);
    await expect(page.locator('[data-node].wg-mini').first()).toBeVisible();
    expect(await page.locator('.react-flow__node [tabindex="0"]').count()).toBe(0);
    await expect(page.locator('.wg-status--SUCCESS.wg-mini').first()).toHaveCSS('background-color', 'rgb(46, 158, 91)');
    await expect(page.locator('.wg-status--RUNNING.wg-mini').first()).toHaveCSS('background-color', 'rgb(11, 107, 203)');
  });
});
