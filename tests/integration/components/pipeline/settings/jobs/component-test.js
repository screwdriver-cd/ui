import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/settings/jobs', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const pipelinePageState = this.owner.lookup('service:pipelinePageState');

    sinon.stub(pipelinePageState, 'getJobs').returns([]);
  });

  test('it renders', async function (assert) {
    await render(hbs`<Pipeline::Settings::Jobs />`);

    assert.dom('.section').exists();
    assert.dom('#enable-jobs-button').exists();
    assert.dom('#disable-jobs-button').exists();
  });

  test('it toggles cancel button correctly', async function (assert) {
    await render(hbs`<Pipeline::Settings::Jobs />`);
    assert.dom('#cancel-toggle-jobs-button').doesNotExist();

    await click('#enable-jobs-button');
    assert.dom('#cancel-toggle-jobs-button').exists();

    await click('#cancel-toggle-jobs-button');
    assert.dom('#cancel-toggle-jobs-button').doesNotExist();

    await click('#disable-jobs-button');
    assert.dom('#cancel-toggle-jobs-button').exists();
  });
});
