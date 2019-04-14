import { findAll, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';

import makePipeline from '../mock/pipeline';
import makeMetrics from '../mock/metrics';
import makeJobs from '../mock/jobs';
import makeGraph from '../mock/workflow-graph';

let server;

module('Acceptance | metrics', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    const graph = makeGraph();
    const metrics = makeMetrics();
    const jobs = makeJobs();
    const pipeline = makePipeline(graph);

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

    server.get('http://localhost:8080/v4/pipelines/4/metrics', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(metrics)
    ]);
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('visiting /pipelines/4/metrics', async function(assert) {
    authenticateSession(this.application, { token: 'fakeToken' });

    await visit('/pipelines/4/metrics');

    wait().andThen(() => {
      assert.equal(findAll('.chart-c3').length, 2);
      assert.equal(findAll('.range-selection button').length, 7);
      assert.equal(findAll('.custom-date-selection input').length, 1);
      assert.equal(findAll('.filters-selection input').length, 1);
      assert.equal(findAll('.chart-pipeline-info .measure').length, 5);
      assert.equal(findAll('.chart-c3 svg').length, 2);
      assert.equal(findAll('.chart-c3 .c3-event-rects').length, 2);
      assert.equal(findAll('.chart-cta').length, 1);
      assert.equal(findAll('.chart-cta select').length, 1);
    });
  });
});
