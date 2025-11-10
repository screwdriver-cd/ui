import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { invalidateSession } from 'ember-simple-auth/test-support';
import { getPageTitle } from 'ember-page-title/test-support';
import { PIPELINE_ID } from '../../../mock/pipeline';

module('Acceptance | pipelines/:id/pulls', hooks => {
  setupApplicationTest(hooks);

  const TEST_URL = `/v2/pipelines/${PIPELINE_ID}/pulls`;

  test('visiting /pipelines/:id/pulls requires being logged in', async assert => {
    await invalidateSession();
    await visit(TEST_URL);

    assert.strictEqual(currentURL(), '/login');
  });

  test.skip('visiting /pipelines/:id/pulls', async assert => {
    await visit(TEST_URL);

    assert.strictEqual(currentURL(), `${TEST_URL}/3`);
    assert.equal(getPageTitle(), 'foo/bar > Pulls');
  });
});
