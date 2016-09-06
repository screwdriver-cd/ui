import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-environment-settings',
  'Integration | Component | pipeline environment settings', {
    integration: true
  }
);

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{pipeline-environment-settings}}`);

  // the table is present
  assert.equal(this.$('table').length, 1);
});
