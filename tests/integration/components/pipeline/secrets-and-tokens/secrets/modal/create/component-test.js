import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/secrets-and-tokens/modal/create',
  function (hooks) {
    setupRenderingTest(hooks);

    let shuttle;

    hooks.beforeEach(function () {
      const pipelinePageState = this.owner.lookup('service:pipelinePageState');

      shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(pipelinePageState, 'getPipelineId').returns(1);
    });

    test('it renders', async function (assert) {
      this.setProperties({
        secrets: [],
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Create
          @secrets={{this.secrets}}
          @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').hasText('Create a new secret ×');
      assert.dom('#error-message').doesNotExist();
      assert.dom('.create-new-secret').exists({ count: 1 });
      assert.dom('.create-new-secret input').exists({ count: 3 });
      assert.dom('#secret-name-input').exists({ count: 1 });
      assert.dom('#secret-value-input').exists({ count: 1 });
      assert.dom('#allow-in-pr-toggle').exists({ count: 1 });
      assert.dom('#submit-secret').exists({ count: 1 });
      assert.dom('#submit-secret').isDisabled();
    });

    test('it sets invalid class on invalid input', async function (assert) {
      this.setProperties({
        secrets: [{ name: 'TEST' }],
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Create
            @secrets={{this.secrets}}
            @closeModal={{this.closeModal}}
        />`
      );
      assert.dom('#secret-name-input').hasNoClass('invalid');

      await fillIn('#secret-name-input', 'TEST');
      assert.dom('#secret-name-input').hasClass('invalid');

      await fillIn('#secret-name-input', 'OK');
      assert.dom('#secret-name-input').hasNoClass('invalid');

      await fillIn('#secret-name-input', 'bad');
      assert.dom('#secret-name-input').hasClass('invalid');
    });

    test('it enables submit button when secret name is valid and value is not blank', async function (assert) {
      this.setProperties({
        secrets: [],
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Create
            @secrets={{this.secrets}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#submit-secret').isDisabled();

      await fillIn('#secret-name-input', 'NEW');
      assert.dom('#submit-secret').isDisabled();

      await fillIn('#secret-value-input', 'SOMETHING');
      assert.dom('#submit-secret').isNotDisabled();
    });

    test('it handles API error correctly', async function (assert) {
      sinon.stub(shuttle, 'fetchFromApi').rejects({ message: 'error' });

      this.setProperties({
        secrets: [],
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Create
          @secrets={{this.secrets}}
          @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#secret-name-input', 'TEST');
      await fillIn('#secret-value-input', 'new');
      await click('#submit-secret');

      assert.dom('#error-message').exists({ count: 1 });
      assert.dom('#error-message').hasText('× error');
      assert.dom('#submit-secret').isNotDisabled();
    });

    test('it handles API success correctly', async function (assert) {
      const closeModalSpy = sinon.spy();
      const newSecret = {
        id: 123
      };

      sinon.stub(shuttle, 'fetchFromApi').resolves(newSecret);

      this.setProperties({
        secrets: [],
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Create
          @secrets={{this.secrets}}
          @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#secret-name-input', 'TEST');
      await fillIn('#secret-value-input', 'new');
      await click('#submit-secret');

      assert.dom('#submit-secret').isDisabled();
      assert.dom('#error-message').doesNotExist();
      assert.true(closeModalSpy.calledOnce);
      assert.true(closeModalSpy.calledWith(newSecret));
    });
  }
);
