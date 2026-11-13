import { DEFAULT_EVENT_ID } from '../support/mocks/events';
import { pipeline, PIPELINE_ID } from '../support/mocks/pipeline';
import { expect, test } from '../support/app';
import { REACT_ONLY } from '../support/ember';
import { ui } from '../support/pages/ui';
import { otherScmSession } from '../support/sessions';

test.describe('starting a pipeline of another SCM', () => {
  // Signed in to test:github.com; the mock pipeline lives on github:github.com.
  test.use({ session: otherScmSession });

  // Ember only enables Start for an ACTIVE pipeline, and the mock pipeline has no state.
  test.beforeEach(({ api }) => {
    api.get('/pipelines/:id', () => [200, { ...pipeline, lastEventId: DEFAULT_EVENT_ID, state: 'ACTIVE' }]);
  });

  test('warns to switch accounts instead of opening the start dialog', async ({ page }) => {
    await page.goto(`/v2/pipelines/${PIPELINE_ID}/events/${DEFAULT_EVENT_ID}`);
    await page.locator('#start-event-button').click();

    await expect(ui(page).scmWarning()).toContainText('sign in to github.com');

    await ui(page).dismissScmWarning();
    await expect(ui(page).scmWarning()).toHaveCount(0);
  });

  test('restarting the event is blocked too, and the profile menu opens', REACT_ONLY, async ({ page }) => {
    await page.goto(`/v2/pipelines/${PIPELINE_ID}/events/${DEFAULT_EVENT_ID}`);
    await page.locator('#restart-event-button').click();

    await expect(ui(page).scmWarning()).toContainText('sign in to github.com');
    await expect(page.locator('#start-event-modal')).toHaveCount(0);
    await expect(page.locator('.profile-menu')).toBeVisible();
  });
});
