import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-event-row', 'Integration | Component | pipeline event row', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{pipeline-event-row}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#pipeline-event-row}}
      template block text
    {{/pipeline-event-row}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
