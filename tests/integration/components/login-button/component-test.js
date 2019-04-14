import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import injectScmServiceStub from '../../../helpers/inject-scm';

module('Integration | Component | login button', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    assert.expect(2);
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    this.set('externalAction', () => {
      assert.ok(true);
    });
    await render(hbs`{{login-button authenticate=(action externalAction)}}`);

    assert.dom('h2').hasText('Sign in to Screwdriver');
    await click('a');
  });

  test('it renders multiple buttons', async function(assert) {
    assert.expect(5);

    injectScmServiceStub(this);

    const contexts = this.get('scm').getScms();

    this.set('externalAction', context => {
      assert.ok(context);
    });
    this.set('model', contexts);
    await render(hbs`{{login-button authenticate=(action externalAction) scmContexts=model}}`);

    assert.dom('a').exists({ count: 2 });
    contexts.forEach((context, index) => {
      assert.equal(this.$(`a:eq(${index})`).text(), ` Sign in with ${context.displayName}`);
      this.$(`a:eq(${index})`).click();
    });
  });
});
