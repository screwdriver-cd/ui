import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | pipeline/children', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    pipelinePageState.setChildPipelines([
      {
        id: 123,
        name: 'child123',
        scmRepo: {
          branch: 'main',
          url: 'https://github.com/test'
        },
        scmContext: 'github:github.com',
        state: 'ACTIVE'
      }
    ]);

    await render(hbs`<Pipeline::Children />`);

    assert.dom('#start-all-button-container').exists({ count: 1 });
    assert.dom('#start-all-button').isEnabled();
    assert.dom('#child-pipeline-table-container').exists({ count: 1 });
    assert.dom('#no-child-pipelines-message').doesNotExist();

    pipelinePageState.setChildPipelines([]);
    await settled();

    assert.dom('#start-all-button-container').doesNotExist();
    assert.dom('#child-pipeline-table-container').isNotVisible();
    assert
      .dom('#no-child-pipelines-message')
      .hasText('No child pipeline(s) created');
  });

  test('it disables start all when all child pipelines are inactive', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    pipelinePageState.setChildPipelines([
      {
        id: 124,
        name: 'child124',
        scmRepo: {
          branch: 'main',
          url: 'https://github.com/test'
        },
        scmContext: 'github:github.com',
        state: 'INACTIVE'
      }
    ]);

    await render(hbs`<Pipeline::Children />`);

    assert.dom('#start-all-button').isDisabled();
  });
});
