import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';

import makePipeline from '../mock/pipeline';
import makeMetrics from '../mock/metrics';
import makeJobs from '../mock/jobs';
import makeGraph from '../mock/workflow-graph';

let server;

moduleForAcceptance('Acceptance | metrics', {
  beforeEach() {
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
  },
  afterEach() {
    server.shutdown();
  }
});

test('visiting /pipelines/4/metrics', function (assert) {
  authenticateSession(this.application, { token: 'fakeToken' });

  visit('/pipelines/4/metrics');

  wait().andThen(() => {
    assert.equal(find('.chart-c3').length, 2);
    assert.equal(find('.range-selection button').length, 5);
    assert.equal(find('.datetime-selection input').length, 2);
    assert.equal(find('.chart-pipeline-info .measure').length, 5);
    assert.equal(find('.chart-c3 svg').length, 2);
    assert.equal(find('.chart-c3 .c3-event-rects').length, 2);
  });
});
