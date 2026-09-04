import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/settings/main/modal/sonar-badge/delete',
  function (hooks) {
    setupRenderingTest(hooks);

    let pipelinePageState;

    let shuttle;

    const pipelineMock = {
      id: 123,
      badges: {
        sonar: {
          name: 'sonar',
          uri: 'https://sonar.example.com/badge'
        }
      }
    };

    hooks.beforeEach(function () {
      pipelinePageState = this.owner.lookup('service:pipeline-page-state');
      shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(pipelinePageState, 'getPipelineId').returns(pipelineMock.id);
    });

    test('it renders', async function (assert) {
      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::SonarBadge::Delete
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').exists();
      assert.dom('.modal-body').exists();
      assert.dom('#submit-action').exists();
      assert.dom('#submit-action').isEnabled();
    });

    test('it handles failed API call correctly', async function (assert) {
      this.setProperties({
        closeModal: () => {}
      });

      const errorMessage = 'Failed to delete sonar badge';

      sinon.stub(shuttle, 'fetchFromApi').rejects({
        message: errorMessage
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::SonarBadge::Delete
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.dom('.modal-body .alert.alert-warning').exists();
      assert
        .dom('.modal-body .alert.alert-warning > span')
        .hasText(errorMessage);
      assert.dom('#submit-action').isEnabled();
    });

    test('it handles successful API call correctly', async function (assert) {
      const setPipelineSpy = sinon.spy(pipelinePageState, 'setPipeline');
      const reloadHeaderSpy = sinon.spy(
        pipelinePageState,
        'forceReloadPipelineHeader'
      );
      const closeModalSpy = sinon.spy();
      const updatedPipeline = {
        ...pipelineMock,
        badges: {}
      };

      sinon.stub(shuttle, 'fetchFromApi').resolves(updatedPipeline);

      this.setProperties({
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::SonarBadge::Delete
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.equal(setPipelineSpy.calledOnceWith(updatedPipeline), true);
      assert.equal(reloadHeaderSpy.calledOnce, true);
      assert.equal(closeModalSpy.calledOnceWith(true), true);
    });
  }
);
