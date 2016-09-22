import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('search-list', 'Integration | Component | search list', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const pipelines = [
    Ember.Object.create({
      id: 1,
      appId: 'foo:bar'
    }),
    Ember.Object.create({
      id: 2,
      appId: 'batman:tumbler'
    })
  ];

  this.set('pipelineList', pipelines);

  this.render(hbs`{{search-list pipelines=pipelineList}}`);

  assert.equal($($('li').get(0)).text().trim(), 'foo:bar');
  assert.equal($($('li').get(1)).text().trim(), 'batman:tumbler');
});
