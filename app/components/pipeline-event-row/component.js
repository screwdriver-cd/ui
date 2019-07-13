import Component from '@ember/component';
import { computed, get } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  classNameBindings: ['highlighted', 'event.status'],
  highlighted: computed('selectedEvent', 'event.id', {
    get() {
      return get(this, 'selectedEvent') === get(this, 'event.id');
    }
  }),
  icon: computed('event.status', {
    get() {
      return statusIcon(this.get('event.status'), true);
    }
  }),
  isShowGraph: computed('event.{workflowGraph,isSkipped}', {
    get() {
      const workflowGraph = get(this, 'event.workflowGraph');
      const isSkipped = get(this, 'event.isSkipped');

      return workflowGraph && !isSkipped;
    }
  }),
  actions: {
    clickRow() {
      const fn = get(this, 'eventClick');

      if (typeof fn === 'function') {
        fn(get(this, 'event.id'));
      }
    }
  },
  click() {
    this.send('clickRow');
  }
});
