import { visit, currentURL } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { getPageTitle } from 'ember-page-title/test-support';

module('Acceptance | pipeline-visualizer', function (hooks) {
  const mockApi = setupApplicationTest(hooks);

  test('visiting /pipeline-visualizer', async assert => {
    mockApi.get('/auth/contexts', () => [200, {}]);

    await visit('/pipeline-visualizer');

    assert.equal(currentURL(), '/pipeline-visualizer');
    assert.equal(
      getPageTitle(),
      'Pipeline Visualizer',
      'Page title is correct'
    );
  });
});
