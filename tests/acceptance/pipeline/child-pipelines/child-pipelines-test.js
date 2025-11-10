import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { invalidateSession } from 'ember-simple-auth/test-support';
import { getPageTitle } from 'ember-page-title/test-support';
import { PARENT_PIPELINE_ID } from '../../../mock/pipeline';

module('Acceptance | pipelines/:id/child-pipelines', hooks => {
  setupApplicationTest(hooks);

  const TEST_URL = `/v2/pipelines/${PARENT_PIPELINE_ID}/child-pipelines`;

  test('visiting /v2/pipelines/:id/child-pipelines requires being logged in', async assert => {
    await invalidateSession();
    await visit(TEST_URL);

    assert.strictEqual(currentURL(), '/login');
  });

  test('visiting /v2/pipelines/:id/child-pipelines', async assert => {
    await visit(TEST_URL);

    assert.strictEqual(currentURL(), TEST_URL);

    assert.dom('#child-pipelines-nav-link').exists();
    assert.dom('#child-pipelines-nav-link').hasClass('active');
    assert.equal(getPageTitle(), 'Child pipelines');
  });
});
