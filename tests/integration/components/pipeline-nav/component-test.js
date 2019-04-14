import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';

module('Integration | Component | sd pipeline nav', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders without child pipelines tab', async function(assert) {
    const pipeline = EmberObject.create({
      id: 1,
      appId: 'foo/bar',
      branch: 'master',
      scmContext: 'github:github.com'
    });

    this.set('pipelineMock', pipeline);

    await render(hbs`{{pipeline-nav pipeline=pipelineMock}}`);

    assert.dom('a').hasText('EventsSecretsOptionsMetrics');
  });

  test('it renders with child pipelines tab', async function(assert) {
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

    await render(hbs`{{pipeline-nav pipeline=pipelineMock}}`);

    assert.dom('a').hasText('Child PipelinesEventsSecretsOptionsMetrics');
  });
});
