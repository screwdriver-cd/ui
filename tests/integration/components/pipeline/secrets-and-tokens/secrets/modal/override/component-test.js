import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/secrets-and-tokens/modal/override',
  function (hooks) {
    setupRenderingTest(hooks);

    let shuttle;

    hooks.beforeEach(function () {
      const pipelinePageState = this.owner.lookup('service:pipelinePageState');

      shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(pipelinePageState, 'getPipelineId').returns(1);

      this.setProperties({
        secret: {
          name: 'TEST',
          allowInPr: false
        },
        closeModal: () => {}
      });
    });

    test('it renders', async function (assert) {
      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Override
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').hasText('Override inherited secret: TEST ×');
      assert.dom('#error-message').doesNotExist();
      assert.dom('#submit-secret').exists({ count: 1 });
      assert.dom('#submit-secret').isDisabled();
    });

    test('it enables submit button correctly', async function (assert) {
      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Override
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#submit-secret').isDisabled();

      await click('#allow-in-pr-toggle input');
      assert.dom('#submit-secret').isDisabled();

      await fillIn('#secret-value-input', 'updated');
      assert.dom('#submit-secret').isEnabled();
    });

    test('it handles API error', async function (assert) {
      sinon.stub(shuttle, 'fetchFromApi').rejects({ message: 'error' });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Override
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#secret-value-input', 'updated');
      await click('#submit-secret');

      assert.dom('#error-message').exists({ count: 1 });
      assert.dom('#submit-secret').isEnabled();
    });

    test('it closes modal with correct argument', async function (assert) {
      const closeModalSpy = sinon.spy();
      const newSecret = {
        id: 123
      };

      sinon.stub(shuttle, 'fetchFromApi').resolves(newSecret);

      this.setProperties({
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Override
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#secret-value-input', 'updated');
      await click('#submit-secret');

      assert.dom('#submit-secret').isDisabled();
      assert.true(closeModalSpy.calledOnce);
      assert.equal(closeModalSpy.calledWith(newSecret), true);
    });
  }
);
