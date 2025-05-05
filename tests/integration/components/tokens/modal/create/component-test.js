import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | tokens/modal/create', function (hooks) {
  setupRenderingTest(hooks);

  let shuttle;

  let tokensService;

  hooks.beforeEach(function () {
    const pipelinePageState = this.owner.lookup('service:pipelinePageState');

    shuttle = this.owner.lookup('service:shuttle');
    tokensService = this.owner.lookup('service:tokens');

    sinon.stub(pipelinePageState, 'getPipelineId').returns(1);
    tokensService.tokenNames = [];
  });

  test('it renders', async function (assert) {
    this.setProperties({
      closeModal: () => {}
    });

    await render(
      hbs`<Tokens::Modal::Create
        @type="pipeline"
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
        @tokenNames={{this.tokenNames}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('.modal-header').hasText('Create a new user token ×');
  });

  test('it sets invalid class on invalid input', async function (assert) {
    tokensService.tokenNames = ['test'];

    this.setProperties({
      closeModal: () => {}
    });

    await render(
      hbs`<Tokens::Modal::Create
        @type="pipeline"
        @closeModal={{this.closeModal}}
      />`
    );
    assert.dom('#token-name-input').hasNoClass('invalid');

    await fillIn('#token-name-input', 'test');
    assert.dom('#token-name-input').hasClass('invalid');
  });

  test('it enables submit button when token name is valid', async function (assert) {
    tokensService.tokenNames = ['test'];

    this.setProperties({
      closeModal: () => {}
    });

    await render(
      hbs`<Tokens::Modal::Create
        @type="pipeline"
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
      closeModal: () => {}
    });

    await render(
      hbs`<Tokens::Modal::Create
        @type="pipeline"
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
      name: 'new-token',
      value: 'token-value'
    };

    sinon.stub(shuttle, 'fetchFromApi').resolves(newToken);

    this.setProperties({
      closeModal: closeModalSpy
    });

    await render(
      hbs`<Tokens::Modal::Create
        @type="pipeline"
        @closeModal={{this.closeModal}}
      />`
    );
    await fillIn('#token-name-input', 'new-token');

    assert.equal(tokensService.tokens.length, 0);
    assert.equal(tokensService.tokenNames.length, 0);

    await click('#submit-token');

    assert.dom('#submit-token').isDisabled();
    assert.dom('#error-message').doesNotExist();
    assert.dom('#success-container').exists({ count: 1 });
    assert.dom('#success-container .token-value').hasText(newToken.value);

    assert.equal(tokensService.tokens.length, 1);
    assert.equal(tokensService.tokenNames.length, 1);

    await click('.modal-header .close');
    assert.true(closeModalSpy.calledOnce);
    assert.true(closeModalSpy.calledWith(newToken));
  });
});
