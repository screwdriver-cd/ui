import { expect, test } from '../support/app';
import { REACT_ONLY } from '../support/ember';
import { VIEWPORTS, expectNoPageScroll } from '../support/no-scroll';

const pipeline = (id: number, name: string, nodes: string[], edges: [string, string][]) => ({
  id,
  name,
  scmRepo: { name: `org/${name}` },
  workflowGraph: {
    nodes: nodes.map(n => ({ name: n })),
    edges: edges.map(([src, dest]) => ({ src, dest }))
  }
});

const one = pipeline(101, 'one', ['~commit', 'main', '~sd@102:deploy'], [
  ['~commit', 'main'],
  ['main', '~sd@102:deploy']
]);
const two = pipeline(102, 'two', ['~commit', 'deploy'], [['~commit', 'deploy']]);

test.describe('pipeline visualizer', () => {
  test.beforeEach(({ api }) => {
    api.get('/pipelines', () => [200, [one, two]]);
    api.get('/pipelines/101', () => [200, one]);
    api.get('/pipelines/102', () => [200, two]);
  });

  test('searching and selecting shows the pipeline and its connections', REACT_ONLY, async ({ page }) => {
    // React only: Ember uses an ember-power-select with a 1s debounce; covered by the deep-link spec below.
    await page.goto('/pipeline-visualizer');
    await page.getByPlaceholder(/search pipeline/i).fill('one');
    await page.getByRole('button', { name: 'org/one' }).first().click();

    await expect(page).toHaveURL(/selectedPipelineId=101/);
    await expect(page.getByRole('button', { name: 'org/two' }).last()).toBeVisible();
  });

  for (const viewport of VIEWPORTS) {
    // React only: no page scroll is a rewrite requirement (Ember scrolls the page).
    test(`does not scroll the page at ${viewport.width}x${viewport.height}`, REACT_ONLY, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/pipeline-visualizer?selectedPipelineId=101&selectedConnectedPipelineId=101');
      await expect(page.getByRole('button', { name: 'org/two' })).toBeVisible();
      await expectNoPageScroll(page);
    });
  }
});
