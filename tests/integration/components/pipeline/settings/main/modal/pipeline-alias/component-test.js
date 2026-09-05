import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/settings/main/modal/pipeline-alias',
  function (hooks) {
    setupRenderingTest(hooks);

    let pipelinePageState;

    let shuttle;

    const pipelineMock = {
      id: 123,
      settings: {}
    };

    hooks.beforeEach(function () {
      pipelinePageState = this.owner.lookup('service:pipeline-page-state');
      shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);
    });

    test('it renders', async function (assert) {
      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::PipelineAlias
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').exists();
      assert.dom('.configuration-container input').exists();
      assert.dom('#submit-action').exists();
    });

    test('it enables submit button correctly', async function (assert) {
      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::PipelineAlias
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#submit-action').isDisabled();
      await fillIn('.configuration-container input', 'my-alias');
      assert.dom('#submit-action').isEnabled();
    });

    test('it handles failed API call correctly', async function (assert) {
      this.setProperties({
        closeModal: () => {}
      });

      const errorMessage = 'Failed to update pipeline';

      sinon.stub(shuttle, 'fetchFromApi').rejects({
        message: errorMessage
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::PipelineAlias
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('.configuration-container input', 'my-alias');
      await click('#submit-action');

      assert.dom('.modal-body .alert.alert-warning').exists();
      assert
        .dom('.modal-body .alert.alert-warning > span')
        .hasText(errorMessage);
      assert.dom('#submit-action').isEnabled();
    });

    test('it handles successful API call correctly', async function (assert) {
      const pipelinePageStateSpy = sinon.spy(pipelinePageState, 'setPipeline');
      const closeModalSpy = sinon.spy();
      const alias = 'my-alias';
      const updatedPipeline = {
        ...pipelineMock,
        settings: {
          aliasName: alias
        }
      };

      sinon.stub(shuttle, 'fetchFromApi').resolves(updatedPipeline);

      this.setProperties({
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::PipelineAlias
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('.configuration-container input', alias);
      await click('#submit-action');

      assert.equal(pipelinePageStateSpy.calledOnceWith(updatedPipeline), true);
      assert.equal(closeModalSpy.calledOnceWith(true), true);
    });
  }
);
