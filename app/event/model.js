import { computed, observer, get, set } from '@ember/object';
import { sort, not } from '@ember/object/computed';
import DS from 'ember-data';
import graphTools from 'screwdriver-ui/utils/graph-tools';

const { graphDepth } = graphTools;

export default DS.Model.extend({
  causeMessage: DS.attr('string'),
  commit: DS.attr(),
  createTime: DS.attr('date'),
  creator: DS.attr(),
  isComplete: DS.attr('boolean', { defaultValue: false }),
  pipelineId: DS.attr('string'),
  sha: DS.attr('string'),
  startFrom: DS.attr('string'),
  status: DS.attr('string', { defaultValue: 'UNKNOWN' }),
  type: DS.attr('string'),
  workflow: DS.attr(),
  workflowGraph: DS.attr(),

  builds: DS.hasMany('build'),

  isRunning: not('isComplete'),
  buildsSorted: sort('builds', (a, b) => parseInt(a.id, 10) - parseInt(b.id, 10)),
  createTimeWords: computed('createTime', {
    get() {
      const duration = Date.now() - get(this, 'createTime').getTime();

      return `${humanizeDuration(duration, { round: true, largest: 1 })} ago`;
    }
  }),
  duration: computed('builds.[]', 'isComplete', {
    get() {
      return get(this, 'builds').reduce((val = 0, item) => val + get(item, 'totalDurationMS'));
    }
  }),
  durationText: computed('duration', {
    get() {
      return humanizeDuration(get(this, 'duration'), { round: true, largest: 1 });
    }
  }),
  truncatedMessage: computed('commit.message', {
    get() {
      return this.get('commit.message').split('\n')[0];
    }
  }),
  truncatedSha: computed('sha', {
    get() {
      return this.get('sha').substr(0, 6);
    }
  }),
  statusObserver: observer('builds.@each', 'isComplete', function statusObserver() {
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
  isCompleteObserver: observer('builds.@each', 'workflowGraph', function isCompleteObserver() {
    const builds = get(this, 'builds');

    builds
      .then((list) => {
        const numBuilds = get(list, 'length');

        // no builds yet
        if (!numBuilds) {
          set(this, 'isComplete', false);

          return false;
        }

        // Figure out if there are any failures
        const failedBuild = list.find((b) => {
          const status = get(b, 'status');

          return status === 'FAILED' || status === 'ABORTED';
        });

        // We probably won't continue on failure
        if (failedBuild) {
          set(this, 'isComplete', true);

          return true;
        }

        // See if any builds are running
        const runningBuild = list.find((b) => {
          const status = get(b, 'status');

          return status === 'RUNNING' || status === 'QUEUED';
        });

        // Something is running, so we aren't done
        if (runningBuild) {
          set(this, 'isComplete', false);

          return false;
        }

        // Figure out how many builds we expect to run
        const expectedBuilds = graphDepth(
          get(this, 'workflowGraph.edges'),
          get(this, 'startFrom'),
          new Set()
        );

        // If we have the expected number of builds, it is done
        if (numBuilds === expectedBuilds) {
          set(this, 'isComplete', true);

          return true;
        }

        // we haven't run all the expected builds yet
        set(this, 'isComplete', false);

        return false;
      });
  })
});
