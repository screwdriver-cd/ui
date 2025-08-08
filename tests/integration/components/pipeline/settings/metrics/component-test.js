import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/settings/metrics', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const pipelinePageState = this.owner.lookup('service:pipelinePageState');

    sinon.stub(pipelinePageState, 'getJobs').returns([]);
    sinon.stub(pipelinePageState, 'getPipeline').returns({});
  });

  test('it renders', async function (assert) {
    await render(hbs`<Pipeline::Settings::Metrics />`);

    assert.dom('.section').exists();
    assert.dom('#include-jobs-button').exists();
    assert.dom('#exclude-jobs-button').exists();
    assert.dom('#cancel-toggle-jobs-button').doesNotExist();
    assert.dom('#metrics-table').exists();
  });

  test('it toggles cancel button correctly', async function (assert) {
    await render(hbs`<Pipeline::Settings::Metrics />`);
    assert.dom('#cancel-toggle-jobs-button').doesNotExist();

    await click('#include-jobs-button');
    assert.dom('#cancel-toggle-jobs-button').exists();

    await click('#cancel-toggle-jobs-button');
    assert.dom('#cancel-toggle-jobs-button').doesNotExist();

    await click('#exclude-jobs-button');
    assert.dom('#cancel-toggle-jobs-button').exists();
  });
});
