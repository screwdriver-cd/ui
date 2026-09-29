import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

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

  test('it opens the modal again after successfully starting all child pipelines', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');
    const shuttle = this.owner.lookup('service:shuttle');

    pipelinePageState.setPipeline({ id: 123 });
    pipelinePageState.setChildPipelines([
      {
        id: 124,
        name: 'child124',
        scmRepo: {
          branch: 'main',
          url: 'https://github.com/test'
        },
        scmContext: 'github:github.com',
        state: 'ACTIVE'
      }
    ]);
    sinon.stub(shuttle, 'fetchFromApi').resolves();

    await render(hbs`<Pipeline::Children />`);
    await click('#start-all-button-container > #start-all-button');
    await click('#start-all-children-modal #start-all-button');

    assert.dom('#start-all-children-modal').doesNotExist();

    await click('#start-all-button-container > #start-all-button');

    assert.dom('#start-all-children-modal').exists({ count: 1 });
  });
});
