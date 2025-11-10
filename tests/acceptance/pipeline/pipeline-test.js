import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { invalidateSession } from 'ember-simple-auth/test-support';
import { setupApplicationTest } from '../../helpers';
import { DEFAULT_EVENT_ID } from '../../mock/events';
import {
  INVALID_PIPELINE_ID,
  PIPELINE_ID,
  PIPELINE_WITH_NO_EVENTS_ID
} from '../../mock/pipeline';

module('Acceptance | pipelines/:id', hooks => {
  setupApplicationTest(hooks);

  const BASE_URL = `/v2/pipelines`;

  test('visiting /v2/pipelines/:id requires being logged in', async assert => {
    await invalidateSession();
    await visit(`${BASE_URL}/${PIPELINE_ID}`);

    assert.strictEqual(currentURL(), '/login');
  });

  test('visiting /v2/pipelines/:id with an invalid pipeline', async assert => {
    await visit(`${BASE_URL}/${INVALID_PIPELINE_ID}`);

    assert.strictEqual(currentURL(), `${BASE_URL}/${INVALID_PIPELINE_ID}`);
    assert.dom('#appContainer .code').exists();
    assert.dom('#appContainer .code').hasText('404');
  });

  test.skip('visiting /v2/pipelines/:id with a pipeline with no events', async assert => {
    await visit(`${BASE_URL}/${PIPELINE_WITH_NO_EVENTS_ID}`);

    assert.strictEqual(
      currentURL(),
      `${BASE_URL}/${PIPELINE_WITH_NO_EVENTS_ID}/events`
    );
    assert.dom('#no-events').exists();
  });

  test.skip('visiting /v2/pipelines/:id', async assert => {
    await visit(`${BASE_URL}/${PIPELINE_ID}`);

    assert.strictEqual(
      currentURL(),
      `${BASE_URL}/${PIPELINE_ID}/events/${DEFAULT_EVENT_ID}`
    );
  });
});
