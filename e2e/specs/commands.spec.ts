import { expect, test } from '../support/app';
import { registerCommands } from '../support/fixtures';
import { expectNoPageScroll, VIEWPORTS } from '../support/no-scroll';
import { REACT_ONLY } from '../support/ember';

test.describe('commands', () => {
  test('lists one row per command and search narrows it', async ({ page, api }) => {
    registerCommands(api);
    await page.goto('/commands');
    await expect(page.getByText('bar', { exact: true })).toHaveCount(1);
    await page.getByPlaceholder('Search commands').fill('qux');
    await expect(page.getByText('bar', { exact: true })).toHaveCount(0);
  });

  test('detail page shows format and versions', REACT_ONLY, async ({ page, api }) => {
    registerCommands(api);
    await page.goto('/commands/foo/bar');
    await expect(page.getByText('Format: binary')).toBeVisible();
    await expect(page.getByRole('link', { name: /1\.0\.0.*stable/ })).toBeVisible();
  });

  for (const viewport of VIEWPORTS) {
    test(`does not scroll the page at ${viewport.width}x${viewport.height}`, REACT_ONLY, async ({ page, api }) => {
      registerCommands(api);
      await page.setViewportSize(viewport);
      await page.goto('/commands/foo/bar');
      await expect(page.getByText('Format: binary')).toBeVisible();
      await expectNoPageScroll(page);
    });
  }
});
