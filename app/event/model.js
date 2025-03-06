import Model, { attr, hasMany } from '@ember-data/model';
import { computed, observer, get, set } from '@ember/object';
import { sort, equal } from '@ember/object/computed';
import ENV from 'screwdriver-ui/config/environment';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
import { SHOULD_RELOAD_NO, SHOULD_RELOAD_YES } from '../mixins/model-reloader';
import { extractEventStages } from '../utils/graph-tools';

export default Model.extend(ModelReloaderMixin, {
  buildId: attr('number'),
  baseBranch: attr('string'),
  causeMessage: attr('string'),
  commit: attr(),
  createTime: attr('date'),
  creator: attr(),
  isComplete: attr('boolean', { defaultValue: false }),
  meta: attr(),
  numBuilds: attr('number', { defaultValue: 0 }),
  reloadWithoutNewBuilds: attr('number', { defaultValue: 0 }),
  parentBuildId: attr('number'),
  parentEventId: attr('number'),
  groupEventId: attr('number'),
  pipelineId: attr('string'),
  pr: attr(),
  prNum: attr('number'),
  sha: attr('string'),
  startFrom: attr('string'),
  status: attr('string', { defaultValue: 'UNKNOWN' }),
  type: attr('string'),
  workflow: attr(),
  workflowGraph: attr(),

  builds: hasMany('build'),

  stageBuilds: hasMany('stage-build', { async: true }),

  stages: computed('workflowGraph', {
    get() {
      return extractEventStages(get(this, 'workflowGraph'));
    }
  }),

  hasStages: computed('stages', {
    get() {
      const stages = get(this, 'stages');

      return stages && stages.length > 0;
    }
  }),

  isRunning: computed(
    'isComplete',
    'isSkipped',
    'isAborted',
    function isRunningFunc() {
      let isRunning = true;

      if (this.isComplete || this.isSkipped || this.isAborted) {
        isRunning = false;
      }

      return isRunning;
    }
  ),
  buildsSorted: sort(
    'builds',
    (a, b) => parseInt(a.id, 10) - parseInt(b.id, 10)
  ),
  createTimeWords: computed('createTime', 'duration', {
    get() {
      if (this.createTime) {
        const duration = Date.now() - this.createTime.getTime();

        return `${humanizeDuration(duration, { round: true, largest: 1 })} ago`;
      }

      return '0 seconds ago';
    }
  }),
  createTimeExact: computed('createTime', {
    get() {
      if (this.createTime) {
        const dateTime = this.createTime.getTime();

        return `${toCustomLocaleString(new Date(dateTime))}`;
      }

      return '';
    }
  }),
  duration: computed('builds.[]', 'isComplete', {
    get() {
      const { builds } = this;
      const firstCreateTime = builds.map(item => item.createTime).sort()[0];

      let lastEndTime = new Date();

      if (this.isComplete) {
        lastEndTime = builds
          .map(item => item.endTime)
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
      return humanizeDuration(this.duration, {
        round: true,
        largest: 1
      });
    }
  }),
  label: computed('meta.label', {
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
  statusObserver: observer(
    'builds.@each.status',
    'isComplete',
    function statusObserver() {
      if (this.isSaving || this.isSkipped) {
        return;
      }

      const { builds } = this;

      let status = 'UNKNOWN';

      builds.then(list => {
        if (list.length === 0) {
          return;
        }

        if (!this.isDestroying && !this.isDestroyed) {
          const validList = list.filter(
            b => b.status !== 'SUCCESS' && b.status !== 'CREATED'
          );

          if (validList.length) {
            status = validList[0].status;
          } else {
            status = this.isComplete ? 'SUCCESS' : 'RUNNING';
          }

          set(this, 'status', status);
        }
      });
    }
  ),
  // eslint-disable-next-line ember/no-observers
  isCompleteObserver: observer({
    dependentKeys: ['builds.@each.{status,endTime}'],
    fn() {
      if (this.isSaving) {
        return;
      }

      const { builds } = this;

      builds.then(list => {
        if (this.isDestroying || this.isDestroyed) {
          return false;
        }

        // Tell model to reload builds.
        this.startReloading();
        set(this, 'reload', this.reload + 1);

        const numBuilds = list.length;

        // no builds yet
        if (!numBuilds) {
          set(this, 'isComplete', false);

          return false;
        }

        // See if any builds are running
        const runningBuild = list.find(b => {
          const { status, endTime } = b;

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
        const newBuilds = this.numBuilds === 0 ? 0 : numBuilds - this.numBuilds;

        // New builds created during reload, event is still going, reset everything
        if (newBuilds > 0) {
          set(this, 'isComplete', false);
          set(this, 'numBuilds', numBuilds);
          set(this, 'reloadWithoutNewBuilds', 0);

          return false;
        }

        const reloadWithoutNewBuilds = this.reloadWithoutNewBuilds + 1;

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
    },
    sync: true
  }),

  modelToReload: 'builds',
  additionalModelToReload: 'stageBuilds',
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER,
  isAborted: equal('status', 'ABORTED'),
  isSkipped: computed('commit.message', 'type', 'numBuilds', {
    get() {
      if (this.type === 'pr') {
        return false;
      }
      const msg = get(this, 'commit.message');
      const { numBuilds } = this;

      if (numBuilds !== 0) {
        return false;
      }

      return msg ? msg.match(/\[(skip ci|ci skip)\]/) : false;
    }
  }),

  // Reload builds only if the event is still running
  shouldReload() {
    return this.isRunning ? SHOULD_RELOAD_YES : SHOULD_RELOAD_NO;
  },
  shouldReloadAdditionalModel() {
    return this.hasStages;
  },
  init() {
    this._super(...arguments);
    if (this.isSkipped) {
      set(this, 'status', 'SKIPPED');
    }
  }
});
