import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('build-step-collection',
  'Integration | Component | sd build step collection', {
    integration: true
  }
);

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('stepsMock', []);
  this.set('buildMock', {});
  this.render(hbs`{{build-step-collection steps=stepsMock build=buildMock}}`);

  assert.equal(this.$().text().trim(), 'Steps');
});
