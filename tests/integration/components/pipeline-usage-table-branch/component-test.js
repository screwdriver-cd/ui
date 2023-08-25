import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

const testRecord = {
  branch: 'main',
  url: 'https://example.com'
};

module(
  'Integration | Component | pipeline-usage-table-branch',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.set('record', testRecord);

      await render(hbs`<PipelineUsageTableBranch @record={{this.record}}/>`);

      assert.dom('a').hasAttribute('href', testRecord.url);
      assert.dom('a').hasText(testRecord.branch);
      assert.dom('a svg.fa-code-branch').exists({ count: 1 });
    });
  }
);
