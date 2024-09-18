import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { clearRender, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/jobs/table/cell/start-time',
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
        hbs`<Pipeline::Jobs::Table::Cell::StartTime
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('');
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
        hbs`<Pipeline::Jobs::Table::Cell::StartTime
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
        hbs`<Pipeline::Jobs::Table::Cell::StartTime
            @record={{this.record}}
        />`
      );
      await clearRender();

      assert.equal(onDestroy.calledOnce, true);
      assert.equal(onDestroy.calledWith(job), true);
    });

    test('it renders start time', async function (assert) {
      const job = { id: 123, name: 'main' };
      const builds = [
        {
          id: 1,
          startTime: '2021-01-01T20:30:00.000Z'
        }
      ];

      this.setProperties({
        record: {
          job,
          timestampFormat: 'UTC',
          onCreate: (j, cb) => {
            cb(builds);
          },
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::StartTime
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('01/01/2021, 08:30 PM UTC');
    });

    test('it renders text when start time is not available', async function (assert) {
      const job = { id: 123, name: 'main' };
      const builds = [{ id: 1 }];

      this.setProperties({
        record: {
          job,
          timestampFormat: 'UTC',
          onCreate: (j, cb) => {
            cb(builds);
          },
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::StartTime
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('Not started');
    });
  }
);
