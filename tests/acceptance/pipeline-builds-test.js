import { currentURL, visit, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { invalidateSession } from 'ember-simple-auth/test-support';
import { getPageTitle } from 'ember-page-title/test-support';

import { INVALID_PIPELINE_ID, PIPELINE_ID } from '../mock/pipeline';
import { mockEvents } from '../mock/events';
import { makeBuilds } from '../mock/builds';
import { mockJobs } from '../mock/jobs';

module('Acceptance | pipeline build', function (hooks) {
  const mockApi = setupApplicationTest(hooks);
  const desiredEventId = mockEvents[0].id;

  hooks.beforeEach(function () {
    mockApi.get('/jobs/:jobId/builds', request => {
      const jobId = parseInt(request.params.jobId, 10);

      return [200, makeBuilds(jobId)];
    });

    localStorage.setItem('oldUi', true);
  });

  hooks.afterEach(() => {
    localStorage.removeItem('oldUi');
  });

  test('visiting /pipelines/:id/builds/:buildId when logged in', async function (assert) {
    const buildId = 1000000;

    const service = this.owner.lookup('service:build-logs');

    service.getCache = () => {
      return 'cache';
    };

    mockApi.get('/jobs/:jobId', () => [200, mockJobs[0]]);
    mockApi.get(`/builds/${buildId}`, () => {
      const build = makeBuilds(desiredEventId)[0];

      build.id = buildId;
      build.jobId = mockJobs[0].id;
      build.status = 'FAILURE';

      return [200, build];
    });

    await visit(`/pipelines/${PIPELINE_ID}/builds/${buildId}`);

    assert.equal(
      currentURL(),
      `/pipelines/${PIPELINE_ID}/builds/${buildId}/steps/install`
    );

    assert.equal(
      getPageTitle(),
      'foo/bar > main > #abcd123',
      'Page title is correct'
    );
  });

  test('visiting /pipeline/:id if build not found', async function (assert) {
    mockApi.get('/builds/:id', () => [404, {}]);

    const url = `/pipelines/${PIPELINE_ID}/builds/404`;

    await visit(url);

    return settled().then(() => {
      assert.equal(currentURL(), url);
      assert.dom('.code').hasText('404');
    });
  });

  test('visiting /pipelines/:id when not logged in', async function (assert) {
    await invalidateSession();
    await visit(`/pipelines/${PIPELINE_ID}`);

    assert.equal(currentURL(), '/login');
  });

  test('visiting /pipelines/:id when logged in', async function (assert) {
    const controller = this.owner.lookup('controller:pipeline/events');

    await visit(`/pipelines/${PIPELINE_ID}`);

    assert.equal(
      currentURL(),
      `/pipelines/${PIPELINE_ID}/events/${desiredEventId}`
    );
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

  test('visiting /pipelines/:id with invalid pipeline', async function (assert) {
    await visit(`/pipelines/${INVALID_PIPELINE_ID}`);

    assert.equal(currentURL(), `/pipelines/${INVALID_PIPELINE_ID}`);
    assert.dom('.code').hasText('404');
  });
});
