import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/secrets-and-tokens/tab',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      await render(
        hbs`<Pipeline::SecretsAndTokens::Tab
            @activeTab="secrets"
        />`
      );

      assert.dom('#secrets-tab').exists({ count: 1 });
      assert.dom('#tokens-tab').exists({ count: 1 });
      assert.dom('#secrets-tab').hasClass('active');
    });

    test('it changes tabs correctly', async function (assert) {
      const onTabChangeSpy = sinon.spy();

      this.setProperties({
        onTabChange: onTabChangeSpy
      });

      await render(
        hbs`<Pipeline::SecretsAndTokens::Tab
            @activeTab="secrets"
            @onTabChange={{this.onTabChange}}
        />`
      );
      await click('#tokens-tab');

      assert.dom('#tokens-tab').hasClass('active');
      assert.equal(onTabChangeSpy.callCount, 1);
      assert.equal(onTabChangeSpy.calledWith('tokens'), true);
    });
  }
);
