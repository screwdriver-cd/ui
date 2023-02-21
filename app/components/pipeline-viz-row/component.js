import Component from '@ember/component';
import { computed } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  pipeline: undefined,
  selectedConnectedPipeline: undefined,

  icon: computed(() => statusIcon('success', true)),

  isSelectedConnectedPipeline: computed(
    'pipeline.id',
    'selectedConnectedPipeline.id',
    function isSelected() {
      if (this.selectedConnectedPipeline) {
        return this.selectedConnectedPipeline.id === this.pipeline.id;
      }

      return false;
    }
  ),

  isSelectedPipeline: computed(
    'pipeline.id',
    'selectedPipeline.id',
    function isSelected() {
      if (this.selectedPipeline) {
        return this.selectedPipeline.id === this.pipeline.id;
      }

      return false;
    }
  ),

  actions: {
    handleClick(pipeline) {
      this.onClick(pipeline);
    },

    handleActionClick(pipeline) {
      this.onActionClick(pipeline);
    }
  }
});
