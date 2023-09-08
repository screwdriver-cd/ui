import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

const testRecord = {
  name: 'pipeline1',
  id: 42
};

module('Integration | Component | pipeline-usage-table-name', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.set('record', testRecord);

    await render(hbs`<PipelineUsageTableName @record={{this.record}}/>`);
    assert.dom('a').hasAttribute('href', `/pipelines/${testRecord.id}`);
    assert.dom('a').hasText(testRecord.name);
  });
});
