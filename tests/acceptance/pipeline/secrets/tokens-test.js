import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import {
  authenticateSession,
  invalidateSession
} from 'ember-simple-auth/test-support';
import { getPageTitle } from 'ember-page-title/test-support';
import { DEFAULT_EVENT_ID } from '../../../mock/events';
import { PIPELINE_ID } from '../../../mock/pipeline';
import { guestSession } from '../../../mock/sessions';

module('Acceptance | pipelines/:id/secrets/tokens', hooks => {
  setupApplicationTest(hooks);

  const BASE_URL = `/v2/pipelines/${PIPELINE_ID}`;
  const TEST_URL = `${BASE_URL}/secrets/tokens`;

  test('visiting /v2/pipelines/:id/secrets/tokens requires being logged in', async assert => {
    await invalidateSession();
    await visit(TEST_URL);

    assert.strictEqual(currentURL(), '/login');
  });

  test.skip('visiting /v2/pipelines/:id/secrets/tokens as guest', async assert => {
    await authenticateSession(guestSession);
    await visit(TEST_URL);

    assert.strictEqual(currentURL(), `${BASE_URL}/events/${DEFAULT_EVENT_ID}`);
  });

  test('visiting /v2/pipelines/:id/secrets/tokens', async assert => {
    await visit(TEST_URL);

    assert.strictEqual(currentURL(), TEST_URL);
    assert.dom('#secrets-nav-link').exists();
    assert.dom('#secrets-nav-link').hasClass('active');
    assert.equal(getPageTitle(), 'foo/bar > Tokens');
  });
});
