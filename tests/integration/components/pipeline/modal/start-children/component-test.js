import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/modal/start-children',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::StartChildren
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').exists({ count: 1 });
      assert.dom('.alert').doesNotExist();
      assert.dom('.modal-title').exists({ count: 1 });
      assert.dom('.modal-footer').exists({ count: 1 });
      assert.dom('#start-all-button').exists({ count: 1 });
      assert.dom('#start-all-button').isEnabled();
    });

    test('it sets error message when starting child pipelines fails', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      sinon.stub(pipelinePageState, 'getPipelineId').returns(123);
      sinon
        .stub(shuttle, 'fetchFromApi')
        .rejects({ jqXHR: { status: 500 }, response: { message: 'error' } });

      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::StartChildren
            @closeModal={{this.closeModal}}
        />`
      );

      await click('#start-all-button');
      assert.dom('.alert').exists({ count: 1 });
    });

    test('it closes modal with correct value on successful start', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );
      const closeModalSpy = sinon.spy();

      sinon.stub(pipelinePageState, 'getPipelineId').returns(123);
      sinon.stub(shuttle, 'fetchFromApi').resolves();

      this.setProperties({
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Modal::StartChildren
            @closeModal={{this.closeModal}}
        />`
      );

      await click('#start-all-button');
      assert.equal(closeModalSpy.calledOnce, true);
      assert.equal(closeModalSpy.calledWith(true), true);
    });
  }
);
