import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | tokens/modal/create', function (hooks) {
  setupRenderingTest(hooks);

  let shuttle;

  hooks.beforeEach(function () {
    const pipelinePageState = this.owner.lookup('service:pipelinePageState');

    shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(pipelinePageState, 'getPipelineId').returns(1);
  });

  test('it renders', async function (assert) {
    this.setProperties({
      tokens: [],
      closeModal: () => {}
    });

    await render(
      hbs`<Tokens::Modal::Create
        @type="pipeline"
        @tokens={{this.tokens}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('.modal-header').hasText('Create a new pipeline token ×');
    assert.dom('#error-message').doesNotExist();
    assert.dom('#success-container').doesNotExist();
    assert.dom('.create-new-token').exists({ count: 1 });
    assert.dom('.create-new-token input').exists({ count: 2 });
    assert.dom('#token-name-input').exists({ count: 1 });
    assert.dom('#submit-token').exists({ count: 1 });
    assert.dom('#submit-token').isDisabled();

    await render(
      hbs`<Tokens::Modal::Create
        @type="user"
        @tokens={{this.tokens}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('.modal-header').hasText('Create a new user token ×');
  });

  test('it sets invalid class on invalid input', async function (assert) {
    this.setProperties({
      tokens: [{ name: 'test' }],
      closeModal: () => {}
    });

    await render(
      hbs`<Tokens::Modal::Create
        @type="pipeline"
        @tokens={{this.tokens}}
        @closeModal={{this.closeModal}}
      />`
    );
    assert.dom('#token-name-input').hasNoClass('invalid');

    await fillIn('#token-name-input', 'test');
    assert.dom('#token-name-input').hasClass('invalid');
  });

  test('it enables submit button when token name is valid', async function (assert) {
    this.setProperties({
      tokens: [{ name: 'test' }],
      closeModal: () => {}
    });

    await render(
      hbs`<Tokens::Modal::Create
        @type="pipeline"
        @tokens={{this.tokens}}
        @closeModal={{this.closeModal}}
      />`
    );
    assert.dom('#submit-token').isDisabled();

    await fillIn('#token-name-input', 'new-token');
    assert.dom('#submit-token').isNotDisabled();
  });

  test('it handles API error correctly', async function (assert) {
    sinon.stub(shuttle, 'fetchFromApi').rejects({ message: 'error' });

    this.setProperties({
      tokens: [],
      closeModal: () => {}
    });

    await render(
      hbs`<Tokens::Modal::Create
        @type="pipeline"
        @tokens={{this.tokens}}
        @closeModal={{this.closeModal}}
      />`
    );
    await fillIn('#token-name-input', 'new-token');
    await click('#submit-token');

    assert.dom('#error-message').exists({ count: 1 });
    assert.dom('#error-message').hasText('× error');
    assert.dom('#submit-token').isNotDisabled();
  });

  test('it handles API success correctly', async function (assert) {
    const closeModalSpy = sinon.spy();
    const newToken = {
      value: 'token-value'
    };

    sinon.stub(shuttle, 'fetchFromApi').resolves(newToken);

    this.setProperties({
      tokens: [],
      closeModal: closeModalSpy
    });

    await render(
      hbs`<Tokens::Modal::Create
        @type="pipeline"
        @tokens={{this.tokens}}
        @closeModal={{this.closeModal}}
      />`
    );
    await fillIn('#token-name-input', 'new-token');
    await click('#submit-token');

    assert.dom('#submit-token').isDisabled();
    assert.dom('#error-message').doesNotExist();
    assert.dom('#success-container').exists({ count: 1 });
    assert.dom('#success-container .token-value').hasText(newToken.value);

    await click('.modal-header .close');
    assert.true(closeModalSpy.calledOnce);
    assert.true(closeModalSpy.calledWith(newToken));
  });
});
