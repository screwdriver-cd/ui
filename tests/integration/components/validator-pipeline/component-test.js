import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | validator pipeline', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders default empty settings', async function(assert) {
    await render(hbs`{{validator-pipeline}}`);

    assert.equal(find('h4.pipeline').textContent.trim(), 'Pipeline Settings');

    assert.equal(find('.annotations .label').textContent.trim(), 'Annotations:');
    assert.equal(find('.annotations ul li').textContent.trim(), 'None defined');

    assert.equal(find('.workflow .label').textContent.trim(), 'Workflow:');
    assert.ok(this.$('.workflow canvas'), 'workflow canvas');
  });

  test('it renders pipeline annotations and workflow', async function(assert) {
    this.set('plMock', {
      annotations: {
        hello: 'hi'
      },
      workflow: [
        'firstjob',
        'secondjob'
      ]
    });

    await render(hbs`{{validator-pipeline annotations=plMock.annotations workflow=plMock.workflow}}`);

    assert.equal(find('.annotations .label').textContent.trim(), 'Annotations:');
    assert.equal(find('.annotations ul li').textContent.trim(), 'hello: hi');

    assert.equal(find('.workflow .label').textContent.trim(), 'Workflow:');
    assert.ok(this.$('.workflow canvas'), 'workflow canvas');
  });
});
