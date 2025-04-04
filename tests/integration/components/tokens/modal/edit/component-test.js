import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | tokens/modal/edit', function (hooks) {
  setupRenderingTest(hooks);

  let shuttle;

  hooks.beforeEach(function () {
    const pipelinePageState = this.owner.lookup('service:pipelinePageState');

    shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(pipelinePageState, 'getPipelineId').returns(1);

    this.setProperties({
      token: {
        name: 'test',
        type: 'pipeline',
        tokens: [{ name: 'exists' }]
      },
      closeModal: () => {}
    });
  });

  test('it renders', async function (assert) {
    await render(
      hbs`<Tokens::Modal::Edit
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('.modal-header').hasText('Edit a pipeline token ×');
    assert.dom('#error-message').doesNotExist();
    assert.dom('#submit-token').exists({ count: 1 });
    assert.dom('#submit-token').isDisabled();
  });

  test('it enables submit button correctly', async function (assert) {
    await render(
      hbs`<Tokens::Modal::Edit
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('#submit-token').isDisabled();

    await fillIn('#token-name-input', 'updated');
    assert.dom('#submit-token').isEnabled();

    await fillIn('#token-name-input', 'exists');
    assert.dom('#token-name-input').hasClass('invalid');
    assert.dom('#submit-token').isDisabled();

    await fillIn('#token-name-input', '');
    await fillIn('#token-description-input', 'description');
    assert.dom('#submit-token').isEnabled();
  });

  test('it handles API error', async function (assert) {
    sinon.stub(shuttle, 'fetchFromApi').rejects({ message: 'error' });

    await render(
      hbs`<Tokens::Modal::Edit
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );
    await fillIn('#token-name-input', 'updated');
    await click('#submit-token');

    assert.dom('#error-message').exists({ count: 1 });
    assert.dom('#submit-token').isEnabled();
  });

  test('it handles API success', async function (assert) {
    const closeModalSpy = sinon.spy();
    const updatedName = 'updated';
    const updatedToken = { name: updatedName };

    sinon.stub(shuttle, 'fetchFromApi').resolves(updatedToken);

    this.setProperties({
      closeModal: closeModalSpy
    });

    await render(
      hbs`<Tokens::Modal::Edit
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );
    await fillIn('#token-name-input', updatedName);
    await click('#submit-token');

    assert.dom('#submit-token').isDisabled();
    assert.true(closeModalSpy.calledOnce);
    assert.equal(closeModalSpy.calledWith(updatedToken), true);
  });
});
