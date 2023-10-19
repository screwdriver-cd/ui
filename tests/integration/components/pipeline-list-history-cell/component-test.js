import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, triggerEvent } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';

const mockPipeline = EmberObject.create({
  id: 1
});

module(
  'Integration | Component | pipeline list history cell',
  function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
      this.setProperties({
        pipeline: mockPipeline
      });
    });

    test('it renders two', async function (assert) {
      this.set('record', {
        history: [
          {
            id: 1,
            status: 'RUNNING'
          },
          {
            id: 2,
            status: 'RUNNING'
          }
        ]
      });

      await render(hbs`<PipelineListHistoryCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle').hasClass('RUNNING');
      assert.dom('.fa-circle').exists({ count: 2 });
    });

    test('it renders one', async function (assert) {
      this.set('record', {
        history: [
          {
            id: 1,
            status: 'RUNNING'
          }
        ]
      });

      await render(hbs`<PipelineListHistoryCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle').hasClass('RUNNING');
      assert.dom('.fa-circle').exists({ count: 1 });
    });

    test('it renders success build', async function (assert) {
      this.set('record', {
        history: [
          {
            id: 2,
            status: 'SUCCESS'
          },
          {
            id: 1,
            status: 'RUNNING'
          }
        ]
      });

      await render(hbs`<PipelineListHistoryCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle').hasClass('SUCCESS');
      assert.dom('.fa-circle').exists({ count: 2 });
    });

    test('it renders aborted build', async function (assert) {
      this.set('record', {
        history: [
          {
            id: 2,
            status: 'ABORTED'
          },
          {
            id: 1,
            status: 'RUNNING'
          }
        ]
      });

      await render(hbs`<PipelineListHistoryCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle').hasClass('ABORTED');
      assert.dom('.fa-circle').exists({ count: 2 });
    });

    test('it renders random status build', async function (assert) {
      this.set('record', {
        history: [
          {
            id: 2,
            status: 'RANDOM'
          },
          {
            id: 1,
            status: 'RUNNING'
          }
        ]
      });

      await render(hbs`<PipelineListHistoryCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle').hasClass('RANDOM');
      assert.dom('.fa-circle').exists({ count: 2 });
    });

    test('it renders tooltip upon hover with build details', async function (assert) {
      this.set('record', {
        history: [
          {
            id: 1,
            status: 'SUCCESS',
            startTime: '2023-03-02T18:58:46.493Z',
            endTime: '2023-03-02T18:58:56.411Z'
          },
          {
            id: 2,
            status: 'FAILURE',
            startTime: '2023-03-02T18:58:46.493Z',
            endTime: '2023-03-02T20:58:56.411Z'
          }
        ]
      });

      await render(hbs`<PipelineListHistoryCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle').hasClass('SUCCESS');
      assert.dom('.fa-circle').exists({ count: 2 });

      await triggerEvent('.build-status:first-child', 'mouseenter');
      assert.dom('.tooltip').exists({ count: 1 });
      assert.dom('.tooltip').containsText('Build# 1 Start - 03/02/2023');
    });

    test('it renders warning build', async function (assert) {
      this.set('record', {
        history: [
          {
            id: 2,
            status: 'WARNING'
          },
          {
            id: 1,
            status: 'SUCCESS'
          }
        ]
      });

      await render(hbs`<PipelineListHistoryCell
        @record={{this.record}}
      />`);

      assert.dom('.fa-circle').hasClass('WARNING');
      assert.dom('.fa-circle').exists({ count: 2 });
    });
  }
);
