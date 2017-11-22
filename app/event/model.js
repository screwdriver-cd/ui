import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ObjectProxy from '@ember/object/proxy';
import { computed, get } from '@ember/object';
import { sort, not } from '@ember/object/computed';
import DS from 'ember-data';
import graphTools from 'screwdriver-ui/utils/graph-tools';

const { graphDepth } = graphTools;
const ObjectPromiseProxy = ObjectProxy.extend(PromiseProxyMixin);

export default DS.Model.extend({
  causeMessage: DS.attr('string'),
  commit: DS.attr(),
  createTime: DS.attr('date'),
  creator: DS.attr(),
  pipelineId: DS.attr('string'),
  sha: DS.attr('string'),
  startFrom: DS.attr('string'),
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
  status: computed('builds.[]', {
    get() {
      const builds = get(this, 'builds');

      return ObjectPromiseProxy.create({
        promise: builds
          .then(list => list.filter(b => get(b, 'status') !== 'SUCCESS'))
          .then((list) => {
            if (list.length) {
              return get(list[0], 'status');
            }

            return get(this, 'isComplete').then(isComplete => (isComplete ? 'SUCCESS' : 'RUNNING'));
          })
      });
    }
  }),
  isComplete: computed('builds.[]', 'workflowGraph', {
    get() {
      const builds = get(this, 'builds');

      return ObjectPromiseProxy.create({
        promise: builds
          .then((list) => {
            // no builds yet
            if (!get(list, 'length')) {
              return false;
            }

            // Figure out how many builds we expect to run
            const expectedBuilds = graphDepth(
              get(this, 'workflowGraph.edges'),
              get(this, 'startFrom'),
              new Set()
            );

            // Figure out if there are any failures
            const failedBuild = list.find((b) => {
              const status = get(b, 'status');

              return status === 'FAILED' || status === 'ABORTED';
            });

            // We probably won't continue on failure
            if (failedBuild) {
              return true;
            }

            // See if any builds are running
            const runningBuild = list.find((b) => {
              const status = get(b, 'status');

              return status === 'RUNNING' || status === 'QUEUED';
            });

            // If we have the expected number of builds, and none are running, it is done
            if (list.length === expectedBuilds && !runningBuild) {
              return true;
            }

            // something is running, or we haven't run everything yet
            return false;
          })
      });
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
  })
});
