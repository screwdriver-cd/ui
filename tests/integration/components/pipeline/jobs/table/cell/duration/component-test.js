import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { clearRender, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | pipeline/jobs/table/cell/duration',
  function (hooks) {
    setupRenderingTest(hooks);

    const job = { id: 123, name: 'main' };

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          job
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Duration
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('');
    });

    test('it renders duration for completed build', async function (assert) {
      this.setProperties({
        record: {
          job,
          build: {
            id: 999,
            startTime: '2024-07-14T17:25:57.671Z',
            endTime: '2024-07-14T17:26:55.202Z'
          }
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
      this.setProperties({
        record: {
          job,
          build: {
            id: 999,
            startTime: new Date(
              new Date() - 1000 * 60 * 5 + 15 * 1000
            ).toISOString(),
            status: 'QUEUED'
          }
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
      this.setProperties({
        record: {
          job,
          build: {
            id: 999,
            startTime: new Date(
              new Date() - 1000 * 60 * 5 + 15 * 1000
            ).toISOString(),
            status: 'RUNNING'
          }
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
      this.setProperties({
        record: {
          job,
          build: {
            id: 999,
            startTime: new Date(
              new Date() - 1000 * 60 * 5 + 15 * 1000
            ).toISOString()
          }
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
