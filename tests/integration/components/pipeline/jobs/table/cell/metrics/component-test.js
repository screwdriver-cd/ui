import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { clearRender, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/jobs/table/cell/metrics',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      const job = { id: 123, name: 'main' };

      this.setProperties({
        record: {
          job,
          onCreate: () => {},
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Metrics
            @record={{this.record}}
        />`
      );

      assert.dom('a').doesNotExist();
    });

    test('it calls onCreate', async function (assert) {
      const onCreate = sinon.spy();
      const job = { id: 123, name: 'main' };

      this.setProperties({
        record: {
          job,
          onCreate,
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Metrics
            @record={{this.record}}
        />`
      );

      assert.equal(onCreate.calledOnce, true);
      assert.equal(onCreate.calledWith(job), true);
    });

    test('it calls onDestroy', async function (assert) {
      const onDestroy = sinon.spy();
      const job = { id: 123, name: 'main' };

      this.setProperties({
        record: {
          job,
          onCreate: () => {},
          onDestroy
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Metrics
            @record={{this.record}}
        />`
      );
      await clearRender();

      assert.equal(onDestroy.calledOnce, true);
      assert.equal(onDestroy.calledWith(job), true);
    });

    test('it renders metrics link', async function (assert) {
      const job = { id: 123, name: 'main' };
      const builds = [{ id: 999 }];

      this.setProperties({
        record: {
          job,
          onCreate: (j, cb) => {
            cb(builds);
          },
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Metrics
            @record={{this.record}}
        />`
      );

      assert.dom('a').exists({ count: 1 });
    });
  }
);
