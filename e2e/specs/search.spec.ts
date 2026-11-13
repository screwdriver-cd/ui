import { expect, test } from '../support/app';
import { REACT_ONLY } from '../support/ember';

const result = (i: number) => ({
  id: 200 + i,
  name: `org/repo-${i}`,
  scmRepo: { name: `org/repo-${i}`, branch: 'main' },
  scmContext: 'github:github.com'
});

test.describe('search', () => {
  test.beforeEach(({ api }) => {
    api.get('/collections', () => [200, []]);
    api.get('/pipelines', req => {
      const term = req.queryParams.search ?? '';

      return [200, term.includes('repo') ? [result(1), result(2)] : []];
    });
  });

  test('typing and pressing Enter searches', REACT_ONLY, async ({ page, api }) => {
    // React only: Ember has no search box on the page itself, only in the header (see header.spec.ts).
    await page.goto('/search');
    await page.getByRole('searchbox', { name: 'Search Screwdriver pipelines' }).fill('repo');
    await page.getByRole('searchbox', { name: 'Search Screwdriver pipelines' }).press('Enter');

    await expect(page).toHaveURL(/query=repo/);
    await expect(page.getByText('org/repo-1')).toBeVisible();
    await expect(page.getByText('org/repo-2')).toBeVisible();
    expect(api.requests(/^\/pipelines$/).some(e => e.query.search === 'repo')).toBe(true);
  });

  test('a ?query= deep link searches immediately', async ({ page }) => {
    await page.goto('/search?query=repo');
    await expect(page.getByText('org/repo-1')).toBeVisible();
  });

  test('Enter pressed to confirm an IME candidate does not search', REACT_ONLY, async ({ page, api }) => {
    // React only: Ember has no search box on the page itself, only in the header (see header.spec.ts).
    await page.goto('/search');
    const input = page.getByRole('searchbox', { name: 'Search Screwdriver pipelines' });

    await input.fill('repo');
    await input.evaluate(el => {
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    });
    await input.press('Enter');
    await expect(page).not.toHaveURL(/query=/);
    expect(api.requests(/^\/pipelines$/).filter(e => e.query.search === 'repo')).toHaveLength(0);

    await input.evaluate(el => {
      el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    });
    await page.waitForTimeout(100);
    await input.press('Enter');
    await expect(page).toHaveURL(/query=repo/);
  });

  test('shows an empty state', async ({ page }) => {
    await page.goto('/search?query=zzz');
    await expect(page.getByText('No results')).toBeVisible();
  });

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 }
  ]) {
    // React only: no page scroll is a rewrite requirement (Ember scrolls the page).
    test(`does not scroll the page at ${viewport.width}x${viewport.height}`, REACT_ONLY, async ({ page, api }) => {
      api.get('/pipelines', () => [200, Array.from({ length: 50 }, (_v, i) => result(i))]);
      await page.setViewportSize(viewport);
      await page.goto('/search?query=repo');
      await expect(page.getByText('org/repo-0', { exact: true })).toBeVisible();

      const overflow = await page.evaluate(() => (document.scrollingElement as Element).scrollHeight - window.innerHeight);

      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
