import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { invalidateSession } from 'ember-simple-auth/test-support';
import { getPageTitle } from 'ember-page-title/test-support';
import {
  childPipeline2,
  PARENT_PIPELINE_ID,
  PIPELINE_ID
} from '../../../mock/pipeline';

module('Acceptance | pipelines/:id/child-pipelines', hooks => {
  const mockApi = setupApplicationTest(hooks);

  const TEST_URL = `/v2/pipelines/${PARENT_PIPELINE_ID}/child-pipelines`;
  const EMPTY_TEST_URL = `/v2/pipelines/${PIPELINE_ID}/child-pipelines`;

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

  test('visiting a pipeline without child pipelines', async assert => {
    await visit(EMPTY_TEST_URL);

    assert.strictEqual(currentURL(), EMPTY_TEST_URL);
    assert.dom('#child-pipelines-nav-link').exists();
    assert.dom('#child-pipelines-nav-link').hasClass('active');
    assert
      .dom('#no-child-pipelines-message')
      .hasText('No child pipeline(s) created');
    assert.dom('#start-all-button-container').doesNotExist();
    assert.dom('#child-pipeline-table-container').isNotVisible();
  });

  test('visiting a pipeline with only an inactive child pipeline', async assert => {
    mockApi.get('/pipelines', request => {
      const { configPipelineId } = request.queryParams;

      return configPipelineId === `${PIPELINE_ID}`
        ? [200, [childPipeline2]]
        : [200, []];
    });

    await visit(EMPTY_TEST_URL);

    assert.strictEqual(currentURL(), EMPTY_TEST_URL);
    assert.dom('#child-pipelines-nav-link').hasClass('active');
    assert.dom('#child-pipeline-table-container').isVisible();
    assert.dom('#no-child-pipelines-message').doesNotExist();
    assert.dom('#start-all-button').isDisabled();
    assert.dom('.actions-cell button').exists();
  });

  test('switching pipelines updates child pipeline data', async assert => {
    await visit(TEST_URL);

    assert.dom('#child-pipelines').exists();
    assert.dom('#no-child-pipelines-message').doesNotExist();

    await visit(EMPTY_TEST_URL);

    assert.dom('#child-pipeline-table-container').isNotVisible();
    assert
      .dom('#no-child-pipelines-message')
      .hasText('No child pipeline(s) created');

    await visit(TEST_URL);

    assert.dom('#child-pipelines').exists();
    assert.dom('#no-child-pipelines-message').doesNotExist();
  });
});
