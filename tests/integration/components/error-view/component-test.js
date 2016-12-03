import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('error-view', 'Integration | Component | error view', {
  integration: true
});

test('it renders', function (assert) {
  this.set('sc', 404);
  this.render(hbs`{{error-view errorMessage="bananas" statusCode=sc}}`);

  assert.equal(this.$('h4').text().trim(), 'bananas');
  assert.ok(this.$('img').prop('src').match('/assets/404-error-page.png$'));
  this.set('sc', 500);
  assert.ok(this.$('img').prop('src').match('/assets/500-error-page.png$'));
});
