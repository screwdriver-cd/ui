import { DEFAULT_EVENT_ID } from '../support/mocks/events';
import { PIPELINE_ID } from '../support/mocks/pipeline';
import { expect, test } from '../support/app';

const eventsUrl = `/v2/pipelines/${PIPELINE_ID}/events`;

test.describe('pipeline events (v2)', () => {
  test.describe('logged out', () => {
    test.use({ session: null });

    test('redirects to /login', async ({ page, api }) => {
      await page.goto(eventsUrl);
      await expect(page).toHaveURL(/\/login$/);
      expect(api.requests(/^\/pipelines\//)).toHaveLength(0);
    });
  });

  test('shows the event rail and workflow for an event', async ({ page }) => {
    await page.goto(`${eventsUrl}/${DEFAULT_EVENT_ID}`);

    await expect(page.locator('#event-rail')).toBeVisible();
    await expect(page.locator('#event-cards-container')).toBeVisible();
  });
});
