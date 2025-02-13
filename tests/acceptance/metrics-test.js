import { visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';

import { hasCollections } from 'screwdriver-ui/tests/mock/collections';
import makePipeline from '../mock/pipeline';
import makeMetrics from '../mock/metrics';
import makeJobs from '../mock/jobs';
import makeGraph from '../mock/workflow-graph';

let server;

module('Acceptance | metrics', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    const graph = makeGraph();
    const metrics = makeMetrics();
    const jobs = makeJobs();
    const pipeline = makePipeline(graph);

    server = new Pretender();
    server.get('http://localhost:8080/v4/collections', hasCollections);

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

    server.get('http://localhost:8080/v4/banners', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('visiting /pipelines/4/metrics', async function (assert) {
    await authenticateSession({ token: 'fakeToken' });
    await visit('/pipelines/4/metrics');

    assert.dom('.chart-c3').exists({ count: 3 });
    assert.dom('.range-selection button').exists({ count: 7 });
    assert.dom('.custom-date-selection input').exists({ count: 1 });
    assert.dom('.filters-selection input').exists({ count: 1 });
    assert.dom('.chart-pipeline-info .measure').exists({ count: 5 });
    assert.dom('.chart-c3 svg').exists({ count: 6 });
    assert.dom('.chart-c3 .c3-event-rects').exists({ count: 3 });
    assert.dom('.chart-cta').exists({ count: 1 });
    assert.dom('.chart-cta select').exists({ count: 1 });
  });
});
