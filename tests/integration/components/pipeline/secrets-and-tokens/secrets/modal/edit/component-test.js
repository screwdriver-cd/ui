import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/secrets-and-tokens/modal/edit',
  function (hooks) {
    setupRenderingTest(hooks);

    let shuttle;

    hooks.beforeEach(function () {
      shuttle = this.owner.lookup('service:shuttle');

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
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Edit
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').hasText('Edit secret TEST ×');
      assert.dom('#error-message').doesNotExist();
      assert.dom('#submit-secret').exists({ count: 1 });
      assert.dom('#submit-secret').isDisabled();
    });

    test('it enables submit button correctly', async function (assert) {
      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Edit
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#submit-secret').isDisabled();

      await click('#allow-in-pr-toggle input');
      assert.dom('#submit-secret').isEnabled();

      await click('#allow-in-pr-toggle input');
      assert.dom('#submit-secret').isDisabled();

      await fillIn('#secret-value-input', 'updated');
      assert.dom('#submit-secret').isEnabled();

      await click('#allow-in-pr-toggle input');
      assert.dom('#submit-secret').isEnabled();
    });

    test('it handles API error', async function (assert) {
      sinon.stub(shuttle, 'fetchFromApi').rejects({ message: 'error' });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Edit
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#secret-value-input', 'updated');
      await click('#submit-secret');

      assert.dom('#error-message').exists({ count: 1 });
      assert.dom('#submit-secret').isEnabled();
    });

    test('it closes modal with no argument', async function (assert) {
      const closeModalSpy = sinon.spy();

      sinon.stub(shuttle, 'fetchFromApi').resolves({});

      this.setProperties({
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Edit
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#secret-value-input', 'updated');
      await click('#submit-secret');

      assert.dom('#submit-secret').isDisabled();
      assert.true(closeModalSpy.calledOnce);
      assert.equal(closeModalSpy.calledWith(), true);
    });

    test('it closes modal with correct argument', async function (assert) {
      const closeModalSpy = sinon.spy();
      const updatedSecret = {
        name: 'TEST',
        allowInPR: true
      };

      sinon.stub(shuttle, 'fetchFromApi').resolves(updatedSecret);

      this.setProperties({
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets::Modal::Edit
            @secret={{this.secret}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#allow-in-pr-toggle input');
      await click('#submit-secret');

      assert.dom('#submit-secret').isDisabled();
      assert.true(closeModalSpy.calledOnce);
      assert.equal(closeModalSpy.calledWith(updatedSecret), true);
    });
  }
);
