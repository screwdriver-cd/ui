import EmberObject from '@ember/object';
import { Promise as EmberPromise } from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, waitFor } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import $ from 'jquery';
import wait from 'ember-test-helpers/wait';
import Pretender from 'pretender';
import templateHelper from 'screwdriver-ui/utils/template';
const { getLastUpdatedTime } = templateHelper;

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
  metrics: EmberPromise.resolve([]),
  createTime: Date.now()
});
const lastEventInfo = EmberObject.create({
  startTime: '--/--/----',
  statusColor: 'build-empty',
  durationText: '--',
  sha: 'Not available',
  icon: 'question-circle',
  commitMessage: 'No events have been run for this pipeline',
  commitUrl: '#'
});
const removePipelineSpy = sinon.spy();
const selectPipelineSpy = sinon.spy();
const deselectPipelineSpy = sinon.spy();

module('Integration | Component | collection table row', function (hooks) {
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
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it renders', async function (assert) {
    assert.expect(13);
    this.owner.setupRouter();
    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
        viewportEnabled=true
      }}
    `);

    await wait();
    await waitFor('td.status a i.fa-question-circle');

    assert.dom('td.collection-pipeline__choose').exists({ count: 1 });
    assert.dom('td.app-id a').hasText(mockPipeline.scmRepo.name);
    assert
      .dom('td.app-id a')
      .hasAttribute('href', `/pipelines/${mockPipeline.id}`);
    assert.dom('td.branch').hasText(mockPipeline.branch);
    assert
      .dom('td.status a:nth-of-type(1)')
      .hasAttribute('href', `/pipelines/${mockPipeline.id}`);
    assert.dom('td.status a:nth-of-type(1) i').hasClass('fa-question-circle');
    assert.dom('td.status a:nth-of-type(2)').hasText(lastEventInfo.sha);
    assert
      .dom('td.status a:nth-of-type(2)')
      .hasAttribute('href', lastEventInfo.commitUrl);
    assert.dom('td.start').hasText(lastEventInfo.startTime);
    assert.dom('td.duration').hasText(lastEventInfo.durationText);
    assert.dom('td.last-run').hasText(
      getLastUpdatedTime({
        createTime: mockPipeline.createTime
      })
    );
    assert.dom('td.history').exists({ count: 1 });
    assert.dom('td.collection-pipeline__remove').exists({ count: 1 });

    // TODO: test nested components
  });

  test('it renders no remove button and no checkbox when not authenticated', async function (assert) {
    assert.expect(2);
    this.set('isAuthenticated', false);

    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
        isAuthenticated=isAuthenticated
      }}
    `);

    await wait();
    assert.dom('td.collection-pipeline__choose input').doesNotExist();
    assert.dom('td.collection-pipeline__remove span').doesNotExist();
  });

  test('it renders with a checkbox when organizing', async function (assert) {
    assert.expect(2);
    this.set('isOrganizing', true);

    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
        isOrganizing=isOrganizing
        isAuthenticated=isAuthenticated
      }}
    `);

    await wait();
    assert.dom('td.collection-pipeline__choose input').exists();
    assert.dom('td.collection-pipeline__remove span').doesNotExist();
  });

  test('it renders with a remove button when not organizing', async function (assert) {
    assert.expect(2);
    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
        isOrganizing=isOrganizing
        isAuthenticated=isAuthenticated
      }}
    `);

    await wait();
    assert.dom('td.collection-pipeline__choose input').doesNotExist();
    assert.dom('td.collection-pipeline__remove span').exists();
  });

  test('it deletes the pipeline displayed', async function (assert) {
    assert.expect(1);
    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
        isOrganizing=isOrganizing
        isAuthenticated=isAuthenticated
        removePipeline=removePipeline
      }}
    `);

    await wait();

    await click('.collection-pipeline__remove span');
    assert.ok(removePipelineSpy.calledWith(mockPipeline.id));
  });

  test('it selects and deselects the pipeline displayed', async function (assert) {
    assert.expect(4);
    this.set('isOrganizing', true);

    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
        isOrganizing=isOrganizing
        isAuthenticated=isAuthenticated
        selectPipeline=selectPipeline
        deselectPipeline=deselectPipeline
      }}
    `);

    await wait();

    await click('.collection-pipeline__choose input');
    assert.ok(selectPipelineSpy.calledWith(mockPipeline.id));
    assert.equal($('.collection-pipeline__choose input').val(), 'true');

    await click('.collection-pipeline__choose input');
    assert.ok(deselectPipelineSpy.calledWith(mockPipeline.id));
    assert.equal($('.collection-pipeline__choose input').val(), 'false');
  });
});
