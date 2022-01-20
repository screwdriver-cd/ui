import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { computed, set, get } from '@ember/object';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
export default Component.extend({
  store: service(),
  classNameBindings: ['highlighted'],
  highlighted: computed('selectedEvent', 'eventId', {
    get() {
      return get(this, 'selectedEvent') === get(this, 'eventId');
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
    get() {
      return this.inited || this.jobs.some(j => !!j.get('builds.length'));
    }
  }),

  allJobBuilds: computed('jobs.@each.builds', function () {
    const builds = [];

    this.jobs.forEach(j => {
      builds.pushObjects(j.builds.toArray());
    });

    return builds;
  }),

  isRunning: computed('allJobBuilds.@each.status', 'inited', {
    get() {
      const isActive = this.allJobBuilds.any(b => {
        const { status } = b;
        const { endTime } = b;

        return isActiveBuild(status, endTime);
      });

      return isActive;
    }
  }),

  actions: {
    selectPR() {
      set(this, 'selected', this.get('eventId'));
    }
  }
});
