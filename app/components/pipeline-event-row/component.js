import Component from '@ember/component';
import { bool } from '@ember/object/computed';
import { computed, get, getProperties } from '@ember/object';
import { statusIcon, isActiveBuild } from 'screwdriver-ui/utils/build';
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
      const eventProperties = getProperties(
        this,
        'event.workflowGraph',
        'event.isSkipped'
      );

      return (
        eventProperties['event.workflowGraph'] &&
        !eventProperties['event.isSkipped']
      );
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
      const startFrom = this.get('event.startFrom');
      const pipelineId = this.get('event.pipelineId');

      let isExternal = false;

      if (startFrom && startFrom.match(/^~sd@(\d+):([\w-]+)$/)) {
        isExternal =
          Number(startFrom.match(/^~sd@(\d+):([\w-]+)$/)[1]) !== pipelineId;
      }

      return isExternal;
    }
  }),

  isCommiterDifferent: computed(
    'isExternalTrigger',
    'event.{creator.name,commit.author.name}',
    {
      get() {
        const creatorName = this.get('event.creator.name');
        const authorName = this.get('event.commit.author.name');

        return this.get('isExternalTrigger') || creatorName !== authorName;
      }
    }
  ),

  isSubscribedEvent: bool('event.meta.subscribedSourceUrl'),

  externalBuild: computed('event.{causeMessage,startFrom}', {
    get() {
      // using underscore because router.js doesn't pick up camelcase
      /* eslint-disable camelcase */
      let pipeline_id = this.get('event.startFrom').match(/^~sd@(\d+):[\w-]+$/);

      let build_id = this.get('event.causeMessage').match(/\s(\d+)$/);

      if (build_id) {
        build_id = build_id[1];
      }
      if (pipeline_id) {
        pipeline_id = pipeline_id[1];
      }
      /* eslint-enable camelcase */

      return { build_id, pipeline_id };
    }
  }),
  inited: true,
  isJobsRunning: computed('jobs.@each.builds', 'inited', {
    get() {
      return this.jobs.some(j => {
        const status = j.builds.get('firstObject.status');
        const endTime = j.builds.get('firstObject.endTime');

        return isActiveBuild(status, endTime);
      });
    }
  }),
  showJobs: computed('jobs.@each.builds', 'inited', {
    get() {
      return this.inited || this.jobs.some(j => !!j.get('builds.length'));
    }
  }),
  actions: {
    clickRow() {
      const fn = get(this, 'eventClick');

      if (typeof fn === 'function') {
        const { id, type } = this.event;

        fn(id, type);
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
