import { findAll, find, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';

import makePipeline from '../mock/pipeline';
import makeEvents from '../mock/events';
import makeBuilds from '../mock/builds';
import makeGraph from '../mock/workflow-graph';
import makeJobs from '../mock/jobs';

let server;

module('Acceptance | pipeline pr-chain', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
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

    server.get('http://localhost:8080/v4/pipelines/4/events', (request) => {
      const prNum = parseInt(request.queryParams.prNum, 10);

      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify([].concat(events.find(e => e.prNum === prNum)))
      ];
    });

    server.get('http://localhost:8080/v4/events/:eventId/builds', (request) => {
      const eventId = parseInt(request.params.eventId, 10);

      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(makeBuilds(eventId))
      ];
    });

    server.get('http://localhost:8080/v4/jobs/:jobId/builds', (request) => {
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
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('visiting /pipelines/4/pulls when the pipeline is enabled for prChain', async function(assert) {
    authenticateSession(this.application, { token: 'fakeToken' });

    await visit('/pipelines/4/pulls');

    wait().andThen(() => {
      assert.equal(find('a h1').textContent.trim(), 'foo/bar', 'incorrect pipeline name');
      assert.equal(findAll('.pipelineWorkflow svg').length, 1, 'not enough workflow');
      assert.equal(findAll('ul.nav-pills').length, 1, 'should show tabs');
      assert.equal(find('.column-tabs-view .nav-link').eq(0).text().trim(), 'Events');
      assert.equal(find('.column-tabs-view .nav-link.active').eq(0).text().trim(), 'Pull Requests');
      assert.equal(find('.column-tabs-view .nav-link').eq(1).text().trim(), 'Pull Requests');
      assert.equal(find('.column-tabs-view .view .detail .commit').eq(0).text().trim(), 'PR-42');
      assert.equal(findAll('.separator').length, 1);
      assert.equal(findAll('.partial-view').length, 2);
    });
  });
});
