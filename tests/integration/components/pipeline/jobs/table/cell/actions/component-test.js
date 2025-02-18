import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { clearRender, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/jobs/table/cell/actions',
  function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      sinon
        .stub(pipelinePageState, 'getPipeline')
        .returns({ state: 'INACTIVE' });
    });

    test('it renders', async function (assert) {
      const job = { id: 123, name: 'main', state: 'ENABLED' };

      this.setProperties({
        record: {
          job,
          onCreate: () => {},
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Actions
            @record={{this.record}}
        />`
      );

      assert.dom('button').exists({ count: 3 });
    });

    test('it calls onCreate', async function (assert) {
      const onCreate = sinon.spy();
      const job = { id: 123, name: 'main', state: 'ENABLED' };

      this.setProperties({
        record: {
          job,
          onCreate,
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Actions
            @record={{this.record}}
        />`
      );

      assert.equal(onCreate.calledOnce, true);
      assert.equal(onCreate.calledWith(job), true);
    });

    test('it calls onDestroy', async function (assert) {
      const onDestroy = sinon.spy();
      const job = { id: 123, name: 'main', state: 'ENABLED' };

      this.setProperties({
        record: {
          job,
          onCreate: () => {},
          onDestroy
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Actions
            @record={{this.record}}
        />`
      );
      await clearRender();

      assert.equal(onDestroy.calledOnce, true);
      assert.equal(onDestroy.calledWith(job), true);
    });
  }
);
