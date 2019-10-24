import Component from '@ember/component';
import { computed, get, getProperties } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

const MAX_NUM_INLINE_PARAMETERS = 5;

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
      const eventProperties = getProperties(this, 'event.workflowGraph', 'event.isSkipped');

      return eventProperties['event.workflowGraph'] && !eventProperties['event.isSkipped'];
    }
  }),

  numberOfParameters: computed('event.meta.parameters', {
    get() {
      const parameters = this.getWithDefault('event.meta.parameters', {});

      return Object.keys(parameters).length;
    }
  }),

  isInlineParameters: computed('numberOfParameters', {
    get() {
      return this.get('numberOfParameters') < MAX_NUM_INLINE_PARAMETERS;
    }
  }),

  actions: {
    clickRow() {
      const fn = get(this, 'eventClick');

      if (typeof fn === 'function') {
        fn(get(this, 'event.id'));
      }
    },
    toggleParametersPreview() {
      this.toggleProperty('isShowingModal');
    }
  },
  click() {
    this.send('clickRow');
  }
});
