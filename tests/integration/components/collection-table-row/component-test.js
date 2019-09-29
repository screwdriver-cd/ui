import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import $ from 'jquery';

const mockPipeline = EmberObject.create({
  id: 1,
  eventsInfo: [],
  lastEventInfo: {
    commitMessage: 'No events have been run for this pipeline',
    commitUrl: '#',
    durationText: '--',
    icon: 'fas fa-question-circle',
    sha: 'Not available',
    startTime: '--/--/----',
    statusColor: '$sd-no-build'
  },
  scmRepo: {
    branch: 'master',
    name: 'screwdriver-cd/ui',
    rootDir: '',
    url: 'https://github.com/screwdriver-cd/ui/tree/master'
  },
  branch: 'master'
});
const removePipelineSpy = sinon.spy();
const selectPipelineSpy = sinon.spy();
const deselectPipelineSpy = sinon.spy();

module('Integration | Component | collection table row', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
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

  test('it renders', async function(assert) {
    this.owner.setupRouter();

    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
      }}
    `);

    assert.dom('td.collection-pipeline__choose').exists({ count: 1 });
    assert.dom('td.app-id a').hasText(mockPipeline.scmRepo.name);
    assert.dom('td.app-id a').hasAttribute('href', `/pipelines/${mockPipeline.id}`);
    assert.dom('td.branch').hasText(mockPipeline.branch);
    assert.dom('td.status a').hasText(mockPipeline.lastEventInfo.sha);
    assert.dom('td.status a').hasAttribute('href', mockPipeline.lastEventInfo.commitUrl);
    assert.dom('td.start').hasText(mockPipeline.lastEventInfo.startTime);
    assert.dom('td.duration').hasText(mockPipeline.lastEventInfo.durationText);
    assert.dom('td.history').exists({ count: 1 });
    assert.dom('td.collection-pipeline__remove').exists({ count: 1 });

    // TODO: test nested components
  });

  test('it renders no remove button and no checkbox when not authenticated', async function(assert) {
    this.set('isAuthenticated', false);

    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
        isAuthenticated=isAuthenticated
      }}
    `);

    assert.dom('td.collection-pipeline__choose input').doesNotExist();
    assert.dom('td.collection-pipeline__remove span').doesNotExist();
  });

  test('it renders with a checkbox when organizing', async function(assert) {
    this.set('isOrganizing', true);

    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
        isOrganizing=isOrganizing
        isAuthenticated=isAuthenticated
      }}
    `);

    assert.dom('td.collection-pipeline__choose input').exists();
    assert.dom('td.collection-pipeline__remove span').doesNotExist();
  });

  test('it renders with a remove button when not organizing', async function(assert) {
    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
        isOrganizing=isOrganizing
        isAuthenticated=isAuthenticated
      }}
    `);

    assert.dom('td.collection-pipeline__choose input').doesNotExist();
    assert.dom('td.collection-pipeline__remove span').exists();
  });

  test('it deletes the pipeline displayed', async function(assert) {
    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
        isOrganizing=isOrganizing
        isAuthenticated=isAuthenticated
        removePipeline=removePipeline
      }}
    `);

    await click('.collection-pipeline__remove span');
    assert.ok(removePipelineSpy.calledWith(mockPipeline.id));
  });

  test('it selects and deselects the pipeline displayed', async function(assert) {
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

    await click('.collection-pipeline__choose input');
    assert.ok(selectPipelineSpy.calledWith(mockPipeline.id));
    assert.equal($('.collection-pipeline__choose input').val(), 'true');

    await click('.collection-pipeline__choose input');
    assert.ok(deselectPipelineSpy.calledWith(mockPipeline.id));
    assert.equal($('.collection-pipeline__choose input').val(), 'false');
  });
});
