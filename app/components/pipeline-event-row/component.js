import Component from '@ember/component';
import { computed, get, getProperties } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';
import MAX_NUM_OF_PARAMETERS_ALLOWED from 'screwdriver-ui/utils/constants';

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
      return this.get('numberOfParameters') < MAX_NUM_OF_PARAMETERS_ALLOWED;
    }
  }),

  isExternalTrigger: computed('event.startFrom', {
    get() {
      return this.get('event.startFrom').match(/^~sd@(\d+):([\w-]+)$/);
    }
  }),

  isCommiterDifferent: computed('isExternalTrigger', 'event.{creator.name,commit.author.name}', {
    get() {
      const creatorName = this.get('event.creator.name');
      const authorName = this.get('event.commit.author.name');

      return this.get('isExternalTrigger') || creatorName !== authorName;
    }
  }),

  externalBuild: computed('event.{causeMessage,startFrom}', {
    get() {
      // using underscore because router.js doesn't pick up camelcase
      /* eslint-disable camelcase */
      const build_id = this.get('event.causeMessage').match(/\d+$/)[0];
      const pipeline_id = this.get('event.startFrom').match(/^~sd@(\d+):[\w-]+$/)[1];
      /* eslint-enable camelcase */

      return { build_id, pipeline_id };
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
