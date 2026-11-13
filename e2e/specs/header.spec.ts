import { expect, test } from '../support/app';
import { REACT_ONLY } from '../support/ember';
import { header } from '../support/pages/header';
import { guestJwtSession } from '../support/sessions';

const result = (i: number) => ({
  id: 200 + i,
  name: `org/repo-${i}`,
  scmRepo: { name: `org/repo-${i}`, branch: 'main' },
  scmContext: 'github:github.com'
});

test.describe('header', () => {
  test.beforeEach(({ api }) => {
    api.get('/collections', () => [200, []]);
    api.get('/pipelines', req => [200, (req.queryParams.search ?? '').includes('repo') ? [result(1)] : []]);
  });

  test('global banners show on pages outside a pipeline', async ({ page, api }) => {
    api.get('/banners', req =>
      req.queryParams.scope === 'GLOBAL'
        ? [200, [{ id: 1, message: 'Maintenance tonight', isActive: true, scope: 'GLOBAL' }]]
        : [200, []]
    );
    await page.goto('/validator');
    await expect(page.locator('#banners')).toContainText('Maintenance tonight');
  });

  test('the search box navigates to /search?query=', async ({ page }) => {
    await page.goto('/validator');
    await header(page).search('repo');

    await expect(page).toHaveURL(/\/search\?query=repo$/);
    await expect(page.getByText('org/repo-1')).toBeVisible();
  });

  test('Enter that confirms an IME candidate does not leave the page', REACT_ONLY, async ({ page }) => {
    // React only: Ember has no IME guard, but a synthetic composition event does not reproduce it there; verified by code reading only.
    await page.goto('/validator');
    await header(page).openSearch();
    const box = header(page).searchBox();

    await box.fill('パイプライン');
    await box.evaluate(el => el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
    await box.press('Enter');
    await expect(page).toHaveURL(/\/validator$/);
    await box.evaluate(el => el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
    await box.press('Enter');
    await expect(page).toHaveURL(/\/search\?query=/);
  });

  test.describe('configured links', () => {
    test.use({
      appConfig: { SDDOC_URL: 'https://docs.example.test/sd', SLACK_URL: 'https://slack.example.test/sd', RELEASE_VERSION: 'v9.9.9' }
    });

    test('the help menu links to the docs and slack and shows the release', async ({ page }) => {
      await page.goto('/validator');
      await header(page).helpToggle().click();

      await expect(page.getByRole('link', { name: 'Documentation' })).toHaveAttribute('href', 'https://docs.example.test/sd');
      await expect(page.getByRole('link', { name: 'Slack Workspace' })).toHaveAttribute('href', 'https://slack.example.test/sd');
      await expect(page.getByText('v9.9.9')).toBeVisible();
    });
  });

  test.describe('avatar setting', () => {
    test.use({ appConfig: { SHOW_AVATAR: 'true' } });

    test('the profile menu shows an avatar badge when SHOW_AVATAR is on', REACT_ONLY, async ({ page }) => {
      // React only: Ember shows avatars only next to other users (user-link), not in the header.
      await page.goto('/validator');
      await expect(page.locator('.profile-menu .avatar')).toHaveText('T');
    });
  });

  test.describe('avatar off', () => {
    test.use({ appConfig: { SHOW_AVATAR: 'false' } });

    test('no avatar badge when SHOW_AVATAR is off', async ({ page }) => {
      await page.goto('/validator');
      await expect(header(page).profileToggle()).toContainText('test');
      await expect(page.locator('.profile-menu .avatar')).toHaveCount(0);
    });
  });

  test('the profile menu offers settings and sign out', async ({ page, api }) => {
    api.post('/auth/logout', () => [200, {}]);
    await page.goto('/validator');
    await header(page).profileToggle().click();
    await header(page).userSettingsLink().click();
    await expect(page).toHaveURL(/\/user-settings(\/preferences)?$/);

    await header(page).profileToggle().click();
    await header(page).signOut().click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('signed-in users see Create Pipeline', async ({ page }) => {
    await page.goto('/validator');
    await expect(header(page).createLink()).toBeVisible();
  });

  test.describe('guest session', REACT_ONLY, () => {
    // React only: Ember treats a guest like any signed-in user (profile menu, Create Pipeline, /create).
    test.use({ session: guestJwtSession });

    test('guests see Sign in, no Create Pipeline and no profile menu', async ({ page }) => {
      await page.goto('/validator');
      await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Create Pipeline' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Profile' })).toHaveCount(0);
    });

    test('guests can open the sign-in page', async ({ page }) => {
      await page.goto('/validator');
      await page.getByRole('link', { name: 'Sign in' }).click();
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole('heading', { name: 'Sign in to Screwdriver' })).toBeVisible();
    });

    test('guests typing /create are sent home', async ({ page, api }) => {
      api.get('/collections', () => [200, []]);
      await page.goto('/create');
      await expect(page).not.toHaveURL(/\/create$/);
    });
  });

  for (const locale of ['ja', 'en-XA']) {
    test(`the header does not overflow horizontally in ${locale}`, REACT_ONLY, async ({ page }) => {
      // React only: Ember has no Japanese or pseudo locale.
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`/validator?locale=${locale}`);
      await expect(page.getByRole('banner')).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
