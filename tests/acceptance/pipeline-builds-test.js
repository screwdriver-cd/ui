import { currentURL, visit, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';
import { getPageTitle } from 'ember-page-title/test-support';

import makePipeline from '../mock/pipeline';
import makeEvents from '../mock/events';
import makeBuilds from '../mock/builds';
import makeGraph from '../mock/workflow-graph';
import makeJobs from '../mock/jobs';

import injectScmServiceStub from '../helpers/inject-scm';

let server;

let desiredEventId;

module('Acceptance | pipeline build', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    const graph = makeGraph();
    const jobs = makeJobs();
    const pipeline = makePipeline(graph);
    const events = makeEvents(graph);
    const desiredEvent = events.firstObject;

    desiredEventId = desiredEvent.id;
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

    server.get('http://localhost:8080/v4/pipelines/4/events', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(events)
    ]);

    server.get('http://localhost:8080/v4/events/:eventId', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(desiredEvent)
    ]);

    server.get('http://localhost:8080/v4/pipelines/4/triggers', () => [
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

    server.get('http://localhost:8080/v4/pipelines/4/stages', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/jobs/:jobId/builds', request => {
      const jobId = parseInt(request.params.jobId, 10);

      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(makeBuilds(jobId))
      ];
    });

    server.get('https://localhost:8080/v4/jobs/:jobId', request => {
      const jobId = parseInt(request.params.jobId, 10);

      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(makeJobs(jobId)[0])
      ];
    });

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/builds/1000000', () => {
      const build = makeBuilds(1000000)[0];

      build.id = 1000000;
      build.jobId = 12345;
      build.status = 'FAILURE';

      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(build)
      ];
    });

    server.get('http://localhost:8080/v4/builds/statuses', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/pipelines/4/latestCommitEvent', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);

    server.get('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);

    server.put('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        // {“1018240”:{“showPRJobs”:true},“1048190”:{“showPRJobs”:false},“displayJobNameLength”:30}
      })
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

  test('visiting /pipelines/4/builds/1000000 when logged in', async function (assert) {
    const pipelineId = 4;
    const buildId = 1000000;

    const service = this.owner.lookup('service:build-logs');

    service.getCache = () => {
      return 'cache';
    };

    await authenticateSession({ token: 'fakeToken' });

    await visit(`/pipelines/${pipelineId}/builds/${buildId}`);

    assert.equal(
      currentURL(),
      `/pipelines/${pipelineId}/builds/${buildId}/steps/install`
    );

    assert.equal(
      getPageTitle(),
      'foo/bar > main > #abcd123',
      'Page title is correct'
    );
  });

  test('it redirects to /pipeline/:pipeline_id if build not found', async function (assert) {
    const pipelineId = 4;
    const buildId = 1000000;

    server.get(`http://localhost:8080/v4/builds/${buildId}`, () => [
      404,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        error: 'Not Found',
        message: 'Build does not exist',
        statusCode: 404
      })
    ]);

    await authenticateSession({ token: 'fakeToken' });

    assert.step('visiting');

    await visit(`/pipelines/${pipelineId}/builds/${buildId}`);

    assert.step('after visit invocation');

    assert.step('after visit resolved');

    return settled().then(() => {
      assert.equal(
        currentURL(),
        `/pipelines/${pipelineId}/events/${desiredEventId}`
      );

      assert.verifySteps([
        'visiting',
        'after visit invocation',
        'after visit resolved'
      ]);
    });
  });

  test('visiting /pipelines/4 when not logged in', async function (assert) {
    await visit('/pipelines/4');

    assert.equal(currentURL(), '/login');
  });

  test('visiting /pipelines/4 when logged in', async function (assert) {
    injectScmServiceStub(this);

    const controller = this.owner.lookup('controller:pipeline/events');

    await authenticateSession({ token: 'fakeToken' });
    await visit('/pipelines/4');

    assert.equal(currentURL(), `/pipelines/4/events/${desiredEventId}`);
    assert.dom('#banners').exists({ count: 1 });
    assert.equal(getPageTitle(), 'foo/bar', 'Page title is correct');
    assert
      .dom('a div.pipeline-name')
      .hasText('foo/bar', 'Pipeline name is correct');
    assert
      .dom('.pipelineWorkflow svg')
      .exists({ count: 1 }, 'not enough workflow');
    assert
      .dom('button.start-button')
      .exists({ count: 1 }, 'should have a start button');
    assert.dom('ul.nav-pills').exists({ count: 1 }, 'should show tabs');
    assert.dom('.column-tabs-view .nav-link').hasText('Events');
    assert.dom('.column-tabs-view .nav-link.active').hasText('Events');
    assert
      .dom('.column-tabs-view .nav-link:not(.active)')
      .hasText('Pull Requests');
    assert.dom('.column-tabs-view').doesNotHaveClass('disabled');
    assert.dom('.separator').exists({ count: 1 });

    controller.set('showListView', true);

    await visit('/pipelines/4');

    assert.dom('.column-tabs-view').hasClass('disabled');
    await visit('/pipelines/4/pulls');
    assert.equal(currentURL(), '/pipelines/4/pulls');
    assert.dom('.column-tabs-view .nav-link.active').hasText('Pull Requests');
  });
});
