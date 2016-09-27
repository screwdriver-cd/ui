import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('loading-view', 'Integration | Component | loading view', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{loading-view}}`);

  assert.equal(this.$('h2').text().trim(), 'Loading...');
  assert.ok(this.$('p').text().trim());
});
