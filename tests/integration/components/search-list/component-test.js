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
      appId: 'foo/bar',
      branch: 'master'
    }),
    Ember.Object.create({
      id: 2,
      appId: 'batman/tumbler',
      branch: 'waynecorp'
    })
  ];

  this.set('pipelineList', pipelines);

  this.render(hbs`{{search-list pipelines=pipelineList}}`);

  assert.equal($($('li .appId').get(0)).text().trim(), 'batman/tumbler');
  assert.equal($($('li .branch').get(0)).text().trim(), 'waynecorp');
  assert.equal($($('li .appId').get(1)).text().trim(), 'foo/bar');
  assert.equal($($('li .branch').get(1)).text().trim(), 'master');
});

test('it filters the list', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const pipelines = [
    Ember.Object.create({
      id: 1,
      appId: 'foo/bar',
      branch: 'master'
    }),
    Ember.Object.create({
      id: 2,
      appId: 'batman/tumbler',
      branch: 'waynecorp'
    })
  ];

  this.set('pipelineList', pipelines);
  this.set('q', 'foo');

  this.render(hbs`{{search-list pipelines=pipelineList query=q}}`);

  assert.ok($('li').length, 1);
  assert.equal($('li .appId').text().trim(), 'foo/bar');
  assert.equal($('li .branch').text().trim(), 'master');
});
