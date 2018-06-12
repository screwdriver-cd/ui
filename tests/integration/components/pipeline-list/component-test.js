import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';

moduleForComponent('pipeline-list', 'Integration | Component | pipeline list', {
  integration: true
});

test('it renders', function (assert) {
  const pipelines = [
    EmberObject.create({
      id: 3,
      appId: 'foo/bar',
      branch: 'master',
      scmContext: 'github:github.com'
    }),
    EmberObject.create({
      id: 4,
      appId: 'batman/tumbler',
      branch: 'waynecorp',
      scmContext: 'bitbucket:bitbucket.org'
    })
  ];

  const pipeline = EmberObject.create({
    id: 1,
    appId: 'foo/bar',
    branch: 'master',
    scmContext: 'github:github.com'
  });

  this.set('pipelineList', pipelines);
  this.set('pipeline', pipeline);

  this.render(hbs`{{pipeline-list pipelines=pipelineList pipeline=pipeline}}`);

  assert.equal(this.$('ul li:first-child').text().trim(), 'foo/bar');
  assert.equal(this.$('ul li:nth-child(2)').text().trim(), 'batman/tumbler');
  assert.equal(this.$('button').text().trim(), 'Start All');
  assert.equal(this.$('.num-results span').text().trim(), 'Found 2 child pipeline(s)');
});

test('it renders with zero child piplines found', function (assert) {
  const pipelines = [];

  const pipeline = EmberObject.create({
    id: 1,
    appId: 'foo/bar',
    branch: 'master',
    scmContext: 'github:github.com'
  });

  this.set('pipelineList', pipelines);
  this.set('pipeline', pipeline);

  this.render(hbs`{{pipeline-list pipelines=pipelineList pipeline=pipeline}}`);

  assert.equal(this.$('.num-results span').text().trim(), 'No child pipeline(s) created');
});
