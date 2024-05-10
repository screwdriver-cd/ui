import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | validator pipeline', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders default empty settings', async function (assert) {
    await render(hbs`<ValidatorPipeline />`);

    assert.dom('h4.pipeline').hasText('Pipeline Settings');

    assert.dom('.annotations .label').hasText('Annotations:');
    assert.dom('.annotations ul li').hasText('None defined');

    assert.dom('.workflow .label').hasText('Workflow:');
    assert.dom('.workflow svg').exists({ count: 1 });
  });

  test('it renders pipeline annotations and workflow', async function (assert) {
    this.set('plMock', {
      annotations: {
        hello: 'hi'
      },
      workflow: ['firstjob', 'secondjob']
    });

    await render(
      hbs`<ValidatorPipeline @annotations={{this.plMock.annotations}} @workflow={{this.plMock.workflow}} />`
    );

    assert.dom('.annotations .label').hasText('Annotations:');
    assert.dom('.annotations ul li').hasText('hello: hi');

    assert.dom('.workflow .label').hasText('Workflow:');
    assert.dom('.workflow svg').exists({ count: 1 });
  });
});
