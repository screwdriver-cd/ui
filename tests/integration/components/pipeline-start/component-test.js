import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-start', 'Integration | Component | pipeline start', {
  integration: true
});

test('it renders', function (assert) {
  assert.expect(2);
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('onStartBuild', () => {
    assert.ok(true);
  });
  this.render(hbs`{{pipeline-start startBuild=onStartBuild}}`);

  assert.equal(this.$('button').text().trim(), 'Start');
  this.$('button').click();
});
