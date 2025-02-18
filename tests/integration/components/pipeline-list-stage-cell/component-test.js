import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline list stage cell', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.set('record', {
      job: { stageName: 'production' }
    });

    await render(hbs`<PipelineListStageCell
      @record={{this.record}}
    />`);

    assert.dom('.stage-name').hasText('production');
  });

  test('it renders default stage N/A if does not exist', async function (assert) {
    this.set('record', {
      job: { stageName: 'N/A' }
    });

    await render(hbs`<PipelineListStageCell
      @record={{this.record}}
    />`);

    assert.dom('.stage-name').hasText('N/A');
  });
});
