import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  pipeline: undefined,
  selectedPipeline: undefined,
  icon: computed(function() {
    return statusIcon('success', true);
  }),
  isSelected: computed('selectedPipeline', function isSelected() {
    if (this.selectedPipeline) {
      return get(this.selectedPipeline, 'id') === get(this.pipeline, 'id');
    }

    return false;
  }),

  actions: {
    handleClick(pipeline) {
      this.onClick(pipeline);
    }
  }
});
