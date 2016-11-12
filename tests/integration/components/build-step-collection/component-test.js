import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('build-step-collection',
  'Integration | Component | sd build step collection', {
    integration: true
  }
);

test('it renders', function (assert) {
  const $ = this.$;

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.render(hbs`{{build-step-collection}}`);

  assert.equal($($('.heading').get(0)).text().trim(), 'Status');
  assert.equal($($('.heading').get(1)).text().trim(), 'Step');
  assert.equal($($('.heading').get(2)).text().trim(), 'Duration');

  this.render(hbs`{{#build-step-collection}}
    <div class="hello">hello</div>
    {{/build-step-collection}}`);

  assert.equal($('.hello').text().trim(), 'hello');
});
