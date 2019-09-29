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

module('Integration | Component | pipeline card', function(hooks) {
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
      {{pipeline-card
        pipeline=pipeline
      }}
    `);

    assert.dom('.branch-info a').hasText(mockPipeline.scmRepo.name);
    assert.dom('.branch-info a').hasAttribute('href', `/pipelines/${mockPipeline.id}`);
    assert.dom('.commit-info').exists({ count: 1 });
    assert.dom('.commit-status a').hasText(mockPipeline.lastEventInfo.sha);
    assert.dom('.commit-status a').hasAttribute('href', mockPipeline.lastEventInfo.commitUrl);
    assert.dom('.commit-message').hasText(mockPipeline.lastEventInfo.commitMessage);
    assert.dom('.time-metrics').exists({ count: 1 });
    assert
      .dom('.duration-badge span:nth-of-type(2)')
      .hasText(mockPipeline.lastEventInfo.durationText);
    assert
      .dom('.start-time-badge span:nth-of-type(2)')
      .hasText(mockPipeline.lastEventInfo.startTime);
    assert.dom('.events-thumbnail-wrapper').exists({ count: 1 });
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
      {{pipeline-card
        pipeline=pipeline
        isOrganizing=isOrganizing
        isAuthenticated=isAuthenticated
      }}
    `);

    assert.dom('.checkbox-container').doesNotExist();
    assert.dom('.remove-button').exists();
  });

  test('it deletes the pipeline displayed', async function(assert) {
    await render(hbs`
      {{pipeline-card
        pipeline=pipeline
        isOrganizing=isOrganizing
        isAuthenticated=isAuthenticated
        removePipeline=removePipeline
      }}
    `);

    await click('.remove-button');
    assert.ok(removePipelineSpy.calledWith(mockPipeline.id));
  });

  test('it selects and deselects the pipeline displayed', async function(assert) {
    this.set('isOrganizing', true);

    await render(hbs`
      {{pipeline-card
        pipeline=pipeline
        isOrganizing=isOrganizing
        isAuthenticated=isAuthenticated
        selectPipeline=selectPipeline
        deselectPipeline=deselectPipeline
      }}
    `);

    await click('.checkbox-container input');
    assert.ok(selectPipelineSpy.calledWith(mockPipeline.id));
    assert.equal($('.checkbox-container input').val(), 'true');

    await click('.checkbox-container input');
    assert.ok(deselectPipelineSpy.calledWith(mockPipeline.id));
    assert.equal($('.checkbox-container input').val(), 'false');
  });
});
