import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  pipeline: undefined,
  selectedConnectedPipeline: undefined,

  icon: computed(function() {
    return statusIcon('success', true);
  }),

  isSelectedConnectedPipeline: computed('selectedConnectedPipeline', 'pipeline', function isSelected() {
    if (this.selectedConnectedPipeline) {
      console.log('selectedConnectedPipeline ID', get(this.selectedConnectedPipeline, 'id'));
      console.log('pipeline ID', get(this.pipeline, 'id'));

      return get(this.selectedConnectedPipeline, 'id') === get(this.pipeline, 'id');
    }

    return false;
  }),

  isSelectedPipeline: computed('selectedPipeline', 'pipeline', function isSelected() {
    if (this.selectedPipeline) {
      console.log('selectedPipeline id', get(this.selectedPipeline, 'id'));
      console.log('pipeline id', get(this.pipeline, 'id'));

      return get(this.selectedPipeline, 'id') === get(this.pipeline, 'id');
    }

    return false;
  }),

  actions: {
    handleClick(pipeline) {
      this.onClick(pipeline);
    },

    handleActionClick(pipeline) {
      this.onActionClick(pipeline);
    }
  }
});
