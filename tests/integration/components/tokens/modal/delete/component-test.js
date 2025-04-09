import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | tokens/modal/delete', function (hooks) {
  setupRenderingTest(hooks);

  let shuttle;

  hooks.beforeEach(function () {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    shuttle = this.owner.lookup('service:shuttle');

    sinon.stub(pipelinePageState, 'getPipelineId').returns(123);
  });

  test('it renders', async function (assert) {
    this.setProperties({
      token: {
        name: 'test-token'
      },
      closeModal: () => {}
    });

    await render(
      hbs`<Tokens::Modal::Delete
        @type="pipeline"
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('.delete-token-message').exists({ count: 1 });
    assert.dom('.delete-token-message-warning').exists({ count: 1 });
    assert.dom('input').exists({ count: 1 });
    assert.dom('#submit-delete').isDisabled();
  });

  test('it enables the submit button when the token name is correct', async function (assert) {
    this.setProperties({
      token: {
        name: 'test-token'
      },
      closeModal: () => {}
    });

    await render(
      hbs`<Tokens::Modal::Delete
        @type="pipeline"
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );

    await fillIn('input', 'test');
    assert.dom('#submit-delete').isDisabled();

    await fillIn('input', 'test-token');
    assert.dom('#submit-delete').isEnabled();
  });

  test('it displays error message correctly', async function (assert) {
    sinon.stub(shuttle, 'fetchFromApi').rejects({ message: 'Error message' });

    this.setProperties({
      token: {
        name: 'test-token'
      },
      closeModal: () => {}
    });

    await render(
      hbs`<Tokens::Modal::Delete
        @type="pipeline"
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );
    await fillIn('input', 'test-token');
    await click('#submit-delete');

    assert.dom('#submit-delete').isEnabled();
    assert.dom('#error-message').exists({ count: 1 });
  });

  test('it autocloses the modal when the token is deleted', async function (assert) {
    sinon.stub(shuttle, 'fetchFromApi').resolves();

    const token = {
      name: 'test-token'
    };
    const closeModalSpy = sinon.spy();

    this.setProperties({
      token,
      closeModal: closeModalSpy
    });

    await render(
      hbs`<Tokens::Modal::Delete
        @type="pipeline"
        @token={{this.token}}
        @closeModal={{this.closeModal}}
      />`
    );
    await fillIn('input', 'test-token');
    await click('#submit-delete');

    assert.dom('#submit-delete').isDisabled();
    assert.true(closeModalSpy.calledOnce, true);
    assert.true(closeModalSpy.calledWith(token), true);
  });
});
