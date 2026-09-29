import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | tokens/modal/refresh', function (hooks) {
  setupRenderingTest(hooks);

  let shuttle;

  hooks.beforeEach(function () {
    const pipelinePageState = this.owner.lookup('service:pipelinePageState');

    shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(pipelinePageState, 'getPipelineId').returns(1);

    this.setProperties({
      token: { name: 'test', type: 'pipeline' }
    });
  });

  test('it renders', async function (assert) {
    this.setProperties({
      closeModal: refreshedToken => {
        assert.notOk(refreshedToken);
      }
    });

    await render(
      hbs`<Tokens::Modal::Refresh
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('.modal-header').hasText('Refresh pipeline token ×');
    assert.dom('#error-message').doesNotExist();
    assert.dom('#success-container').doesNotExist();
    assert.dom('#refresh-token').exists({ count: 1 });
    assert.dom('#expires-select').exists({ count: 1 });
    assert.dom('#refresh-token').isEnabled();

    await click('button.close');
  });

  test('it displays error message on error', async function (assert) {
    const errorMessage = 'Error refreshing token';

    sinon.stub(shuttle, 'fetchFromApi').rejects({ message: errorMessage });
    this.setProperties({
      closeModal: refreshedToken => {
        assert.notOk(refreshedToken);
      }
    });

    await render(
      hbs`<Tokens::Modal::Refresh
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );
    await click('#refresh-token');

    assert.dom('#error-message').exists({ count: 1 });
    assert.dom('#error-message').hasText(`× ${errorMessage}`);
    assert.dom('#refresh-token').isEnabled();

    await click('button.close');
  });

  test('it refreshes token on success', async function (assert) {
    const tokenValue = 'new-value';
    const newToken = { value: tokenValue };

    sinon.stub(shuttle, 'fetchFromApi').resolves(newToken);
    this.setProperties({
      closeModal: refreshedToken => {
        assert.deepEqual(refreshedToken, newToken);
      }
    });

    await render(
      hbs`<Tokens::Modal::Refresh
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );
    await click('#refresh-token');

    assert.dom('#success-container').exists({ count: 1 });
    assert.dom('#success-container .token-value').hasText(tokenValue);
    assert.dom('#refresh-token').isDisabled();

    await click('button.close');
  });

  test('it refreshes token with the selected expiration', async function (assert) {
    const newToken = { value: 'new-value', expiresAt: '2000-01-01 00:00:00' };
    const fetchStub = sinon.stub(shuttle, 'fetchFromApi').resolves(newToken);

    this.setProperties({
      closeModal: refreshedToken => {
        assert.deepEqual(refreshedToken, newToken);
      }
    });

    await render(
      hbs`<Tokens::Modal::Refresh
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );
    await click('#expires-select');
    await click('.ember-power-select-options li:last-child');
    await click('#refresh-token');

    const body = fetchStub.firstCall.args[2];

    assert.strictEqual(body.expiresAt, '');

    await click('button.close');
  });

  test('it refreshes token without an expiration parameter when unchanged', async function (assert) {
    const newToken = { value: 'new-value' };
    const fetchStub = sinon.stub(shuttle, 'fetchFromApi').resolves(newToken);

    this.setProperties({
      closeModal: refreshedToken => {
        assert.deepEqual(refreshedToken, newToken);
      }
    });

    await render(
      hbs`<Tokens::Modal::Refresh
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );
    await click('#refresh-token');

    const body = fetchStub.firstCall.args[2];

    assert.notOk(Object.prototype.hasOwnProperty.call(body, 'expiresAt'));

    await click('button.close');
  });
});
