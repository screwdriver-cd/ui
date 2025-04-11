import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
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
  }
);
