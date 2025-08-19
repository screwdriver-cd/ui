import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/settings/main/modal/pipeline',
  function (hooks) {
    setupRenderingTest(hooks);

    let pipelinePageState;

    let shuttle;

    const pipelineMock = {
      id: 123,
      scmRepo: {
        name: 'test/repo',
        rootDir: ''
      },
      scmUri: 'git@testgit.com'
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
        hbs`<Pipeline::Settings::Main::Modal::Pipeline
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').exists();
      assert.dom('#checkout-url-input').exists();
      assert.dom('#source-directory-input').exists();
      assert.dom('#submit-action').exists();
    });

    test('it enables submit button correctly', async function (assert) {
      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::Pipeline
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#submit-action').isDisabled();
      await fillIn('#source-directory-input', 'src');
      assert.dom('#submit-action').isEnabled();
      await fillIn('#source-directory-input', '');
      assert.dom('#submit-action').isDisabled();
      await fillIn('#checkout-url-input', 'abc');
      assert.dom('#submit-action').isEnabled();
      await fillIn('#source-directory-input', 'src');
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
        hbs`<Pipeline::Settings::Main::Modal::Pipeline
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#source-directory-input', 'src');
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
      const rootDir = 'src';
      const updatedPipeline = {
        ...pipelineMock,
        scmRepo: {
          rootDir
        }
      };

      sinon.stub(shuttle, 'fetchFromApi').resolves(updatedPipeline);

      this.setProperties({
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::Pipeline
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#source-directory-input', rootDir);
      await click('#submit-action');

      assert.equal(pipelinePageStateSpy.calledOnceWith(updatedPipeline), true);
      assert.equal(closeModalSpy.calledOnceWith(true), true);
    });
  }
);
