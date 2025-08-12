import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/settings/cache', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipelinePageState');

    sinon.stub(pipelinePageState, 'getPipelineId').returns(1);
    sinon.stub(pipelinePageState, 'getJobs').returns([]);

    await render(hbs`<Pipeline::Settings::Cache />`);

    assert.dom('.section').exists();
    assert.dom('#clear-pipeline-cache-button').exists();
    assert.dom('#jobs-cache-table').exists();
  });
});
