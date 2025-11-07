import { visit, waitFor } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';

import { pipeline, PIPELINE_ID } from '../mock/pipeline';
import { makeBuilds } from '../mock/builds';
import { mockGraph } from '../mock/workflow-graph';

module('Acceptance | pipeline pr-chain', function (hooks) {
  const mockApi = setupApplicationTest(hooks);

  test('visiting /pipelines/:id/pulls when the pipeline is enabled for prChain', async function (assert) {
    mockApi.get(`/pipelines/${PIPELINE_ID}`, () => [
      200,
      {
        ...pipeline,
        workflowGraph: mockGraph,
        prChain: true
      }
    ]);
    mockApi.get('/jobs/:jobId/builds', request => {
      const jobId = parseInt(request.params.jobId, 10);

      return [200, makeBuilds(jobId)];
    });

    await visit(`/pipelines/${PIPELINE_ID}/pulls`);

    assert.dom('#banners').exists({ count: 1 });
    assert
      .dom('a div.pipeline-name')
      .hasText('foo/bar', 'incorrect pipeline name');
    await waitFor('.pipelineWorkflow svg');
    assert
      .dom('.pipelineWorkflow svg')
      .exists({ count: 1 }, 'not enough workflow');
    assert.dom('ul.nav-pills').exists({ count: 1 }, 'should show tabs');
    assert.dom('.column-tabs-view .nav-link').hasText('Events');
    assert.dom('.column-tabs-view .nav-link.active').hasText('Pull Requests');
    assert
      .dom('.column-tabs-view .view .detail .commit')
      .hasText('PR-42 Start');
    assert.dom('.separator').exists({ count: 1 });
    assert.dom('.last-successful').doesNotExist();
    assert.dom('.latest-commit').doesNotExist();
  });
});
