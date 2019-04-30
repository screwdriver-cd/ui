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

    assert.dom('li:first-child a').hasText('Events');
    assert.dom('li:nth-child(2) a').hasText('Secrets');
    assert.dom('li:nth-child(3) a').hasText('Options');
    assert.dom('li:last-child a').hasText('Metrics');
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

    assert.dom('li:first-child a').hasText('Child Pipelines');
    assert.dom('li:nth-child(2) a').hasText('Events');
    assert.dom('li:nth-child(3) a').hasText('Secrets');
    assert.dom('li:nth-child(4) a').hasText('Options');
    assert.dom('li:last-child a').hasText('Metrics');
  });
});
