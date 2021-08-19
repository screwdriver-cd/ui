import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import {
  selectedConnectedPipeline,
  selectedPipeline,
  connectedPipelines
} from 'screwdriver-ui/tests/mock/pipeline-viz';

module('Integration | Component | pipeline-viz-nav', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });
    assert.expect(2);

    this.setProperties({
      selectedConnectedPipeline,
      selectedPipeline,
      connectedPipelines,
      pipelines: []
    });

    this.set('searchPipeline', function () {
      assert.ok(true);
    });

    this.set('selectConnectedPipeline', function () {
      assert.ok(true);
    });

    await render(
      hbs`{{pipeline-viz-nav
        selectedPipeline=selectedPipeline
        selectedConnectedPipeline=selectedConnectedPipeline
        pipelines=pipelines
        connectedPipelines=connectedPipelines
        onSearchPipeline=searchPipeline
        onSelectPipeline=selectPipeline
        onClickConnectedPipeline=selectConnectedPipeline
      }}`
    );

    assert
      .dom('.ember-power-select-selected-item')
      .hasText('screwdriver-cd/screwdriver');
    assert.dom('.pipeline-viz-row').exists({ count: 3 });
  });
});
