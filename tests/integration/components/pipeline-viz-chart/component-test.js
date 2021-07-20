import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { pipeline, selectedConnectedPipeline } from 'screwdriver-ui/tests/mock/pipeline-viz';

module('Integration | Component | pipeline-viz-chart', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });
    assert.expect(2);

    this.setProperties({ pipeline, selectedConnectedPipeline });

    await render(
      hbs`{{pipeline-viz-chart pipeline=pipeline selectedConnectedPipeline=selectedConnectedPipeline}}`
    );

    assert.dom('.graph-node').exists({ count: 8 });
    assert.dom('.workflow-tooltip').exists({ count: 1 });
  });
});
