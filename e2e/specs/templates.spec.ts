import { expect, test } from '../support/app';
import { registerTemplates } from '../support/fixtures';
import { expectNoPageScroll, VIEWPORTS } from '../support/no-scroll';
import { REACT_ONLY } from '../support/ember';

test.describe('templates', () => {
  test('/templates lands on the pipeline template list', async ({ page, api }) => {
    registerTemplates(api);
    await page.goto('/templates');
    await expect(page).toHaveURL(/\/templates\/pipeline$/);
    await expect(page.getByText('deploy', { exact: true })).toBeVisible();
  });

  test('job templates list one row per template and search narrows it', async ({ page, api }) => {
    registerTemplates(api);
    await page.goto('/templates/job');
    await expect(page.getByText('publish', { exact: true })).toHaveCount(1);
    await page.getByPlaceholder('Search job templates').fill('nodejs');
    await expect(page.getByText('publish', { exact: true })).toHaveCount(0);
    await expect(page.getByText('build', { exact: true })).toBeVisible();
  });

  test('detail page shows versions and tags', async ({ page, api }) => {
    registerTemplates(api);
    await page.goto('/templates/job/chef/publish');
    await expect(page.getByText('All Versions')).toBeVisible();
    await expect(page.getByRole('link', { name: /1\.0\.0.*stable/ })).toBeVisible();
  });

  for (const viewport of VIEWPORTS) {
    test(`does not scroll the page at ${viewport.width}x${viewport.height}`, REACT_ONLY, async ({ page, api }) => {
      registerTemplates(api);
      await page.setViewportSize(viewport);
      await page.goto('/templates/job/chef/publish');
      await expect(page.getByText('All Versions')).toBeVisible();
      await expectNoPageScroll(page);
    });
  }
});
