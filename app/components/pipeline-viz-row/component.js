import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  pipeline: undefined,
  selectedConnectedPipeline: undefined,

  icon: computed(() => statusIcon('success', true)),

  isSelectedConnectedPipeline: computed(
    'selectedConnectedPipeline',
    'pipeline',
    function isSelected() {
      if (this.selectedConnectedPipeline) {
        return (
          get(this.selectedConnectedPipeline, 'id') === get(this.pipeline, 'id')
        );
      }

      return false;
    }
  ),

  isSelectedPipeline: computed(
    'selectedPipeline',
    'pipeline',
    function isSelected() {
      if (this.selectedPipeline) {
        return get(this.selectedPipeline, 'id') === get(this.pipeline, 'id');
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
