import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { clearRender, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/jobs/table/cell/coverage',
  function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      sinon
        .stub(pipelinePageState, 'getPipeline')
        .returns({ id: 123, name: 'myPipeline' });
    });

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
        hbs`<Pipeline::Jobs::Table::Cell::Coverage
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
        hbs`<Pipeline::Jobs::Table::Cell::Coverage
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
        hbs`<Pipeline::Jobs::Table::Cell::Coverage
            @record={{this.record}}
        />`
      );
      await clearRender();

      assert.equal(onDestroy.calledOnce, true);
      assert.equal(onDestroy.calledWith(job), true);
    });

    test('it renders coverage value', async function (assert) {
      const job = { id: 123, name: 'main' };
      const builds = [
        {
          id: 999,
          startTime: '2021-01-01T12:00:00.000Z',
          endTime: '2021-01-01T12:02:00.000Z'
        }
      ];

      const shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(shuttle, 'fetchFromApi').resolves({ coverage: '90.0' });

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
        hbs`<Pipeline::Jobs::Table::Cell::Coverage
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('90.0%');
    });

    test('it renders when no coverage available', async function (assert) {
      const job = { id: 123, name: 'main' };
      const builds = [
        {
          id: 999,
          startTime: '2021-01-01T12:00:00.000Z',
          endTime: '2021-01-01T12:02:00.000Z'
        }
      ];

      const shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(shuttle, 'fetchFromApi').resolves({ coverage: 'N/A' });

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
        hbs`<Pipeline::Jobs::Table::Cell::Coverage
            @record={{this.record}}
        />`
      );

      assert.dom(this.element).hasText('N/A');
    });
  }
);
