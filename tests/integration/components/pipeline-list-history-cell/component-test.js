import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
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
  }
);
