import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import $ from 'jquery';

const mockPipeline = EmberObject.create({
  eventsInfo: [],
  lastEventInfo: [],
  id: 1
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
    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
      }}
    `);

    assert.dom('td.collection-pipeline__choose').exists({ count: 1 });
    assert.dom('td.app-id').exists({ count: 1 });
    assert.dom('td.branch').exists({ count: 1 });
    assert.dom('td.status').exists({ count: 1 });
    assert.dom('td.start').exists({ count: 1 });
    assert.dom('td.duration').exists({ count: 1 });
    assert.dom('td.history').exists({ count: 1 });
    assert.dom('td.collection-pipeline__remove').exists({ count: 1 });
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

  test('it can delete the pipeline displayed', async function(assert) {
    await render(hbs`
      {{collection-table-row
        pipeline=pipeline
        isOrganizing=isOrganizing
        isAuthenticated=isAuthenticated
        removePipeline=removePipeline
      }}
    `);

    await click('.collection-pipeline__remove span');
    assert.ok(removePipelineSpy.called);
  });

  test('it can select and deselect the pipeline displayed', async function(assert) {
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
    assert.ok(selectPipelineSpy.called);
    assert.equal($('.collection-pipeline__choose input').val(), 'true');

    await click('.collection-pipeline__choose input');
    assert.ok(deselectPipelineSpy.called);
    assert.equal($('.collection-pipeline__choose input').val(), 'false');
  });
});
