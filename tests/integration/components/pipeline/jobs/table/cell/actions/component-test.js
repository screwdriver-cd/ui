import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
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

      sinon.stub(pipelinePageState, 'getPipeline').returns({ state: 'ACTIVE' });
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

    test('it renders with start and restart modals', async function (assert) {
      const job = { id: 123, name: 'main', state: 'ENABLED' };
      const event = {
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {}
      };

      this.setProperties({
        record: {
          job,
          event,
          canStartFromView: true,
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
      await click('button:nth-of-type(1)');
      assert.dom('.modal-title').hasText('Are you sure you want to start?');

      await click('button:nth-of-type(3)');
      assert.dom('.modal-title').hasText('Are you sure you want to restart?');
    });
  }
);
