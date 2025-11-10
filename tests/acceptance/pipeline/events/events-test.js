import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { invalidateSession } from 'ember-simple-auth/test-support';
import { getPageTitle } from 'ember-page-title/test-support';
import { DEFAULT_EVENT_ID, INVALID_EVENT_ID } from '../../../mock/events';
import { PIPELINE_ID } from '../../../mock/pipeline';

module('Acceptance | pipelines/:id/events', hooks => {
  setupApplicationTest(hooks);

  const BASE_URL = `/v2/pipelines/${PIPELINE_ID}/events`;

  test('visiting /pipelines/:id/events requires being logged in', async assert => {
    await invalidateSession();
    await visit(BASE_URL);

    assert.strictEqual(currentURL(), '/login');
  });

  test('visiting /pipelines/:id/events/:eventId requires being logged in', async assert => {
    await invalidateSession();
    await visit(`${BASE_URL}/${DEFAULT_EVENT_ID}`);

    assert.strictEqual(currentURL(), '/login');
  });

  test.skip('visiting /pipelines/:id/events/:eventId with an invalid event for pipeline', async assert => {
    await visit(`${BASE_URL}/${INVALID_EVENT_ID}`);

    assert.strictEqual(currentURL(), `${BASE_URL}/${INVALID_EVENT_ID}`);
    assert.dom('#invalid-event').exists();
  });

  test.skip('visiting /pipelines/:id/events/:eventId', async assert => {
    await visit(`${BASE_URL}/${DEFAULT_EVENT_ID}`);

    assert.strictEqual(currentURL(), `${BASE_URL}/${DEFAULT_EVENT_ID}`);
    assert.equal(getPageTitle(), 'foo/bar > Events');
  });
});
