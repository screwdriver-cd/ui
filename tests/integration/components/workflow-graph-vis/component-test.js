import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('workflow-graph-vis', 'Integration | Component | workflow graph vis', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{workflow-graph-vis}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#workflow-graph-vis}}
      template block text
    {{/workflow-graph-vis}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
