import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';

module('Integration | Component | pipeline list', function (hooks) {
  setupRenderingTest(hooks);

  const PIPELINE = EmberObject.create({
    id: 1,
    appId: 'foo/bar',
    branch: 'master',
    scmContext: 'github:github.com',
    state: 'ACTIVE'
  });
  const CHILD_PIPELINE_ACTIVE = EmberObject.create({
    id: 3,
    appId: 'foo/bar',
    branch: 'master',
    scmContext: 'github:github.com',
    state: 'ACTIVE'
  });
  const CHILD_PIPELINE_INACTIVE = EmberObject.create({
    id: 4,
    appId: 'batman/tumbler',
    branch: 'waynecorp',
    scmContext: 'bitbucket:bitbucket.org',
    state: 'INACTIVE'
  });

  test('it renders', async function (assert) {
    const pipelines = [CHILD_PIPELINE_ACTIVE, CHILD_PIPELINE_INACTIVE];

    this.set('pipelineList', pipelines);
    this.set('pipeline', PIPELINE);

    await render(
      hbs`<PipelineList @pipelines={{this.pipelineList}} @pipeline={{this.pipeline}} />`
    );

    assert.dom(find('tbody tr:first-child')).hasText('foo/bar master active');
    assert
      .dom('tbody tr:nth-child(2)')
      .hasText('batman/tumbler waynecorp inactive');
    assert.dom('button').hasText('Start All');
    assert.dom('button').doesNotHaveAttribute('disabled');
    assert.dom('.num-results span').hasText('Found 2 child pipeline(s)');
  });

  test('it renders disabled "Start All" button', async function (assert) {
    const pipelines = [CHILD_PIPELINE_INACTIVE];

    this.set('pipelineList', pipelines);
    this.set('pipeline', PIPELINE);

    await render(
      hbs`{{pipeline-list pipelines=pipelineList pipeline=pipeline}}`
    );

    assert
      .dom(find('tbody tr:first-child'))
      .hasText('batman/tumbler waynecorp inactive');
    assert.dom('button').hasText('Start All');
    assert.dom('button').hasAttribute('disabled');
    assert.dom('.num-results span').hasText('Found 1 child pipeline(s)');
  });

  test('it renders with zero child pipelines found', async function (assert) {
    const pipelines = [];

    this.set('pipelineList', pipelines);
    this.set('pipeline', PIPELINE);

    await render(
      hbs`<PipelineList @pipelines={{this.pipelineList}} @pipeline={{this.pipeline}} />`
    );

    assert.dom('.num-results span').hasText('No child pipeline(s) created');
  });
});
