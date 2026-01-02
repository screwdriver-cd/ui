import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed, set } from '@ember/object';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
import { isActivePipeline } from 'screwdriver-ui/utils/pipeline';

export default Component.extend({
  store: service(),
  optInRouteMappingService: service('opt-in-route-mapping'),
  classNameBindings: ['highlighted'],
  highlighted: computed('selectedEvent', 'eventId', {
    get() {
      return this.selectedEvent === this.eventId;
    }
  }),
  didInsertElement() {
    this._super(...arguments);
    this.set('inited', false);
  },
  inited: true,

  async init() {
    this._super(...arguments);

    const pipelineId = this.get('pipeline.id');
    const jobName = this.get('jobs.firstObject.name');
    // extract prNumber from jobName
    const prNum = jobName.split(/PR-(\d+):/)[1];
    const events = await this.store.query('event', {
      pipelineId,
      page: 1,
      count: 1,
      prNum
    });
    const currentEventId = events.get('firstObject.id');

    set(this, 'eventId', currentEventId);
  },

  showJobs: computed('jobs.@each.builds', 'inited', {
    async get() {
      if (this.inited) {
        return true;
      }

      for (const j of this.jobs) {
        if ((await j.builds).length) return true;
      }

      return false;
    }
  }),

  allJobBuilds: computed('jobs.@each.builds', function () {
    const builds = [];

    this.jobs.forEach(async j => {
      builds.pushObjects((await j.builds).toArray());
    });

    return builds;
  }),

  isRunning: computed('allJobBuilds.@each.status', 'inited', {
    get() {
      const isActive = this.allJobBuilds.any(b => {
        const { status, endTime } = b;

        return isActiveBuild(status, endTime);
      });

      return isActive;
    }
  }),

  isStartButtonDisabled: computed('pipeline.state', {
    get() {
      return !isActivePipeline(this.get('pipeline'));
    }
  }),

  actions: {
    selectPR() {
      set(this, 'selected', this.eventId);
      this.optInRouteMappingService.prEventId = this.eventId;
    }
  }
});
