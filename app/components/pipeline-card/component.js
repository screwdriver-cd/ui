import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  eventsInfo: null,
  lastEventInfo: null,
  isAuthenticated: undefined,
  isOrganizing: false,
  pipeline: null,
  pipelineSelected: false,
  classNames: ['pipeline-card'],

  showCheckbox: computed('isOrganizing', 'isAuthenticated', function showCheckbox() {
    return this.isOrganizing && this.isAuthenticated;
  }),

  didReceiveAttrs() {
    this.set('eventsInfo', this.pipeline.eventsInfo);
    this.set('lastEventInfo', this.pipeline.lastEventInfo);
  },

  actions: {
    removePipeline() {
      this.pipelineRemove(this.pipeline.id);
    },
    togglePipeline() {
      const pipelineId = this.pipeline.id;

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
