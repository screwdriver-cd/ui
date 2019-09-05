import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  tagName: 'tr',
  store: service(),
  eventsInfo: null,
  lastEventInfo: null,
  isAuthenticated: undefined,
  collectionId: undefined,

  didReceiveAttrs() {
    this.set('eventsInfo', this.pipeline.eventsInfo);
    this.set('lastEventInfo', this.pipeline.lastEventInfo);
  },

  actions: {
    pipelineRemove(pipelineId) {
      this.pipelineRemove(pipelineId, this.collectionId);
    }
  }
});
