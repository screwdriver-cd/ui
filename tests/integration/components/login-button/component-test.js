import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

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

  assert.equal(this.$('h2').text().trim(), 'Login to Screwdriver');
  this.$('a').click();
});
