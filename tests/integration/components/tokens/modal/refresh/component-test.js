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
  });

  test('it renders', async function (assert) {
    this.setProperties({
      token: { name: 'test', type: 'pipeline' },
      closeModal: () => {}
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
    assert.dom('#refresh-token').isEnabled();
  });

  test('it displays error message on error', async function (assert) {
    const errorMessage = 'Error refreshing token';

    sinon.stub(shuttle, 'fetchFromApi').rejects({ message: errorMessage });

    this.setProperties({
      token: { name: 'test', type: 'pipeline' },
      closeModal: () => {}
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
  });

  test('it refreshes token on success', async function (assert) {
    const tokenValue = 'new-value';
    const newToken = { value: tokenValue };

    sinon.stub(shuttle, 'fetchFromApi').resolves(newToken);

    this.setProperties({
      token: { name: 'test', type: 'pipeline' },
      closeModal: () => {}
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
  });
});
