import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-nav', 'Integration | Component | sd pipeline nav', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{pipeline-nav}}`);

  assert.equal(this.$('a').text().trim(), 'EventsSecretsOptions');
});
