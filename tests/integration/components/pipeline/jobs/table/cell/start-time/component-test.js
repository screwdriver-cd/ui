import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/jobs/table/cell/start-time',
  function (hooks) {
    setupRenderingTest(hooks);

    const job = { id: 123, name: 'main' };

    hooks.beforeEach(function () {
      const settings = this.owner.lookup('service:settings');

      sinon.stub(settings, 'getSettings').returns({
        timestampFormat: 'UTC'
      });
    });

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          job
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::StartTime
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('');
    });

    test('it renders start time', async function (assert) {
      this.setProperties({
        record: {
          job,
          build: {
            id: 1,
            startTime: '2021-01-01T20:30:00.000Z'
          }
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
      this.setProperties({
        record: {
          job,
          build: { id: 1 }
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
