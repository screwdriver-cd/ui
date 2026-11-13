import { DEFAULT_EVENT_ID } from '../support/mocks/events';
import { PIPELINE_ID } from '../support/mocks/pipeline';
import { expect, test } from '../support/app';
import { REACT_ONLY } from '../support/ember';

// The upstream-failed warning is a React addition (plan item #1497).

const eventUrl = `/v2/pipelines/${PIPELINE_ID}/events/${DEFAULT_EVENT_ID}`;
const MAIN = 12345;
const PUBLISH = 12346;

const build = (id: number, jobId: number, status: string) => ({
  id,
  jobId,
  eventId: DEFAULT_EVENT_ID,
  number: id,
  status,
  createTime: '2016-11-04T20:10:00.000Z',
  startTime: '2016-11-04T20:10:01.000Z',
  endTime: status === 'RUNNING' ? undefined : '2016-11-04T20:11:00.000Z',
  steps: []
});

async function openStartDialog(page: import('@playwright/test').Page, node: string) {
  await page.locator(`.wg-job[data-node="${node}"]`).click();
  await page.getByRole('dialog', { name: node }).getByRole('button', { name: /^(Restart \(Inherit\)|New Run \(Fresh\))/ }).first().click();
  await expect(page.locator('#start-event-modal')).toBeVisible();
}

test.describe('start dialog upstream warning', REACT_ONLY, () => {
  test('warns when an upstream build of the event failed', async ({ page, api }) => {
    api.get('/events/:id/builds', () => [200, [build(1, MAIN, 'FAILURE')]]);
    await page.goto(eventUrl);
    await openStartDialog(page, 'publish');

    await expect(page.locator('#upstream-failed-warning')).toContainText('An upstream job failed in this event: main');
  });

  test('stays quiet when the upstream builds succeeded (only the job itself failed)', async ({ page, api }) => {
    api.get('/events/:id/builds', () => [200, [build(1, MAIN, 'SUCCESS'), build(2, PUBLISH, 'FAILURE')]]);
    await page.goto(eventUrl);
    await openStartDialog(page, 'publish');
    await expect(page.locator('#start-event-modal')).toContainText('Starts from publish');
    await expect(page.locator('#upstream-failed-warning')).toHaveCount(0);
  });

  test('does not warn for the failed job itself or its downstream', async ({ page, api }) => {
    api.get('/events/:id/builds', () => [200, [build(1, MAIN, 'FAILURE'), build(2, PUBLISH, 'SUCCESS')]]);
    await page.goto(eventUrl);
    await openStartDialog(page, 'main');
    await expect(page.locator('#start-event-modal')).toContainText('Starts from main');
    await expect(page.locator('#upstream-failed-warning')).toHaveCount(0);
  });
});
