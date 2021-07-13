import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import timeRange from 'screwdriver-ui/utils/time-range';

export default Route.extend({
  init() {
    this._super(...arguments);
    this.reinit();
  },
  reinit() {
    const { startTime, endTime } = timeRange(new Date(), '1wk');

    // these are used for querying, so they are in ISO8601 format
    this.set('startTime', startTime);
    this.set('endTime', endTime);

    // these controls which endpoints should be in use
    this.set('fetchAll', true);
    this.set('fetchJob', false);

    // these are passed into controller too
    this.set('successOnly', false);
    this.set('jobId');
  },
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline').pipeline);
  },
  afterModel() {
    this.set('fetchAll', false);
    this.set('fetchJob', false);
  },
  deactivate() {
    this.reinit();
    this.controllerFor('pipeline.metrics').reinit();
  },
  model({ jobId = this.jobId }) {
    const controller = this.controllerFor('pipeline.metrics');

    controller.set('pipeline', this.pipeline);

    const { successOnly, fetchAll, fetchJob, startTime, endTime } = this;
    const toMinute = (sec = null) => (sec === null ? null : sec / 60);
    const jobsMap = this.get('pipeline.jobs').then(jobs =>
      jobs.reduce((map, j) => {
        const id = j.get('id');
        const name = j.get('name');

        if (!map.has(id)) {
          map.set(`${id}`, name);
        }

        return map;
      }, new Map())
    );

    if (jobId) {
      this.set('jobId', jobId);
    }

    const metrics = RSVP.resolve(jobsMap).then(allJobs => {
      // resolve all the job IDs first and validate against inquired job id
      if (!allJobs.has(jobId)) {
        // bail if the inquired job id is not of this pipeline
        this.set('jobId');
      }

      return RSVP.all([
        allJobs,
        fetchAll
          ? this.store.query('metric', { pipelineId: this.get('pipeline.id'), startTime, endTime })
          : RSVP.resolve(this.pipelineMetrics),
        // eslint-disable-next-line no-nested-ternary
        fetchJob || fetchAll
          ? this.jobId
            ? this.store.query('metric', { jobId: this.jobId, startTime, endTime })
            : RSVP.resolve()
          : RSVP.resolve(this.jobMetrics)
      ])
        .then(([jobs, pipelineMetrics, jobMetrics]) => {
          // acts as cache
          this.set('pipelineMetrics', pipelineMetrics);
          this.set('jobMetrics', jobMetrics);

          const total = pipelineMetrics.get('length');

          let events = {
            queuedTime: [],
            imagePullTime: [],
            duration: [],
            total: [],
            sha: [],
            status: [],
            createTime: []
          };

          let steps = {};

          let builds = [];

          let buildIds = [];

          let stepGroup = new Set();

          let jobMap = {};

          let passCount = 0;

          let sum = { queuedTime: 0, imagePullTime: 0, duration: 0 };

          /**
                     * Map index to build id, gathered from pipeline and job metrics
                     *
                     * @param {String} type type of the requesting metric
                     * @param {Number} index index of inquiry
                     * @returns {Number|null} build id(s) of the located build
                     */
          function getBuildId(type, index) {
            if (type === 'step') {
              return +jobMetrics.objectAt(index).get('id');
            }

            if (type === 'build') {
              return buildIds[index];
            }

            return null;
          }

          pipelineMetrics.forEach(metric => {
            const sha = metric.get('sha');
            const status = metric.get('status');
            const duration = metric.get('duration');
            const queuedTime = metric.get('queuedTime');
            const imagePullTime = metric.get('imagePullTime');

            if (status === 'SUCCESS') {
              passCount += 1;
            } else if (successOnly) {
              return;
            }

            events.sha.push(sha);
            events.status.push(status);
            events.duration.push(toMinute(duration));
            events.queuedTime.push(toMinute(queuedTime));
            events.imagePullTime.push(toMinute(imagePullTime));
            events.createTime.push(metric.get('createTime'));
            events.total.push(toMinute(duration + queuedTime + imagePullTime));

            sum.duration += duration;
            sum.queuedTime += queuedTime;
            sum.imagePullTime += imagePullTime;

            const buildInfo = metric.get('builds').reduce(
              (info, b) => {
                const jobName = jobs.get(`${b.jobId}`);

                if (jobName) {
                  jobMap[jobName] = `${b.jobId}`;
                  info.values[jobName] = toMinute(b.duration);
                  info.ids[jobName] = b.id;
                }

                return info;
              },
              { ids: {}, values: {} }
            );

            builds.push(buildInfo.values);
            buildIds.push(buildInfo.ids);
          });

          if (jobMetrics) {
            steps = {
              sha: [],
              status: [],
              createTime: [],
              data: []
            };

            jobMetrics.forEach(metric => {
              const status = metric.get('status');

              if (successOnly && status !== 'SUCCESS') {
                return;
              }

              steps.sha.push(metric.get('sha'));
              steps.status.push(status);
              steps.createTime.push(metric.get('createTime'));

              steps.data.push(
                metric.get('steps').reduce((stepMetric, s) => {
                  const stepName = s.name;

                  if (stepName) {
                    stepGroup.add(stepName);
                    stepMetric[stepName] = toMinute(s.duration);
                  }

                  return stepMetric;
                }, {})
              );
            });
          }

          // clear error message
          controller.set('errorMessage');

          return {
            events,
            builds,
            jobMap,
            steps,
            stepGroup: Array.from(stepGroup)
              .map(s => s.toString())
              .sort(),
            measures: {
              total,
              passed: passCount,
              failed: total - passCount,
              avgs: {
                queuedTime: humanizeDuration((sum.queuedTime * 1e3) / total, { round: true }),
                imagePullTime: humanizeDuration((sum.imagePullTime * 1e3) / total, { round: true }),
                duration: humanizeDuration((sum.duration * 1e3) / total, { round: true })
              }
            },
            getBuildId
          };
        })
        .catch(({ errors: [{ detail }] }) => {
          // catch what's thrown by the upstream RESTAdapter
          // e.g. bad request error about 180 day max
          // error message to be shown as banner
          controller.set('errorMessage', detail);

          return controller.get('model.metrics');
        });
    });

    return RSVP.hash({ metrics, startTime, endTime, successOnly, jobId: this.jobId });
  },
  actions: {
    setFetchDates(start, end) {
      this.set('startTime', start);
      this.set('endTime', end);
      this.set('fetchAll', true);
      this.refresh();
    },
    setJobId(jobId) {
      this.set('jobId', jobId);
      this.set('fetchJob', true);
      this.refresh();
    },
    filterSuccessOnly() {
      this.toggleProperty('successOnly');
      this.refresh();
    }
  }
});
