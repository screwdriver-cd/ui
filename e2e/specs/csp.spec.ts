import { expect, test } from '../support/app';
import { REACT_ONLY } from '../support/ember';

// Meaningful only with E2E_ENFORCE_CSP=1 against a server that sends the production CSP (the Docker
// image, or `E2E_CSP=1 vite preview` as CI runs it); without it the browser bypasses CSP. When it is
// set, each test first checks that the policy actually arrived, so a missing header cannot pass.
const ENFORCED = !!process.env.E2E_ENFORCE_CSP;
const PAGES = ['/v2/pipelines/4/events/1', '/v2/pipelines/4/jobs', '/v2/pipelines/4/settings', '/v2/pipelines/4/settings/jobs', '/validator', '/create', '/user-settings/preferences'];

test.describe('content security policy', () => {
  for (const path of PAGES) {
    test(`${path} raises no CSP violations`, async ({ page }) => {
      const violations: string[] = [];

      page.on('console', msg => {
        if (/content security policy/i.test(msg.text())) {
          violations.push(msg.text());
        }
      });
      page.on('pageerror', err => {
        if (/content security policy/i.test(err.message)) {
          violations.push(err.message);
        }
      });
      const response = await page.goto(path);

      if (ENFORCED) {
        expect(response?.headers()['content-security-policy']).toContain("default-src 'none'");
      }
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      expect(violations).toEqual([]);
    });
  }
});

test.describe('layout worker', REACT_ONLY, () => {
  test('runs as a Web Worker under the page CSP (no main-thread fallback)', async ({ page }) => {
    const workers: string[] = [];

    page.on('worker', w => workers.push(w.url()));
    await page.goto('/v2/pipelines/4/events/1');
    await expect(page.locator('.react-flow__node').first()).toBeVisible();

    expect(workers.length).toBeGreaterThan(0);
    expect(workers.every(url => url.startsWith('blob:'))).toBe(true);
  });
});
