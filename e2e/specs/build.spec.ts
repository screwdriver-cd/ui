import { expect, test } from '../support/app';
import { BUILD_URL, registerBuild } from '../support/fixtures';
import { expectNoPageScroll, VIEWPORTS } from '../support/no-scroll';
import { REACT_ONLY } from '../support/ember';

test.describe('build page', REACT_ONLY, () => {
  test('opens the failed step and shows its log', async ({ page, api }) => {
    registerBuild(api);
    await page.goto(BUILD_URL);

    await expect(page).toHaveURL(/\/builds\/100\/steps\/install$/);
    await expect(page.getByText('log line 0')).toBeVisible();
    await expect(page.getByText('log line 2')).toBeVisible();
  });

  test('selecting another step updates the URL', async ({ page, api }) => {
    registerBuild(api);
    await page.goto(BUILD_URL);
    await expect(page.getByText('log line 0')).toBeVisible();

    await page.getByRole('button', { name: /test/ }).first().click();
    await expect(page).toHaveURL(/\/builds\/100\/steps\/test$/);
  });

  test('the artifacts tab reports no artifacts for a missing manifest', async ({ page, api }) => {
    registerBuild(api);
    await page.goto(`${BUILD_URL}/artifacts`);
    await expect(page.getByText(/no artifacts/i)).toBeVisible();
  });

  test('an HTML artifact runs in an opaque origin, without the API session', async ({ page, api }) => {
    registerBuild(api);
    // Reports what the artifact's own script can reach.
    const report = `<script>
      let storage = 'readable';
      try { localStorage.length; } catch (e) { storage = 'blocked'; }
      parent.postMessage({ probe: true, origin: self.origin, storage }, '*');
    </script>`;

    await page.route('**/v4/builds/100/artifacts/**', route => {
      const { pathname } = new URL(route.request().url());

      return pathname.endsWith('/manifest.txt')
        ? route.fulfill({ status: 200, contentType: 'text/plain', body: './report.html\n' })
        : route.fulfill({ status: 200, contentType: 'text/html', body: report });
    });
    await page.addInitScript(() => {
      window.addEventListener('message', e => {
        if ((e.data as { probe?: boolean })?.probe) {
          (window as unknown as { probe: unknown }).probe = e.data;
        }
      });
    });
    await page.goto(`${BUILD_URL}/artifacts/report.html`);

    const probe = await page.waitForFunction(() => (window as unknown as { probe?: unknown }).probe);

    expect(await probe.jsonValue()).toEqual({ probe: true, origin: 'null', storage: 'blocked' });
  });

  test('a long log scrolls inside the log pane, not the page', async ({ page, api }) => {
    registerBuild(api, { lines: 2000 });
    await page.goto(BUILD_URL);
    // The pane follows the tail, so the first lines are virtualized away.
    await expect(page.getByText('log line 1999')).toBeVisible();
    await expectNoPageScroll(page);
  });

  for (const viewport of VIEWPORTS) {
    test(`does not scroll the page at ${viewport.width}x${viewport.height}`, async ({ page, api }) => {
      registerBuild(api, { lines: 500 });
      await page.setViewportSize(viewport);
      await page.goto(BUILD_URL);
      await expect(page.getByText('log line 499')).toBeVisible();
      await expectNoPageScroll(page);
    });
  }
});
