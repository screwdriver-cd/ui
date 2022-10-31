import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
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
  icon: 'question-circle',
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

    await waitFor('.commit-status svg.fa-question-circle');

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
      .hasClass('fa-question-circle');
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
      .dom('.start-time-badge span:nth-of-type(2)')
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
});
