import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { clearRender, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/jobs/table/cell/duration',
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
        hbs`<Pipeline::Jobs::Table::Cell::Duration
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
        hbs`<Pipeline::Jobs::Table::Cell::Duration
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
        hbs`<Pipeline::Jobs::Table::Cell::Duration
            @record={{this.record}}
        />`
      );
      await clearRender();

      assert.equal(onDestroy.calledOnce, true);
      assert.equal(onDestroy.calledWith(job), true);
    });

    test('it renders duration for completed build', async function (assert) {
      const job = { id: 123, name: 'main' };
      const builds = [
        {
          id: 999,
          startTime: '2024-07-14T17:25:57.671Z',
          endTime: '2024-07-14T17:26:55.202Z'
        }
      ];

      this.setProperties({
        record: {
          job,
          onCreate: (j, cb) => {
            return cb(builds);
          },
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Duration
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('58s');
    });

    test('it renders duration for queued build', async function (assert) {
      const job = { id: 123, name: 'main' };
      const now = new Date();
      const builds = [
        {
          id: 999,
          startTime: new Date(now - 1000 * 60 * 5 + 15 * 1000).toISOString(),
          status: 'QUEUED'
        }
      ];

      this.setProperties({
        record: {
          job,
          onCreate: (j, cb) => {
            return cb(builds);
          },
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Duration
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('');

      await clearRender();
    });

    test('it renders duration for running build', async function (assert) {
      const job = { id: 123, name: 'main' };
      const now = new Date();
      const builds = [
        {
          id: 999,
          startTime: new Date(now - 1000 * 60 * 5 + 15 * 1000).toISOString(),
          status: 'RUNNING'
        }
      ];

      this.setProperties({
        record: {
          job,
          onCreate: (j, cb) => {
            return cb(builds);
          },
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Duration
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('Running for 4m 45s');

      await clearRender();
    });

    test('it renders duration for a build that completed without an end time', async function (assert) {
      const job = { id: 123, name: 'main' };
      const now = new Date();
      const builds = [
        {
          id: 999,
          startTime: new Date(now - 1000 * 60 * 5 + 15 * 1000).toISOString()
        }
      ];

      this.setProperties({
        record: {
          job,
          onCreate: (j, cb) => {
            return cb(builds);
          },
          onDestroy: () => {}
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Duration
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('N/A');

      await clearRender();
    });
  }
);
