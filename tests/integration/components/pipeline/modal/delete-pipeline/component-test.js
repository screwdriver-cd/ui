import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/modal/delete-pipeline',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders core components', async function (assert) {
      this.setProperties({
        pipeline: { id: 123 },
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::DeletePipeline
            @pipeline={{this.pipeline}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').exists({ count: 1 });
      assert.dom('.alert').doesNotExist();
      assert.dom('.modal-title').exists({ count: 1 });
      assert.dom('#delete-repository-message').exists({ count: 1 });
      assert.dom('#delete-repository-input').exists({ count: 1 });
      assert.dom('.modal-footer').exists({ count: 1 });
      assert.dom('#delete-pipeline-action').exists({ count: 1 });
      assert.dom('#delete-pipeline-action').isDisabled();
    });

    test('it enables delete button when input is set correctly', async function (assert) {
      this.setProperties({
        pipeline: { id: 123, name: 'test' },
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::DeletePipeline
            @pipeline={{this.pipeline}}
            @closeModal={{this.closeModal}}
        />`
      );

      await fillIn('#delete-repository-input', 'not-correct');
      assert.dom('#delete-pipeline-action').isDisabled();

      await fillIn('#delete-repository-input', 'test');
      assert.dom('#delete-pipeline-action').isEnabled();
    });

    test('it sets error message when deleting pipeline fails', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(shuttle, 'fetchFromApi').rejects();

      this.setProperties({
        pipeline: { id: 123, name: 'test' },
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::DeletePipeline
            @pipeline={{this.pipeline}}
            @closeModal={{this.closeModal}}
        />`
      );

      await fillIn('#delete-repository-input', 'test');
      await click('#delete-pipeline-action');
      assert.dom('.alert').exists({ count: 1 });
    });

    test('it calls close callback with true when delete succeeds', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const closeModalSpy = sinon.spy();

      sinon.stub(shuttle, 'fetchFromApi').resolves();

      this.setProperties({
        pipeline: { id: 123, name: 'test' },
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Modal::DeletePipeline
            @pipeline={{this.pipeline}}
            @closeModal={{this.closeModal}}
        />`
      );

      await fillIn('#delete-repository-input', 'test');
      await click('#delete-pipeline-action');

      assert.equal(closeModalSpy.calledOnce, true);
      assert.equal(closeModalSpy.calledWith(true), true);
    });
  }
);
