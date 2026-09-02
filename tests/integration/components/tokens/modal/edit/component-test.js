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
    const tokensService = this.owner.lookup('service:tokens');

    shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(pipelinePageState, 'getPipelineId').returns(1);

    this.setProperties({
      token: {
        id: 123,
        name: 'test',
        description: 'test-description',
        expiresAt: '2026-08-02T03:14:08.131Z',
        options: { permission: 'read' },
        type: 'pipeline'
      },
      pipelineId: 1,
      closeModal: () => {}
    });

    tokensService.tokenNames = ['exists'];
  });

  test('it renders', async function (assert) {
    await render(
      hbs`<Tokens::Modal::Edit
        @token={{this.token}}
        @pipelineId={{this.pipelineId}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('.modal-header').hasText('Edit a pipeline token ×');
    assert.dom('#error-message').doesNotExist();
    assert.dom('#submit-token').exists({ count: 1 });
    assert.dom('#token-name-input').hasAttribute('placeholder', 'test');
    assert
      .dom('#token-description-input')
      .hasAttribute('placeholder', 'test-description');
    assert.dom('#token-expires-input').hasValue('08/02/2026, 03:14 AM UTC');
    assert.dom('#token-permission-input').hasValue('read');
    assert.dom('#submit-token').isDisabled();
  });

  test('it enables submit button correctly', async function (assert) {
    await render(
      hbs`<Tokens::Modal::Edit
        @token={{this.token}}
        @pipelineId={{this.pipelineId}}
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
        @pipelineId={{this.pipelineId}}
        @closeModal={{this.closeModal}}
      />`
    );
    await fillIn('#token-name-input', 'updated');
    await click('#submit-token');

    assert.dom('#error-message').exists({ count: 1 });
    assert.dom('#submit-token').isEnabled();
  });

  test('it uses the user token endpoint when pipelineId is not provided', async function (assert) {
    const fetchStub = sinon.stub(shuttle, 'fetchFromApi').resolves({});

    this.setProperties({
      token: {
        id: 456,
        name: 'user-token',
        description: 'description',
        options: { permission: 'read' },
        type: 'user'
      },
      pipelineId: undefined
    });

    await render(
      hbs`<Tokens::Modal::Edit
        @token={{this.token}}
        @pipelineId={{this.pipelineId}}
        @closeModal={{this.closeModal}}
      />`
    );

    await fillIn('#token-name-input', 'updated');
    await click('#submit-token');

    assert.strictEqual(fetchStub.firstCall.args[0], 'put');
    assert.strictEqual(fetchStub.firstCall.args[1], '/tokens/456');
  });

  test('it uses the pipeline token endpoint when pipelineId is provided', async function (assert) {
    const fetchStub = sinon.stub(shuttle, 'fetchFromApi').resolves({});

    await render(
      hbs`<Tokens::Modal::Edit
        @token={{this.token}}
        @pipelineId={{this.pipelineId}}
        @closeModal={{this.closeModal}}
      />`
    );

    await fillIn('#token-name-input', 'updated');
    await click('#submit-token');

    assert.strictEqual(fetchStub.firstCall.args[1], '/pipelines/1/tokens/123');
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
        @pipelineId={{this.pipelineId}}
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
