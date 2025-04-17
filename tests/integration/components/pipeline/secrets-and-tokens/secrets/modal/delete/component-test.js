import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/secrets-and-tokens/modal/delete',
  function (hooks) {
    setupRenderingTest(hooks);

    let shuttle;
    const secret = {
      name: 'TEST'
    };

    hooks.beforeEach(function () {
      shuttle = this.owner.lookup('service:shuttle');

      this.setProperties({
        secret,
        closeModal: () => {}
      });
    });

    test('it renders', async function (assert) {
      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Delete
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.delete-secret-message').exists({ count: 1 });
      assert.dom('.delete-secret-message-warning').exists({ count: 1 });
      assert.dom('input').exists({ count: 1 });
      assert.dom('#submit-delete').isDisabled();
    });

    test('it enables the submit button when the token name is correct', async function (assert) {
      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Delete
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );

      await fillIn('input', 'TE');
      assert.dom('#submit-delete').isDisabled();

      await fillIn('input', 'TEST');
      assert.dom('#submit-delete').isEnabled();
    });

    test('it displays error message correctly', async function (assert) {
      sinon.stub(shuttle, 'fetchFromApi').rejects({ message: 'Error message' });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Delete
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('input', 'TEST');
      await click('#submit-delete');

      assert.dom('#submit-delete').isEnabled();
      assert.dom('#error-message').exists({ count: 1 });
    });

    test('it autocloses the modal when the token is deleted', async function (assert) {
      sinon.stub(shuttle, 'fetchFromApi').resolves();

      const closeModalSpy = sinon.spy();

      this.setProperties({
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Delete
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('input', 'TEST');
      await click('#submit-delete');

      assert.dom('#submit-delete').isDisabled();
      assert.true(closeModalSpy.calledOnce, true);
      assert.true(closeModalSpy.calledWith(secret), true);
    });
  }
);
