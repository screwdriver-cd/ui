import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/children', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(pipelinePageState, 'getChildPipelines').returns([
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
    assert.dom('#child-pipeline-table-container').exists({ count: 1 });
  });
});
