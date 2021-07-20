import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import {
  pipeline,
  selectedConnectedPipeline,
  selectedPipeline
} from 'screwdriver-ui/tests/mock/pipeline-viz';

module('Integration | Component | pipeline-viz-row', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    this.setProperties({ selectedConnectedPipeline, selectedPipeline, pipeline });

    this.set('handleSelectedConnectedPipeline', function() {
      assert.ok(true);
    });

    this.set('handleSelectedPipeline', function() {
      assert.ok(true);
    });

    await render(
      hbs`{{pipeline-viz-row
        pipeline=pipeline
        selectedPipeline=selectedPipeline
        selectedConnectedPipeline=selectedConnectedPipeline
        onClick=handleSelectedConnectedPipeline
        onActionClick=handleSelectedPipeline
      }}`
    );

    assert.dom('.repo-name').includesText('screwdriver-cd/screwdriver');
    assert.dom('.pipeline-viz-row').exists({ count: 1 });
  });
});
