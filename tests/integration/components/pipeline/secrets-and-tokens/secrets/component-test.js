import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/secrets-and-tokens/secrets',
  function (hooks) {
    setupRenderingTest(hooks);

    let pipelineSecrets;

    let pipelinePageState;

    hooks.beforeEach(function () {
      pipelineSecrets = this.owner.lookup('service:pipeline-secrets');
      pipelinePageState = this.owner.lookup('service:pipeline-page-state');
    });

    test('it renders', async function (assert) {
      sinon.stub(pipelineSecrets, 'fetchSecrets').resolves([]);
      sinon.stub(pipelinePageState, 'getPipeline').returns({});

      this.setProperties({
        pipelineId: 123
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets
            @pipelineId={{this.pipelineId}}
        />`
      );

      assert.dom('#error-message').doesNotExist();
      assert.dom('.secrets-header').exists();
      assert.dom('.secrets-header-text').exists();
      assert.dom('.secrets-header-title').exists();
      assert.dom('.secrets-explanation').exists();
      assert.dom('.secrets-explanation a').doesNotExist();
      assert.dom('.new-secret').exists();
      assert.dom('.new-secret button').exists();
      assert.dom('#secrets-table').exists();
    });

    test('it renders for child pipeline secrets', async function (assert) {
      sinon.stub(pipelineSecrets, 'fetchSecrets').resolves([]);
      sinon
        .stub(pipelinePageState, 'getPipeline')
        .returns({ configPipelineId: 987 });

      this.setProperties({
        pipelineId: 123
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets
            @pipelineId={{this.pipelineId}}
        />`
      );

      assert.dom('#error-message').doesNotExist();
      assert.dom('.secrets-header').exists();
      assert.dom('.secrets-header-text').exists();
      assert.dom('.secrets-header-title').exists();
      assert.dom('.secrets-explanation').exists();
      assert.dom('.secrets-explanation a').exists();
      assert.dom('.new-secret').exists();
      assert.dom('.new-secret button').exists();
      assert.dom('#secrets-table').exists();
    });

    test('it renders error message', async function (assert) {
      sinon.stub(pipelineSecrets, 'fetchSecrets').rejects('error');
      sinon.stub(pipelinePageState, 'getPipeline').returns({});

      this.setProperties({
        pipelineId: 123
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Secrets
            @pipelineId={{this.pipelineId}}
        />`
      );

      assert.dom('#error-message').exists();
      assert.dom('.secrets-header').exists();
      assert.dom('.secrets-header-text').exists();
      assert.dom('.secrets-header-title').exists();
      assert.dom('.secrets-explanation').exists();
      assert.dom('.new-secret').exists();
      assert.dom('.new-secret button').exists();
      assert.dom('#secrets-table').exists();
    });
  }
);
