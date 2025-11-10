import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { invalidateSession } from 'ember-simple-auth/test-support';
import { getPageTitle } from 'ember-page-title/test-support';
import { PIPELINE_ID } from '../../../mock/pipeline';

module('Acceptance | pipelines/:id/jobs', hooks => {
  setupApplicationTest(hooks);

  const TEST_URL = `/v2/pipelines/${PIPELINE_ID}/jobs`;

  test('visiting /v2/pipelines/:id/jobs requires being logged in', async assert => {
    await invalidateSession();
    await visit(TEST_URL);

    assert.strictEqual(currentURL(), '/login');
  });

  test.skip('visiting /v2/pipelines/:id/jobs', async assert => {
    await visit(TEST_URL);

    assert.strictEqual(currentURL(), TEST_URL);
    assert.equal(getPageTitle(), 'foo/bar > Jobs');
  });
});
