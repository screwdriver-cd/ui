import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/settings/main/modal/sonar-badge',
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

      sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);
    });

    test('it renders', async function (assert) {
      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::SonarBadge
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').exists();
      assert.dom('#sonar-badge-name-input').exists();
      assert.dom('#sonar-badge-uri-input').exists();
      assert.dom('#submit-action').exists();
    });

    test('it enables submit button correctly', async function (assert) {
      this.setProperties({
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::SonarBadge
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#submit-action').isDisabled();
      await fillIn('#sonar-badge-name-input', 'updated');
      assert.dom('#submit-action').isEnabled();
      await fillIn('#sonar-badge-name-input', pipelineMock.badges.sonar.name);
      assert.dom('#submit-action').isDisabled();
      await fillIn('#sonar-badge-uri-input', 'https://test.com');
      assert.dom('#submit-action').isEnabled();
      await fillIn('#sonar-badge-uri-input', pipelineMock.badges.sonar.uri);
      assert.dom('#submit-action').isDisabled();
      await fillIn('#sonar-badge-name-input', '');
      assert.dom('#submit-action').isEnabled();
      await fillIn('#sonar-badge-uri-input', '');
      assert.dom('#submit-action').isEnabled();
    });

    test('it handles failed API call correctly', async function (assert) {
      this.setProperties({
        closeModal: () => {}
      });

      const errorMessage = 'Failed to update sonar badge';

      sinon.stub(shuttle, 'fetchFromApi').rejects({
        message: errorMessage
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::SonarBadge
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#sonar-badge-name-input', 'updated');
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
        badges: {
          sonar: {}
        }
      };

      sinon.stub(shuttle, 'fetchFromApi').resolves(updatedPipeline);

      this.setProperties({
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::SonarBadge
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#sonar-badge-name-input', '');
      await fillIn('#sonar-badge-uri-input', '');
      await click('#submit-action');

      assert.equal(setPipelineSpy.calledOnceWith(updatedPipeline), true);
      assert.equal(reloadHeaderSpy.calledOnce, true);
      assert.equal(closeModalSpy.calledOnceWith(true), true);
    });
  }
);
