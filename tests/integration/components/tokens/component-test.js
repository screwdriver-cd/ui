import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | tokens', function (hooks) {
  setupRenderingTest(hooks);

  let tokensService;

  hooks.beforeEach(function () {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    tokensService = this.owner.lookup('service:tokens');

    sinon.stub(pipelinePageState, 'getPipelineId').returns(123);
  });

  test('it renders', async function (assert) {
    sinon.stub(tokensService, 'fetchTokens').resolves([]);

    await render(
      hbs`<Tokens
        @type="pipeline"
      />`
    );

    assert.dom('#error-message').doesNotExist();
    assert.dom('.tokens-header').exists({ count: 1 });
    assert.dom('.tokens-header-text').exists({ count: 1 });
    assert.dom('.tokens-header-title').exists({ count: 1 });
    assert.dom('.token-type-explanation').exists({ count: 1 });
    assert.dom('.token-type-explanation a').exists({ count: 1 });
    assert.dom('.new-token').exists({ count: 1 });
    assert.dom('.new-token button').exists({ count: 1 });
    assert.dom('#tokens-table').exists({ count: 1 });
  });

  test('it renders error message', async function (assert) {
    sinon.stub(tokensService, 'fetchTokens').rejects('error');

    await render(
      hbs`<Tokens
        @type="pipeline"
      />`
    );

    assert.dom('#error-message').exists();
    assert.dom('.tokens-header').exists({ count: 1 });
    assert.dom('.tokens-header-text').exists({ count: 1 });
    assert.dom('.tokens-header-title').exists({ count: 1 });
    assert.dom('.token-type-explanation').exists({ count: 1 });
    assert.dom('.token-type-explanation a').exists({ count: 1 });
    assert.dom('.new-token').exists({ count: 1 });
    assert.dom('.new-token button').exists({ count: 1 });
    assert.dom('#tokens-table').exists({ count: 1 });
  });
});
