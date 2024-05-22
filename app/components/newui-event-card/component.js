import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { bool } from '@ember/object/computed';
import { statusIcon } from 'screwdriver-ui/utils/build';
import { getTimestamp } from 'screwdriver-ui/utils/timestamp-format';

export default Component.extend({
  router: service(),
  userSettings: service(),
  classNames: ['event-card'],
  classNameBindings: ['highlighted'],
  highlighted: false,
  icon: computed('event.status', {
    get() {
      return statusIcon(this.get('event.status'), true);
    }
  }),
  startDate: computed('event.createTime', {
    get() {
      let startDate = 'n/a';

      startDate = getTimestamp(this.userSettings, this.get('event.createTime'));

      return startDate;
    }
  }),
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

  click() {
    const eventId = this.event.id;
    const { pipelineId } = this;

    this.router.transitionTo(`/v2/pipelines/${pipelineId}/events/${eventId}`);
  },
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
      const keys = Object.keys(propertyVal);

      if (keys.length === 1 && keys[0] === 'value') {
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

  numberOfUnstableOrFailureBuilds: computed('event.builds.@each.status', {
    async get() {
      const list = await this.event.builds;

      const targetEvents = list.filter(e =>
        ['UNSTABLE', 'FAILURE', 'ABORTED'].includes(e.status)
      );

      return targetEvents.length;
    }
  }),

  numberOfRunningBuilds: computed('event.builds.@each.status', {
    async get() {
      const list = await this.event.builds;

      const targetEvents = list.filter(e =>
        ['QUEUED', 'RUNNING', 'UNKNOWN'].includes(e.status)
      );

      return targetEvents.length;
    }
  }),

  hasAllSuccessBuilds: computed('event.builds.@each.status', {
    async get() {
      const list = await this.event.builds;

      return list.every(e => e.status === 'SUCCESS');
    }
  }),

  didReceiveAttrs() {
    this._super();
    const eventId = this.event.id;
    const currentEventId = this.selectedEventId;

    if (eventId === currentEventId) {
      this.set('highlighted', true);
    } else {
      this.set('highlighted', false);
    }
  },

  actions: {
    toggleParametersPreview() {
      this.toggleProperty('isShowingModal');
    }
  }
});
