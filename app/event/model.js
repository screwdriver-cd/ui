import { computed, observer, get, set } from '@ember/object';
import { sort } from '@ember/object/computed';
import DS from 'ember-data';
import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
import { SHOULD_RELOAD_NO, SHOULD_RELOAD_YES } from '../mixins/model-reloader';

export default DS.Model.extend(ModelReloaderMixin, {
  buildId: DS.attr('number'),
  causeMessage: DS.attr('string'),
  commit: DS.attr(),
  createTime: DS.attr('date'),
  creator: DS.attr(),
  isComplete: DS.attr('boolean', { defaultValue: false }),
  meta: DS.attr(),
  numBuilds: DS.attr('number', { defaultValue: 0 }),
  reloadWithoutNewBuilds: DS.attr('number', { defaultValue: 0 }),
  parentBuildId: DS.attr('number'),
  parentEventId: DS.attr('number'),
  groupEventId: DS.attr('number'),
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

  isRunning: computed('isComplete', 'isSkipped', 'isAborted', function isRunningFunc() {
    let isRunning = true;

    if (this.isComplete || this.isSkipped || this.isAborted) {
      isRunning = false;
    }

    return isRunning;
  }),
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
        lastEndTime = builds
          .map(item => get(item, 'endTime'))
          .sort()
          .pop();
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
  label: computed('meta', {
    get() {
      return this.get('meta.label') || null;
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
      return this.sha.substr(0, 7);
    }
  }),
  // eslint-disable-next-line ember/no-observers
  statusObserver: observer('builds.@each.status', 'isComplete', function statusObserver() {
    if (this.isSaving || this.isSkipped) {
      return;
    }

    const builds = get(this, 'builds');

    let status = 'UNKNOWN';

    builds.then(list => {
      if (!this.isDestroying && !this.isDestroyed) {
        const validList = list.filter(b => get(b, 'status') !== 'SUCCESS' && get(b, 'status') !== 'CREATED');

        if (validList.length) {
          status = get(validList[0], 'status');
        } else {
          status = get(this, 'isComplete') ? 'SUCCESS' : 'RUNNING';
        }

        set(this, 'status', status);
      }
    });
  }),
  // eslint-disable-next-line ember/no-observers
  isCompleteObserver: observer('builds.@each.{status,endTime}', function isCompleteObserver() {
    if (this.isSaving) {
      return;
    }

    const builds = get(this, 'builds');

    builds.then(list => {
      if (this.isDestroying || this.isDestroyed) {
        return false;
      }

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
      const runningBuild = list.find(b => {
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
  isAborted: computed('status', function isAbortedFunc() {
    return get(this, 'status') === 'ABORTED';
  }),
  isSkipped: computed('commit.message', 'type', 'numBuilds', {
    get() {
      if (get(this, 'type') === 'pr') {
        return false;
      }
      const msg = get(this, 'commit.message');
      const numBuilds = get(this, 'numBuilds');

      if (numBuilds !== 0) {
        return false;
      }

      return msg ? msg.match(/\[(skip ci|ci skip)\]/) : false;
    }
  }),

  // Reload builds only if the event is still running
  shouldReload() {
    return get(this, 'isRunning') ? SHOULD_RELOAD_YES : SHOULD_RELOAD_NO;
  },
  init() {
    this._super(...arguments);
    if (get(this, 'isSkipped')) {
      set(this, 'status', 'SKIPPED');
    }
  }
});
