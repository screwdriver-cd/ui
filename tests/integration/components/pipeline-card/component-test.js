import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render, waitFor } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { resolve } from 'rsvp';
import sinon from 'sinon';
import $ from 'jquery';
import Pretender from 'pretender';

let server;
const hasEmptyMetrics = () => [
  200,
  { 'Content-Type': 'application/json' },
  JSON.stringify([])
];

const mockPipeline = EmberObject.create({
  id: 1,
  scmRepo: {
    branch: 'master',
    name: 'screwdriver-cd/ui',
    rootDir: '',
    url: 'https://github.com/screwdriver-cd/ui/tree/master'
  },
  branch: 'master',
  metrics: resolve([])
});
const lastEventInfo = EmberObject.create({
  startTime: '--/--/----',
  statusColor: 'build-empty',
  durationText: '--',
  sha: 'Not available',
  icon: 'circle-question',
  commitMessage: 'No events have been run for this pipeline',
  commitUrl: '#'
});
const removePipelineSpy = sinon.spy();
const selectPipelineSpy = sinon.spy();
const deselectPipelineSpy = sinon.spy();

module('Integration | Component | pipeline card', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
    server.get('http://localhost:8080/v4/pipelines/1/metrics', hasEmptyMetrics);

    this.setProperties({
      pipeline: mockPipeline,
      removePipeline: removePipelineSpy,
      selectPipeline: selectPipelineSpy,
      deselectPipeline: deselectPipelineSpy,
      isAuthenticated: true,
      isOrganizing: false,
      reset: false
    });

    // make sure component is in viewport to trigger didEnterView event
    document.getElementById('ember-testing').scrollIntoView();
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it renders', async function (assert) {
    assert.expect(12);
    this.owner.setupRouter();

    await render(hbs`<PipelineCard
        @pipeline={{this.pipeline}}
      />
    `);

    await waitFor('.commit-status svg.fa-circle-question');

    assert.dom('.branch-info a').hasText(mockPipeline.scmRepo.name);
    assert
      .dom('.branch-info a')
      .hasAttribute('href', `/pipelines/${mockPipeline.id}`);
    assert.dom('.commit-info').exists({ count: 1 });
    assert
      .dom('.commit-status a:nth-of-type(1)')
      .hasAttribute('href', `/pipelines/${mockPipeline.id}`);
    assert
      .dom('.commit-status a:nth-of-type(1) svg')
      .hasClass('fa-circle-question');
    assert.dom('.commit-status a:nth-of-type(2)').hasText(lastEventInfo.sha);
    assert
      .dom('.commit-status a:nth-of-type(2)')
      .hasAttribute('href', lastEventInfo.commitUrl);
    assert.dom('.commit-message').hasText(lastEventInfo.commitMessage);
    assert.dom('.time-metrics').exists({ count: 1 });
    assert
      .dom('.duration-badge span:nth-of-type(2)')
      .hasText(lastEventInfo.durationText);
    assert
      .dom('.last-run-badge span:nth-of-type(2)')
      .hasText(lastEventInfo.startTime);
    assert.dom('.events-thumbnail-wrapper').exists({ count: 1 });
  });

  test('it renders no remove button and no checkbox when not authenticated', async function (assert) {
    this.set('isAuthenticated', false);

    await render(hbs`<CollectionTableRow
        @pipeline={{this.pipeline}}
        @isAuthenticated={{this.isAuthenticated}}
      />
    `);

    assert.dom('td.collection-pipeline__choose input').doesNotExist();
    assert.dom('td.collection-pipeline__remove span').doesNotExist();
  });

  test('it renders with a checkbox when organizing', async function (assert) {
    this.set('isOrganizing', true);

    await render(hbs`<CollectionTableRow
        @pipeline={{this.pipeline}}
        @isOrganizing={{this.isOrganizing}}
        @isAuthenticated={{this.isAuthenticated}}
      />
    `);

    assert.dom('td.collection-pipeline__choose input').exists();
    assert.dom('td.collection-pipeline__remove span').doesNotExist();
  });

  test('it renders with a remove button when not organizing', async function (assert) {
    await render(hbs`<PipelineCard
        @pipeline={{this.pipeline}}
        @isOrganizing={{this.isOrganizing}}
        @isAuthenticated={{this.isAuthenticated}}
      />
    `);

    assert.dom('.checkbox-container').doesNotExist();
    assert.dom('.remove-button').exists();
  });

  test('it deletes the pipeline displayed', async function (assert) {
    await render(hbs`<PipelineCard
        @pipeline={{this.pipeline}}
        @isOrganizing={{this.isOrganizing}}
        @isAuthenticated={{this.isAuthenticated}}
        @removePipeline={{this.removePipeline}}
      />
    `);

    await click('.remove-button');
    assert.ok(removePipelineSpy.calledWith(mockPipeline.id));
  });

  test('it selects and deselects the pipeline displayed', async function (assert) {
    this.set('isOrganizing', true);

    await render(hbs`<PipelineCard
        @pipeline={{this.pipeline}}
        @isOrganizing={{this.isOrganizing}}
        @isAuthenticated={{this.isAuthenticated}}
        @selectPipeline={{this.selectPipeline}}
        @deselectPipeline={{this.deselectPipeline}}
      />
    `);

    await click('.checkbox-container input');
    assert.ok(selectPipelineSpy.calledWith(mockPipeline.id));
    assert.equal($('.checkbox-container input').val(), 'true');

    await click('.checkbox-container input');
    assert.ok(deselectPipelineSpy.calledWith(mockPipeline.id));
    assert.equal($('.checkbox-container input').val(), 'false');
  });

  test('it renders build with warning', async function (assert) {
    assert.expect(6);
    const normalBuilds = [
      {
        meta: {
          build: {
            buildId: 1
          }
        }
      },
      {
        meta: {
          build: {
            buildId: 2
          }
        }
      }
    ];
    const buildsWithWarning = [
      {
        meta: {
          build: {
            buildId: 1,
            warning: true
          }
        }
      },
      {
        meta: {
          build: {
            buildId: 2
          }
        }
      }
    ];
    const mockMetrics = [
      {
        builds: buildsWithWarning,
        id: 3,
        createTime: '2020-10-06T17:57:53.388Z',
        causeMessage: 'Manually started by klu909',
        sha: '9af92ba134322',
        commit: {
          message: '3',
          url: 'https://github.com/batman/foo/commit/9af92ba134322'
        },
        duration: 14,
        status: 'SUCCESS'
      },
      {
        builds: normalBuilds,
        id: 2,
        createTime: '2020-10-07T17:47:55.089Z',
        sha: '9af9234ba134321',
        commit: {
          message: '2',
          url: 'https://github.com/batman/foo/commit/9af92ba134321'
        },
        duration: 20,
        status: 'SUCCESS'
      },
      {
        builds: buildsWithWarning,
        id: 3,
        createTime: '2020-10-08T18:07:55.089Z',
        sha: '9af92c4ba134321',
        commit: {
          message: '2',
          url: 'https://github.com/batman/foo/commit/9af92ba134321'
        },
        duration: 30,
        status: 'FAILURE'
      },
      {
        builds: buildsWithWarning,
        id: 4,
        createTime: '2020-10-10T18:27:55.089Z',
        sha: '9af92c11ba134321',
        commit: {
          message: '2',
          url: 'https://github.com/batman/foo/commit/9af92ba134321'
        },
        duration: 50,
        status: 'ABORTED'
      }
    ];
    const mockPipelineWithMetrics = EmberObject.create({
      id: 1,
      scmRepo: {
        branch: 'master',
        name: 'screwdriver-cd/ui',
        rootDir: '',
        url: 'https://github.com/screwdriver-cd/ui/tree/master'
      },
      branch: 'master',
      metrics: resolve(mockMetrics)
    });

    this.set('pipeline', mockPipelineWithMetrics);

    await render(hbs`<PipelineCard
        @pipeline={{this.pipeline}}
        @isOrganizing={{this.isOrganizing}}
        @isAuthenticated={{this.isAuthenticated}}
        @selectPipeline={{this.selectPipeline}}
        @deselectPipeline={{this.deselectPipeline}}
      />
    `);

    // wait for svg to render
    await waitFor('.pipeline-card .commit-status svg', {
      count: 1,
      timeout: Infinity
    });

    assert.dom('.commit-status svg').hasClass('build-warning');
    assert.dom('.commit-status svg').hasClass('fa-circle-check');

    assert
      .dom('.events-thumbnail-wrapper rect:nth-of-type(1)')
      .hasClass('build-failure');
    assert
      .dom('.events-thumbnail-wrapper rect:nth-of-type(2)')
      .hasClass('build-failure');
    assert
      .dom('.events-thumbnail-wrapper rect:nth-of-type(3)')
      .hasClass('build-success');
    assert
      .dom('.events-thumbnail-wrapper rect:nth-of-type(4)')
      .hasClass('build-warning');
  });
});
