import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('error-view', 'Integration | Component | error view', {
  integration: true
});

test('it renders', function (assert) {
  this.set('sc', 400);
  this.set('sm', 'they are dead, dave');
  this.render(hbs`{{error-view errorMessage="bananas" statusCode=sc statusMessage=sm}}`);

  assert.equal(this.$('h1').text().trim(), '400');
  assert.equal(this.$('h2').text().trim(), 'they are dead, dave');
  assert.equal(this.$('h4').text().trim(), 'bananas');
});
