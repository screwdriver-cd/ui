import Component from '@ember/component';
import { computed } from '@ember/object';
import { and } from '@ember/object/computed';

export default Component.extend({
  tagName: 'tr',
  eventsInfo: null,
  lastEventInfo: null,
  isAuthenticated: false,
  isOrganizing: false,
  pipeline: null,
  pipelineSelected: false,
  reset: false,

  showCheckbox: and('isOrganizing', 'isAuthenticated'),

  showRemoveButton: computed('isOrganizing', 'isAuthenticated', function showRemoveButton() {
    return !this.isOrganizing && this.isAuthenticated;
  }),

  didReceiveAttrs() {
    this.setProperties({
      eventsInfo: this.pipeline.eventsInfo,
      lastEventInfo: this.pipeline.lastEventInfo
    });
  },

  actions: {
    removePipeline() {
      this.removePipeline(this.pipeline.id);
    },
    togglePipeline() {
      const pipelineId = this.pipeline.id;

      if (this.reset) {
        this.setProperties({
          pipelineSelected: false,
          reset: false
        });
      }

      if (this.pipelineSelected) {
        this.set('pipelineSelected', false);
        this.deselectPipeline(pipelineId);
      } else {
        this.set('pipelineSelected', true);
        this.selectPipeline(pipelineId);
      }
    }
  }
});
