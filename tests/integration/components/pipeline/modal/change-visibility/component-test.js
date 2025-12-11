import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/modal/change-visibility',
  function (hooks) {
    setupRenderingTest(hooks);

    let pipelinePageState;

    hooks.beforeEach(function () {
      pipelinePageState = this.owner.lookup('service:pipeline-page-state');
    });

    test('it renders core components', async function (assert) {
      const pipelineMock = {
        id: 123
      };

      sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);
      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::ChangeVisibility
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').exists({ count: 1 });
      assert.dom('.alert').doesNotExist();
      assert.dom('.modal-title').exists({ count: 1 });
      assert.dom('#change-visibility-message').exists({ count: 1 });
      assert.dom('.change-visibility-message-warning').exists({ count: 1 });
      assert.dom('.modal-footer').exists({ count: 1 });
      assert.dom('#change-visibility-action').exists({ count: 1 });
    });

    test('it renders when pipeline visibility is false', async function (assert) {
      const pipelineMock = {
        id: 123,
        settings: {
          public: false
        }
      };

      sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);
      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::ChangeVisibility
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').exists({ count: 1 });
      assert.dom('.alert').doesNotExist();
      assert.dom('.modal-title').exists({ count: 1 });
      assert.dom('#change-visibility-message').exists({ count: 1 });
      assert.dom('.change-visibility-message-warning').exists({ count: 1 });
      assert.dom('.modal-footer').exists({ count: 1 });
      assert.dom('#change-visibility-action').exists({ count: 1 });
    });

    test('it renders when pipeline visibility is true', async function (assert) {
      const pipelineMock = {
        id: 123,
        settings: {
          public: true
        }
      };

      sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);
      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::ChangeVisibility
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').exists({ count: 1 });
      assert.dom('.alert').doesNotExist();
      assert.dom('.modal-title').exists({ count: 1 });
      assert.dom('#change-visibility-message').exists({ count: 1 });
      assert.dom('.change-visibility-message-warning').doesNotExist();
      assert.dom('.modal-footer').exists({ count: 1 });
      assert.dom('#change-visibility-action').exists({ count: 1 });
    });
  }
);
