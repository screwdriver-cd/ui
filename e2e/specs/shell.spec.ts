import { expect, test } from '../support/app';

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 }
];

test.describe('app shell', () => {
  test.describe('logged out', () => {
    test.use({ session: null });

    test('login page offers the SCM sign-in link', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: 'Sign in to Screwdriver' })).toBeVisible();
      await expect(page.getByRole('link', { name: /Sign in with github\.com/ })).toBeVisible();
    });

    for (const viewport of VIEWPORTS) {
      test(`login page does not scroll the page at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/login');
        await expect(page.getByRole('heading', { name: 'Sign in to Screwdriver' })).toBeVisible();

        const overflow = await page.evaluate(() => {
          const el = document.scrollingElement as Element;

          return el.scrollHeight - window.innerHeight;
        });

        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  });
});
