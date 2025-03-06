import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/nav', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(pipelinePageState, 'getPipeline').returns({});

    await render(hbs`<Pipeline::Nav />`);

    assert.dom('#pipeline-nav a').exists({ count: 4 });
  });

  test('it renders link to child pipelines', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon
      .stub(pipelinePageState, 'getPipeline')
      .returns({ childPipelines: [{ id: 1 }] });

    await render(hbs`<Pipeline::Nav />`);

    assert.dom('#pipeline-nav a').exists({ count: 5 });
  });
});
