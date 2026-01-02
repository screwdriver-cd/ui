import Component from '@ember/component';
import { bool } from '@ember/object/computed';
import { computed, get, getProperties } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';
import { inject as service } from '@ember/service';
import MAX_NUM_OF_PARAMETERS_ALLOWED from 'screwdriver-ui/utils/constants';
import { isPipelineParameter } from 'screwdriver-ui/utils/pipeline/parameters';
import { getTimestamp } from '../../utils/timestamp-format';

export default Component.extend({
  userSettings: service(),
  store: service(),
  classNameBindings: ['highlighted', 'event.status'],
  highlighted: computed('selectedEvent', 'event.id', {
    get() {
      return this.selectedEvent === get(this, 'event.id');
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

  init() {
    this._super(...arguments);

    const pipelineParameters = {};
    const jobParameters = {};

    // Segregate pipeline level and job level parameters
    Object.entries(
      this.get('event.meta.parameters') === undefined
        ? {}
        : this.get('event.meta.parameters')
    ).forEach(([propertyName, propertyVal]) => {
      if (isPipelineParameter(propertyVal)) {
        pipelineParameters[propertyName] = propertyVal;
      } else {
        jobParameters[propertyName] = propertyVal;
      }
    });

    this.setProperties({
      pipelineParameters,
      jobParameters
    });
  },

  stoppableEventStatus: computed('event.status', {
    get() {
      const eventStatus = this.get('event.status');

      return eventStatus !== 'UNKNOWN' && eventStatus !== 'CREATED';
    }
  }),

  numberOfParameters: computed(
    'pipelineParameters',
    'jobParameters',
    function numberOfParameters() {
      return (
        Object.keys(this.pipelineParameters).length +
        Object.values(this.jobParameters).reduce((count, parameters) => {
          if (count) {
            return count + Object.keys(parameters).length;
          }

          return Object.keys(parameters).length;
        }, 0)
      );
    }
  ),

  isInlineParameters: computed('numberOfParameters', {
    get() {
      return this.numberOfParameters < MAX_NUM_OF_PARAMETERS_ALLOWED;
    }
  }),
  startDate: computed('event.createTime', {
    get() {
      let startDate = 'n/a';

      startDate = getTimestamp(this.userSettings, this.get('event.createTime'));

      return startDate;
    }
  }),

  isExternalTrigger: computed('event.{pipelineId,startFrom}', {
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

  isCommitterDifferent: computed(
    'isExternalTrigger',
    'event.{creator.name,commit.author.name}',
    {
      get() {
        const creatorName = this.get('event.creator.name');
        const authorName = this.get('event.commit.author.name');

        return this.isExternalTrigger || creatorName !== authorName;
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

      return { build_id, pipeline_id };
      /* eslint-enable camelcase */
    }
  }),

  actions: {
    clickRow() {
      const fn = this.eventClick;

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
