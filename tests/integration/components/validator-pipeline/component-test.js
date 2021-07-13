import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | validator pipeline', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders default empty settings', async function(assert) {
    await render(hbs`{{validator-pipeline}}`);

    assert.dom('h4.pipeline').hasText('Pipeline Settings');

    assert.dom('.annotations .label').hasText('Annotations:');
    assert.dom('.annotations ul li').hasText('None defined');

    assert.dom('.workflow .label').hasText('Workflow:');
    assert.ok(this.$('.workflow canvas'), 'workflow canvas');
  });

  test('it renders pipeline annotations and workflow', async function(assert) {
    this.set('plMock', {
      annotations: {
        hello: 'hi'
      },
      workflow: ['firstjob', 'secondjob']
    });

    await render(hbs`{{validator-pipeline annotations=plMock.annotations workflow=plMock.workflow}}`);

    assert.dom('.annotations .label').hasText('Annotations:');
    assert.dom('.annotations ul li').hasText('hello: hi');

    assert.dom('.workflow .label').hasText('Workflow:');
    assert.ok(this.$('.workflow canvas'), 'workflow canvas');
  });
});
