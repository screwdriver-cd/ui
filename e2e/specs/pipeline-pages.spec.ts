import { mockMetrics } from '../support/mocks/metrics';
import { DEFAULT_EVENT_ID } from '../support/mocks/events';
import { PARENT_PIPELINE_ID, PIPELINE_ID, PIPELINE_WITH_NO_EVENTS_ID, INVALID_PIPELINE_ID } from '../support/mocks/pipeline';
import { expect, test } from '../support/app';
import { expectNoPageScroll, VIEWPORTS } from '../support/no-scroll';
import { REACT_ONLY } from '../support/ember';

const base = `/v2/pipelines/${PIPELINE_ID}`;

test.describe('pipeline pages (v2)', () => {
  test('the pipeline root lands on the newest event', async ({ page }) => {
    await page.goto(base);
    await expect(page).toHaveURL(new RegExp(`${base}/events/${DEFAULT_EVENT_ID}$`));
    await expect(page.locator('.event-card.highlighted')).toBeVisible();
  });

  test('an unknown pipeline shows an error', REACT_ONLY, async ({ page }) => {
    await page.goto(`/v2/pipelines/${INVALID_PIPELINE_ID}/events`);
    await expect(page.locator('#pipeline-error')).toBeVisible();
  });

  test('a pipeline without events says so', async ({ page }) => {
    await page.goto(`/v2/pipelines/${PIPELINE_WITH_NO_EVENTS_ID}/events`);
    await expect(page.locator('#no-events')).toBeVisible();
  });

  test('an unknown event id shows an invalid-event message', async ({ page, api }) => {
    api.get('/events/:id', () => [404, { message: 'nope' }]);
    await page.goto(`${base}/events/9999`);
    await expect(page.locator('#invalid-event')).toBeVisible();
  });

  test('the rail buttons and the workflow buttons share one centre line', REACT_ONLY, async ({ page }) => {
    await page.goto(`${base}/events/${DEFAULT_EVENT_ID}`);

    const ids = ['#search-for-event-button', '#start-event-button', '#show-workflow-graph-button', '#show-workflow-table-button', '#restart-event-button'];
    const centres: number[] = [];

    for (const id of ids) {
      const box = await page.locator(id).boundingBox();

      expect(box, id).not.toBeNull();
      centres.push((box as { y: number; height: number }).y + (box as { y: number; height: number }).height / 2);
    }
    centres.forEach((c, i) => expect(Math.abs(c - (centres[1] as number)), ids[i]).toBeLessThanOrEqual(1));
  });

  test('the first event card starts level with the graph toolbar controls', REACT_ONLY, async ({ page }) => {
    await page.goto(`${base}/events/${DEFAULT_EVENT_ID}`);
    await page.locator('.wg-toolbar input').waitFor();

    const card = await page.locator('.event-card').first().boundingBox();
    const control = await page.locator('.wg-toolbar input').boundingBox();

    expect(Math.abs((card as { y: number }).y - (control as { y: number }).y)).toBeLessThanOrEqual(1);
  });

  test('the workflow can switch between the graph and the jobs table', REACT_ONLY, async ({ page }) => {
    await page.goto(`${base}/events/${DEFAULT_EVENT_ID}`);
    await page.locator('#show-workflow-table-button').click();
    await expect(page.locator('#jobs-page-table')).toBeVisible();
    await expect(page.locator('#jobs-page-table tr[data-job="main"]')).toBeVisible();
    await page.locator('#show-workflow-graph-button').click();
    await expect(page.locator('#jobs-page-table')).toHaveCount(0);
  });

  test('pulls open the newest pull request', async ({ page }) => {
    await page.goto(`${base}/pulls`);
    await expect(page).toHaveURL(new RegExp(`${base}/pulls/\\d+$`));
    await expect(page.locator('#event-rail')).toBeVisible();
  });

  test('options redirects to settings', REACT_ONLY, async ({ page }) => {
    await page.goto(`${base}/options`);
    await expect(page).toHaveURL(new RegExp(`${base}/settings$`));
  });

  test('the jobs page lists the pipeline jobs', REACT_ONLY, async ({ page }) => {
    await page.goto(`${base}/jobs`);
    const table = page.locator('#jobs-page-table');

    await expect(table.locator('tr[data-job="main"]')).toBeVisible();
    await expect(table.locator('tr[data-job="publish"]')).toBeVisible();
    await expect(table.locator('tr[data-job^="PR-"]')).toHaveCount(0);
  });

  test('the jobs table has the Ember columns, a name filter and a pinned footer', REACT_ONLY, async ({ page }) => {
    await page.goto(`${base}/jobs`);
    const table = page.locator('#jobs-page-table');

    for (const name of ['JOB', 'HISTORY', 'DURATION', 'START TIME', 'COVERAGE', 'STAGE', 'METRICS', 'ACTIONS']) {
      await expect(table.getByRole('columnheader', { name: new RegExp(`^${name}`, 'i') })).toBeVisible();
    }
    await expect(page.getByText(/^Show 1 - \d+ of \d+$/)).toBeVisible();
    await page.getByRole('textbox', { name: 'Filter by Job' }).fill('zzz-no-such-job');
    await expect(table.locator('tbody tr[data-job]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Clear Job filter' }).click();
    await expect(table.locator('tr[data-job="main"]')).toBeVisible();
  });

  test('disabling a job sends the new state', REACT_ONLY, async ({ page, api }) => {
    let body: unknown;

    api.put('/jobs/:id', req => {
      body = JSON.parse(req.requestBody ?? '{}');

      return [200, {}];
    });
    await page.goto(`${base}/jobs`);
    await page.locator('tr[data-job="main"]').getByRole('button', { name: 'Disable main' }).click();
    await page.locator('.modal-dialog input').fill('maintenance');
    await page.locator('.modal-footer .confirm').click();
    await expect.poll(() => body).toEqual({ state: 'DISABLED', stateChangeMessage: 'maintenance' });
  });

  test('secrets list and create', REACT_ONLY, async ({ page, api }) => {
    let body: Record<string, unknown> | undefined;

    api.post('/secrets', req => {
      body = JSON.parse(req.requestBody ?? '{}');

      return [201, { id: 1, ...body }];
    });
    await page.goto(`${base}/secrets`);
    await expect(page.locator('#secrets-table')).toContainText('BATMAN');
    await expect(page.locator('#secrets-table')).toContainText('ROBIN');
    await page.locator('#add-secret').click();
    await page.locator('#secret-name').fill('JOKER');
    await page.locator('#secret-value').fill('ha');
    await page.locator('.modal-footer .confirm').click();
    await expect.poll(() => body).toMatchObject({ pipelineId: PIPELINE_ID, name: 'JOKER', value: 'ha', allowInPR: false });
  });

  test('tokens list on /tokens and /secrets/tokens', REACT_ONLY, async ({ page }) => {
    await page.goto(`${base}/tokens`);
    await expect(page.locator('#tokens-table')).toContainText('foofoo');
    await page.goto(`${base}/secrets/tokens`);
    await expect(page.locator('#tokens-table')).toContainText('barbar');
  });

  test('creating a token sends the expiry and permission', REACT_ONLY, async ({ page, api }) => {
    let body: Record<string, unknown> | undefined;

    api.post('/pipelines/:id/tokens', req => {
      body = JSON.parse(req.requestBody ?? '{}');

      return [201, { id: 99, ...body, value: 'NEWVALUE' }];
    });
    await page.goto(`${base}/tokens`);
    await page.locator('#add-token').click();
    await page.locator('#token-name').fill('e2e');
    await page.locator('#token-permission').selectOption('execute');
    await page.locator('#token-expiry').selectOption('never');
    await page.locator('.modal-footer .confirm').click();
    await expect(page.locator('#token-value')).toHaveText('NEWVALUE');
    await expect(page.locator('#copy-token')).toBeVisible();
    await expect.poll(() => body).toMatchObject({ name: 'e2e', expiresAt: '', options: { permission: 'execute' } });
  });

  test('settings toggles save the pipeline', REACT_ONLY, async ({ page, api }) => {
    let body: { settings?: Record<string, unknown> } | undefined;

    api.put('/pipelines/:id', req => {
      body = JSON.parse(req.requestBody ?? '{}');

      return [200, {}];
    });
    await page.goto(`${base}/settings/preferences`);
    await page.locator('#setting-filterSchedulerEvents').click();
    await expect.poll(() => body?.settings?.filterSchedulerEvents).toBe(true);
  });

  test('settings sub pages render', REACT_ONLY, async ({ page }) => {
    for (const section of ['jobs', 'cache', 'metrics', 'preferences']) {
      await page.goto(`${base}/settings/${section}`);
      await expect(page.locator('.settings-tabs .nav-link.active')).toBeVisible();
    }
  });

  test('settings pipeline tab shows the Ember cards', REACT_ONLY, async ({ page }) => {
    await page.goto(`${base}/settings`);
    for (const title of ['Pipeline alias', 'Sync Pipeline', 'Delete this pipeline']) {
      await expect(page.locator('.settings-card-title', { hasText: title })).toBeVisible();
    }
    await expect(page.locator('#settings-delete')).toHaveCSS('border-top-width', '1px');
  });

  test('metrics shows a chart for the range', REACT_ONLY, async ({ page, api }) => {
    api.get('/pipelines/:id/metrics', () => [200, mockMetrics]);
    await page.goto(`${base}/metrics`);
    await expect(page.locator('svg.metrics-chart')).toBeVisible();
    await expect(page.locator('svg.metrics-chart g[data-event]')).toHaveCount(mockMetrics.length);
    for (const id of ['metrics-downtime', 'metrics-build-count', 'metrics-builds']) {
      await expect(page.locator(`#${id} svg.viz-chart`)).toBeVisible();
    }
    await expect(page.locator('#metrics-steps')).toContainText('Please select a job below');
  });

  for (const viewport of VIEWPORTS) {
    test(`metrics does not scroll the page at ${viewport.width}x${viewport.height}`, REACT_ONLY, async ({ page, api }) => {
      api.get('/pipelines/:id/metrics', () => [200, mockMetrics]);
      await page.setViewportSize(viewport);
      await page.goto(`${base}/metrics`);
      await expect(page.locator('svg.metrics-chart')).toBeVisible();
      await expectNoPageScroll(page);
    });
  }

  test('child pipelines list and start all', REACT_ONLY, async ({ page, api }) => {
    let started = false;

    api.post('/pipelines/:id/startall', () => {
      started = true;

      return [200, {}];
    });
    await page.goto(`/v2/pipelines/${PARENT_PIPELINE_ID}/child-pipelines`);
    await expect(page.locator('#children-table')).toContainText('child/one');
    await expect(page.locator('#children-table')).toContainText('child/two');
    await page.locator('#start-all-children').click();
    await page.locator('#start-all-modal .confirm').click();
    await expect.poll(() => started).toBe(true);
  });

  for (const viewport of VIEWPORTS) {
    for (const path of ['events/1', 'jobs', 'secrets', 'settings']) {
      test(`${path} does not scroll the page at ${viewport.width}x${viewport.height}`, REACT_ONLY, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(`${base}/${path}`);
        await expect(page.locator('.pipeline-header')).toBeVisible();
        await expect(page.locator('.pipeline-header')).toBeVisible();
        await expectNoPageScroll(page);
      });
    }
  }
});
