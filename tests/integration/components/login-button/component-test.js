import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import injectScmServiceStub from '../../../helpers/inject-scm';

moduleForComponent('login-button', 'Integration | Component | login button', {
  integration: true
});

test('it renders', function (assert) {
  assert.expect(2);
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('externalAction', () => {
    assert.ok(true);
  });
  this.render(hbs`{{login-button authenticate=(action externalAction)}}`);

  assert.equal(this.$('h2').text().trim(), 'Sign in to Screwdriver');
  this.$('a').click();
});

test('it renders multiple buttons', function (assert) {
  assert.expect(5);

  injectScmServiceStub(this);

  const contexts = this.get('scm').getScms();

  this.set('externalAction', (context) => {
    assert.ok(context);
  });
  this.set('model', contexts);
  this.render(hbs`{{login-button authenticate=(action externalAction) scmContexts=model}}`);

  assert.equal(this.$('a').length, 2);
  contexts.forEach((context, index) => {
    assert.equal(this.$(`a:eq(${index})`).text(), ` Sign in with ${context.displayName}`);
    this.$(`a:eq(${index})`).click();
  });
});
