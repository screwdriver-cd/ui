import Component from '@ember/component';
import { statusIcon } from 'screwdriver-ui/utils/build';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  router: service(),
  classNames: ["event-card"],
  classNameBindings: ['highlighted'],
  highlighted: false,
  icon: computed('event.status', {
    get() {
      return statusIcon(this.get('event.status'), true);
    }
  }),

  // click() {
  //   // redirect to event id route and highlight when eventId match
  //   this.toggleProperty('highlighted');
  // },

  click() {
    // redirect to event id route and highlight when eventId match
    // this.toggleProperty('highlighted');
    const eventId = this.event.id;
    const pipelineId = this.pipelineId;

    this.router.transitionTo(`/v2/pipelines/${pipelineId}/events/${eventId}`);
  },

  didReceiveAttrs() {
    const eventId = this.event.id;
    const currentEventId =  this.selectedEventId;

    if (eventId === currentEventId) {      
      this.set('highlighted', true);
    } else {
      this.set('highlighted', false);
    }
  }
});
