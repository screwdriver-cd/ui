import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/settings/jobs', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const pipelinePageState = this.owner.lookup('service:pipelinePageState');

    sinon.stub(pipelinePageState, 'getJobs').returns([
      {
        id: 1,
        name: 'test-a',
        permutations: [
          {
            annotations: {
              'screwdriver.cd/manualStartEnabled': false
            }
          }
        ]
      },
      {
        id: 2,
        name: 'test-b',
        permutations: [
          {
            annotations: {
              'screwdriver.cd/manualStartEnabled': true
            }
          }
        ]
      }
    ]);
  });

  test('it renders', async function (assert) {
    await render(hbs`<Pipeline::Settings::Jobs />`);

    assert.dom('.section').exists();
    assert.dom('#enable-jobs-button').exists();
    assert.dom('#disable-jobs-button').exists();
    assert.dom('td.job-column').exists({ count: 2 });
    assert
      .dom(this.element.querySelectorAll('td.job-column')[0])
      .hasText('test-a');
    assert
      .dom(this.element.querySelectorAll('td.job-column')[1])
      .hasText('test-b');
    assert.dom('.job-toggle-container').exists({ count: 2 });
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
