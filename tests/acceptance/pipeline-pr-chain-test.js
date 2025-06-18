import { visit, waitFor } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';

import makePipeline from '../mock/pipeline';
import makeEvents from '../mock/events';
import makeBuilds from '../mock/builds';
import makeGraph from '../mock/workflow-graph';
import makeJobs from '../mock/jobs';

let server;

module('Acceptance | pipeline pr-chain', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    const graph = makeGraph();
    const jobs = makeJobs();
    const pipeline = makePipeline(graph);
    const events = makeEvents(graph);

    pipeline.prChain = true;

    server = new Pretender();

    server.get('http://localhost:8080/v4/pipelines/4', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(pipeline)
    ]);

    server.get('http://localhost:8080/v4/pipelines/4/jobs', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(jobs)
    ]);

    server.get('http://localhost:8080/v4/pipelines/4/events', request => {
      const prNum = parseInt(request.queryParams.prNum, 10);

      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify([].concat(events.find(e => e.prNum === prNum)))
      ];
    });

    server.get('http://localhost:8080/v4/pipelines/4/stages', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/events/:eventId/builds', request => {
      const eventId = parseInt(request.params.eventId, 10);

      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(makeBuilds(eventId))
      ];
    });

    server.get('http://localhost:8080/v4/jobs/:jobId/builds', request => {
      const jobId = parseInt(request.params.jobId, 10);

      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(makeBuilds(jobId))
      ];
    });

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/pipelines/4/latestCommitEvent', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({ id: '2', sha: 'abcdef1029384' })
    ]);
    server.get('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);

    server.get('http://localhost:8080/v4/banners', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('visiting /pipelines/4/pulls when the pipeline is enabled for prChain', async function (assert) {
    await authenticateSession({ token: 'fakeToken' });
    await visit('/pipelines/4/pulls');

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
