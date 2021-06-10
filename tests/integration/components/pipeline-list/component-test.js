import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';

module('Integration | Component | pipeline list', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
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

    await render(hbs`{{pipeline-list pipelines=pipelineList pipeline=pipeline}}`);

    assert.dom(find('tbody tr:first-child')).hasText('foo/bar master');
    assert.dom('tbody tr:nth-child(2)').hasText('batman/tumbler waynecorp');
    assert.dom('button').hasText('Start All');
    assert.dom('.num-results span').hasText('Found 2 child pipeline(s)');
  });

  test('it renders with zero child piplines found', async function(assert) {
    const pipelines = [];

    const pipeline = EmberObject.create({
      id: 1,
      appId: 'foo/bar',
      branch: 'master',
      scmContext: 'github:github.com'
    });

    this.set('pipelineList', pipelines);
    this.set('pipeline', pipeline);

    await render(hbs`{{pipeline-list pipelines=pipelineList pipeline=pipeline}}`);

    assert.dom('.num-results span').hasText('No child pipeline(s) created');
  });
});
