import { expect, test } from '../support/app';
import { REACT_ONLY } from '../support/ember';
import { ui } from '../support/pages/ui';

const tokens = [{ id: 1, name: 'ci', description: 'for ci', lastUsed: null, expiresAt: null, options: { permission: 'read' } }];

test.describe('user settings', () => {
  test('/user-settings opens the preferences tab', async ({ page, api }) => {
    api.get('/users/settings', () => [200, { displayJobNameLength: 30 }]);
    await page.goto('/user-settings');
    await expect(page).toHaveURL(/\/user-settings\/preferences$/);
  });

  // React only: Ember saves its job name length setting instead (specs/ember-only.spec.ts).
  test('saving preferences PUTs the settings, keeping the job name length', REACT_ONLY, async ({ page, api }) => {
    let body: { settings?: Record<string, unknown> } = {};

    api.get('/users/settings', () => [200, { displayJobNameLength: 30 }]);
    api.put('/users/settings', req => {
      body = JSON.parse(req.requestBody ?? '{}');

      return [200, {}];
    });
    await page.goto('/user-settings/preferences');
    // There is no job name length setting (the graph fits names itself), but Ember's value is kept.
    await expect(page.getByRole('spinbutton')).toHaveCount(0);
    await page.getByRole('combobox', { name: 'Timestamp format' }).selectOption('UTC');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('User settings updated successfully!')).toBeVisible();
    expect(body.settings?.displayJobNameLength).toBe(30);
    expect(body.settings?.timestampFormat).toBe('UTC');
  });

  test('the language is chosen in the header, not in the preferences', REACT_ONLY, async ({ page }) => {
    // React only: Ember has no language selector (English only).
    await page.goto('/user-settings/preferences');
    await expect(page.getByRole('combobox', { name: 'Language' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Language' }).click();
    await page.getByRole('button', { name: '日本語' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  });

  test('creating a token shows its value once', async ({ page, api }) => {
    api.get('/tokens', () => [200, tokens]);
    api.post('/tokens', () => [200, { id: 2, name: 'new', value: 'SECRET-VALUE' }]);
    await page.goto('/user-settings/access-tokens');
    await expect(page.getByText('ci', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'New Token' }).click();

    const dialog = page.getByRole('dialog');

    await dialog.getByLabel('Name').fill('new');
    await dialog.getByRole('button', { name: 'Create token' }).click();
    await expect(dialog.getByText('SECRET-VALUE')).toBeVisible();
  });

  test('deleting a token requires typing its name', async ({ page, api }) => {
    let deleted = false;

    api.get('/tokens', () => [200, tokens]);
    api.delete('/tokens/:id', () => {
      deleted = true;

      return [204, undefined];
    });
    await page.goto('/user-settings/access-tokens');
    await ui(page).deleteTokenButton('ci', 'for ci').click();

    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: 'Delete token' });

    await expect(confirm).toBeDisabled();
    await dialog.getByRole('textbox').fill('ci');
    await confirm.click();
    await expect.poll(() => deleted).toBe(true);
  });

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 }
  ]) {
    // React only: no page scroll is a rewrite requirement (Ember scrolls the page).
    test(`does not scroll the page at ${viewport.width}x${viewport.height}`, REACT_ONLY, async ({ page, api }) => {
      api.get('/tokens', () => [200, Array.from({ length: 40 }, (_v, i) => ({ ...tokens[0], id: i + 1, name: `t${i}` }))]);
      await page.setViewportSize(viewport);
      await page.goto('/user-settings/access-tokens');
      await expect(page.getByText('t0', { exact: true })).toBeVisible();

      const overflow = await page.evaluate(() => (document.scrollingElement as Element).scrollHeight - window.innerHeight);

      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
