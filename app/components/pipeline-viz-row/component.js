import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  pipeline: undefined,
  selectedConnectedPipeline: undefined,
  icon: computed(function() {
    return statusIcon('success', true);
  }),

  isSelected: computed('selectedConnectedPipeline', function isSelected() {
    if (this.selectedConnectedPipeline) {
      return get(this.selectedConnectedPipeline, 'id') === get(this.pipeline, 'id');
    }

    return false;
  }),

  actions: {
    handleClick(pipeline) {
      this.onClick(pipeline);
    }
  }
});
