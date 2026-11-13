import { expect, test } from '../support/app';
import { REACT_ONLY } from '../support/ember';
import { ui } from '../support/pages/ui';

const validResult = {
  errors: [],
  jobs: { main: [{ image: 'node:20', commands: [{ name: 'install', command: 'npm ci' }] }] },
  workflowGraph: { nodes: [{ name: '~commit' }, { name: 'main' }], edges: [{ src: '~commit', dest: 'main' }] }
};

test.describe('validator', () => {
  test('validates typed yaml against the API and shows the result', async ({ page, api }) => {
    api.post('/validator', () => [200, validResult]);
    await page.goto('/validator');

    await ui(page).yamlEditor().click();
    await page.keyboard.type('jobs:');
    await expect(page.getByText('npm ci')).toBeVisible();
    expect(api.requests(/^\/validator$/).length).toBeGreaterThan(0);
  });

  test('draws the workflow graph with its stages', REACT_ONLY, async ({ page, api }) => {
    // React only: Ember draws the graph with d3; this checks the React Flow graph.
    api.post('/validator', () => [
      200,
      {
        ...validResult,
        jobs: { ...validResult.jobs, deploy: [{ image: 'node:20' }] },
        stages: { production: { description: 'ship it' } },
        workflowGraph: {
          nodes: [{ name: '~commit' }, { name: 'main' }, { name: 'deploy', stageName: 'production' }],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: 'main', dest: 'deploy' }
          ]
        }
      }
    ]);
    await page.goto('/validator');
    await page.locator('.cm-content').click();
    await page.keyboard.type('jobs:');

    const graph = page.getByTestId('validator-graph');

    await expect(graph.locator('.react-flow__node', { hasText: 'deploy' })).toBeVisible();
    await expect(graph.locator('.react-flow__node', { hasText: 'production' })).toBeVisible();
    if (process.env.E2E_SHOT) await page.screenshot({ path: process.env.E2E_SHOT });
  });

  test('a job in the graph scrolls to its definition, and a definition selects its job', REACT_ONLY, async ({ page, api }) => {
    // React only: Ember lists the jobs under the graph without linking them.
    const jobs = Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [`job${i}`, [{ image: 'node:20', commands: [{ name: 'run', command: `step ${i}` }] }]])
    );

    api.post('/validator', () => [
      200,
      {
        errors: [],
        jobs,
        workflowGraph: {
          nodes: [{ name: '~commit' }, ...Object.keys(jobs).map(name => ({ name }))],
          edges: Object.keys(jobs).map((name, i) => ({ src: i ? `job${i - 1}` : '~commit', dest: name }))
        }
      }
    ]);
    await page.goto('/validator');
    await page.locator('.cm-content').click();
    await page.keyboard.type('jobs:');

    const graph = page.getByTestId('validator-graph');
    const panel = (name: string) => page.locator('details', { has: page.getByRole('heading', { name, exact: true }) });

    await expect(graph.locator('[data-node="job11"]')).toBeAttached();
    await expect(panel('job11')).not.toBeInViewport();

    await graph.locator('[data-node="job11"]').click();
    await expect(panel('job11')).toBeInViewport();
    await expect(panel('job11')).toHaveAttribute('data-active');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // The graph stays where it is while the definitions scroll.
    await expect(graph).toBeInViewport({ ratio: 1 });

    await panel('job10').getByRole('heading').click();
    await expect(panel('job10')).not.toHaveAttribute('open');
    await expect(graph.locator('[data-node="job10"]')).toHaveClass(/wg-tier--focus/);

    await page.getByRole('button', { name: 'Expand all' }).click();
    await expect(panel('job10')).toHaveAttribute('open');
  });

  test('shows errors returned by the API', async ({ page, api }) => {
    api.post('/validator', () => [200, { errors: ['jobs.main: bad requires'], jobs: {} }]);
    await page.goto('/validator');
    await ui(page).yamlEditor().click();
    await page.keyboard.type('jobs:');
    await expect(page.getByText('jobs.main: bad requires')).toBeVisible();
  });

  test('typing during IME composition does not call the API until it ends', REACT_ONLY, async ({ page, api }) => {
    // React only: CodeMirror-specific composition handling; Ember uses ace.
    api.post('/validator', () => [200, validResult]);
    await page.goto('/validator');
    const content = page.locator('.cm-content');

    await content.click();
    await content.evaluate(el => el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
    await page.waitForTimeout(500);
    expect(api.requests(/^\/validator$/)).toHaveLength(0);
  });

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 }
  ]) {
    // React only: no page scroll is a rewrite requirement (Ember scrolls the page).
    test(`does not scroll the page at ${viewport.width}x${viewport.height}`, REACT_ONLY, async ({ page, api }) => {
      api.post('/validator', () => [200, validResult]);
      await page.setViewportSize(viewport);
      await page.goto('/validator');
      await ui(page).yamlEditor().click();
      await page.keyboard.type('jobs:');
      await expect(page.getByText('npm ci')).toBeVisible();

      const overflow = await page.evaluate(() => (document.scrollingElement as Element).scrollHeight - window.innerHeight);

      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('create pipeline', () => {
  test.beforeEach(({ api }) => {
    api.get('/templates', () => [200, []]); // Ember's create page fetches templates
    api.get('/collections', () => [200, []]); // and the collections sidebar after creating
  });

  test('submit is disabled until the repo url is valid', async ({ page }) => {
    await page.goto('/create');
    const submit = page.getByRole('button', { name: 'Create Pipeline' });

    await expect(submit).toBeDisabled();
    await page.getByPlaceholder(/Enter your repository url/).fill('git@github.com:org/repo.git#main');
    await expect(submit).toBeEnabled();
  });

  test('creates the pipeline and goes to it', async ({ page, api }) => {
    let body: unknown;

    api.post('/pipelines', req => {
      body = JSON.parse(req.requestBody ?? '{}');

      return [200, { id: 5 }];
    });
    await page.goto('/create');
    await page.getByPlaceholder(/Enter your repository url/).fill('git@github.com:org/repo.git#main');
    await page.getByRole('button', { name: 'Create Pipeline' }).click();

    await expect(page).toHaveURL(/\/pipelines\/5/);
    expect(body).toMatchObject({ checkoutUrl: 'git@github.com:org/repo.git#main' });
  });

  test('an existing pipeline (409) opens that pipeline', REACT_ONLY, async ({ page, api }) => {
    // React only: Ember handles the 409 differently (shows an error); the redirect is a rewrite behaviour.
    api.post('/pipelines', () => [409, { message: 'exists', data: { existingId: 5 } }]);
    await page.goto('/create');
    await page.getByPlaceholder(/Enter your repository url/).fill('git@github.com:org/repo.git');
    await page.getByRole('button', { name: 'Create Pipeline' }).click();
    await expect(page).toHaveURL(/\/pipelines\/5/);
  });
});
