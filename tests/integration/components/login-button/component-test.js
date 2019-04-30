import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import injectScmServiceStub from '../../../helpers/inject-scm';

module('Integration | Component | login button', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    assert.expect(2);
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

    const contexts = this.owner.lookup('service:scm').getScms();

    this.set('externalAction', context => {
      assert.ok(context);
    });
    this.set('model', contexts);
    await render(hbs`{{login-button authenticate=(action externalAction) scmContexts=model}}`);

    assert.dom('a').exists({ count: 2 });

    const a = findAll('a');

    contexts.forEach(async (context, i) => {
      assert.dom(a[i]).hasText(`Sign in with ${context.displayName}`);

      await click(a[i]);
    });
  });
});
