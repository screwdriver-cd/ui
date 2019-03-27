import { computed, observer, get, set } from '@ember/object';
import { sort, not } from '@ember/object/computed';
import DS from 'ember-data';
import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import { isActiveBuild } from 'screwdriver-ui/utils/build';

export default DS.Model.extend(ModelReloaderMixin, {
  buildId: DS.attr('number'),
  causeMessage: DS.attr('string'),
  commit: DS.attr(),
  createTime: DS.attr('date'),
  creator: DS.attr(),
  isComplete: DS.attr('boolean', { defaultValue: false }),
  numBuilds: DS.attr('number', { defaultValue: 0 }),
  reloadWithoutNewBuilds: DS.attr('number', { defaultValue: 0 }),
  parentBuildId: DS.attr('number'),
  parentEventId: DS.attr('number'),
  pipelineId: DS.attr('string'),
  pr: DS.attr(),
  prNum: DS.attr('number'),
  sha: DS.attr('string'),
  startFrom: DS.attr('string'),
  status: DS.attr('string', { defaultValue: 'UNKNOWN' }),
  type: DS.attr('string'),
  workflow: DS.attr(),
  workflowGraph: DS.attr(),

  builds: DS.hasMany('build'),

  isRunning: not('isComplete'),
  buildsSorted: sort('builds', (a, b) => parseInt(a.id, 10) - parseInt(b.id, 10)),
  createTimeWords: computed('createTime', 'duration', {
    get() {
      if (get(this, 'createTime')) {
        const duration = Date.now() - get(this, 'createTime').getTime();

        return `${humanizeDuration(duration, { round: true, largest: 1 })} ago`;
      }

      return '0 seconds ago';
    }
  }),
  duration: computed('builds.[]', 'isComplete', {
    get() {
      const builds = get(this, 'builds');
      const firstCreateTime = builds.map(item => get(item, 'createTime')).sort()[0];
      let lastEndTime = new Date();

      if (get(this, 'isComplete')) {
        lastEndTime = builds.map(item => get(item, 'endTime')).sort().pop();
      }

      if (!firstCreateTime || !lastEndTime) {
        return 0;
      }

      return lastEndTime.getTime() - firstCreateTime.getTime();
    }
  }),
  durationText: computed('duration', {
    get() {
      return humanizeDuration(get(this, 'duration'), { round: true, largest: 1 });
    }
  }),
  truncatedMessage: computed('commit.message', {
    get() {
      const msg = this.get('commit.message');
      const cutOff = 150;

      return msg.length > cutOff ? `${msg.substring(0, cutOff)}...` : msg;
    }
  }),
  truncatedSha: computed('sha', {
    get() {
      return this.get('sha').substr(0, 7);
    }
  }),
  statusObserver: observer('builds.@each.status', 'isComplete', function statusObserver() {
    const builds = get(this, 'builds');
    let status = 'UNKNOWN';

    return builds
      .then(list => list.filter(b => get(b, 'status') !== 'SUCCESS'))
      .then((list) => {
        if (list.length) {
          status = get(list[0], 'status');
        } else {
          status = get(this, 'isComplete') ? 'SUCCESS' : 'RUNNING';
        }

        set(this, 'status', status);
      });
  }),
  isCompleteObserver: observer('builds.@each.{status,endTime}', function isCompleteObserver() {
    const builds = get(this, 'builds');

    builds
      .then((list) => {
        // Tell model to reload builds.
        this.startReloading();
        set(this, 'reload', get(this, 'reload') + 1);

        const numBuilds = get(list, 'length');

        // no builds yet
        if (!numBuilds) {
          set(this, 'isComplete', false);

          return false;
        }

        // See if any builds are running
        const runningBuild = list.find((b) => {
          const status = get(b, 'status');
          const endTime = get(b, 'endTime');

          return isActiveBuild(status, endTime);
        });

        // Something is running, so we aren't done
        if (runningBuild) {
          set(this, 'isComplete', false);
          set(this, 'numBuilds', numBuilds);
          set(this, 'reloadWithoutNewBuilds', 0);

          return false;
        }

        // Nothing is running now, check if new builds added during reload
        // If get(this, 'numBuilds') === 0 that means it is the first load not a reload
        const newBuilds = get(this, 'numBuilds') === 0 ? 0 : numBuilds - get(this, 'numBuilds');

        // New builds created during reload, event is still going, reset everything
        if (newBuilds > 0) {
          set(this, 'isComplete', false);
          set(this, 'numBuilds', numBuilds);
          set(this, 'reloadWithoutNewBuilds', 0);

          return false;
        }

        const reloadWithoutNewBuilds = get(this, 'reloadWithoutNewBuilds') + 1;

        // If reloads 2 times without new builds added, consider event as complete
        if (reloadWithoutNewBuilds >= 2) {
          set(this, 'isComplete', true);
          set(this, 'reloadWithoutNewBuilds', reloadWithoutNewBuilds);

          return true;
        }

        // No new builds added so far, keep counting the reload
        set(this, 'numBuilds', numBuilds);
        set(this, 'reloadWithoutNewBuilds', reloadWithoutNewBuilds);
        set(this, 'isComplete', false);

        return false;
      });
  }),

  modelToReload: 'builds',
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER,

  // Reload builds only if the event is still running
  shouldReload() {
    return get(this, 'isRunning') && !get(this, 'isPaused');
  }
});
