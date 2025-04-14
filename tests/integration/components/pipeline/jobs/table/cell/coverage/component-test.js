import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/jobs/table/cell/coverage',
  function (hooks) {
    setupRenderingTest(hooks);

    let shuttle;
    const job = { id: 123, name: 'main' };

    hooks.beforeEach(function () {
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      shuttle = this.owner.lookup('service:shuttle');

      sinon
        .stub(pipelinePageState, 'getPipeline')
        .returns({ id: 123, name: 'myPipeline' });
    });

    test('it renders', async function (assert) {
      this.setProperties({
        record: {
          job
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Coverage
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('');
    });

    test('it renders coverage value', async function (assert) {
      sinon.stub(shuttle, 'fetchFromApi').resolves({ coverage: '90.0' });

      this.setProperties({
        record: {
          job,
          build: {
            id: 999,
            startTime: '2021-01-01T12:00:00.000Z',
            endTime: '2021-01-01T12:02:00.000Z'
          }
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Coverage
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('90.0%');
    });

    test('it renders when no coverage available', async function (assert) {
      sinon.stub(shuttle, 'fetchFromApi').resolves({ coverage: 'N/A' });

      this.setProperties({
        record: {
          job,
          build: {
            id: 999,
            startTime: '2021-01-01T12:00:00.000Z',
            endTime: '2021-01-01T12:02:00.000Z'
          }
        }
      });

      await render(
        hbs`<Pipeline::Jobs::Table::Cell::Coverage
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('N/A');
    });
  }
);
