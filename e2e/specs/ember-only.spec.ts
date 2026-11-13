import { expect, test } from '../support/app';
import { EMBER_ONLY } from '../support/ember';

// Ember's side of tests whose React version is tagged REACT_ONLY. Delete this file with Ember.
test.describe('ember', EMBER_ONLY, () => {
  test('saving preferences PUTs the job name length', async ({ page, api }) => {
    let body: { settings?: Record<string, unknown> } = {};

    api.get('/users/settings', () => [200, { displayJobNameLength: 30 }]);
    api.put('/users/settings', req => {
      body = JSON.parse(req.requestBody ?? '{}');

      return [200, {}];
    });
    await page.goto('/user-settings/preferences');

    const length = page.getByRole('spinbutton');

    await expect(length).toHaveValue('30');
    await length.fill('45');
    await page.getByText('Save', { exact: true }).click();
    await expect(page.getByText('User settings updated successfully!')).toBeVisible();
    expect(body.settings?.displayJobNameLength).toBe(45);
  });
});
