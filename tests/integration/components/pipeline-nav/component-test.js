import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';

moduleForComponent('pipeline-nav', 'Integration | Component | sd pipeline nav', {
  integration: true
});

test('it renders without child pipelines tab', function (assert) {
  const pipeline = EmberObject.create({
    id: 1,
    appId: 'foo/bar',
    branch: 'master',
    scmContext: 'github:github.com'
  });

  this.set('pipelineMock', pipeline);

  this.render(hbs`{{pipeline-nav pipeline=pipelineMock}}`);

  assert.equal(this.$('a').text().trim(), 'EventsSecretsOptions');
});

test('it renders with child pipelines tab', function (assert) {
  const pipeline = EmberObject.create({
    id: 1,
    appId: 'foo/bar',
    branch: 'master',
    scmContext: 'github:github.com',
    childPipelines: {
      foo: 'bar'
    }
  });

  this.set('pipelineMock', pipeline);

  this.render(hbs`{{pipeline-nav pipeline=pipelineMock}}`);

  assert.equal(this.$('a').text().trim(), 'Child PipelinesEventsSecretsOptions');
});
