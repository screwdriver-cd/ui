import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import timeRange from 'screwdriver-ui/utils/time-range';

export default Route.extend({
  init() {
    this._super(...arguments);

    const { startTime, endTime } = timeRange(new Date(), '1wk');

    this.set('startTime', startTime);
    this.set('endTime', endTime);
  },
  beforeModel() {
    this.set('pipeline', this.modelFor('pipeline').pipeline);
  },
  deactivate() {
    const controller = this.controllerFor('pipeline.metrics');

    controller.set('eventsChart', null);
    controller.set('buildsChart', null);
  },
  model() {
    this.controllerFor('pipeline.metrics').set('pipeline', this.get('pipeline'));

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

    const metrics = RSVP.all([
      jobsMap,
      this.store.query('metric', {
        pipelineId: this.get('pipeline.id'),
        startTime: this.get('startTime'),
        endTime: this.get('endTime')
      })
    ]).then(([jobs, pipelineMetrics]) => {
      const total = pipelineMetrics.get('length');
      let events = {
        queuedTime: ['queuedTime'],
        imagePullTime: ['imagePullTime'],
        duration: ['duration'],
        total: ['total'],
        sha: [],
        status: [],
        createTime: []
      };
      let builds = [];
      let jobGroup = new Set();
      let passCount = 0;
      let sum = { queuedTime: 0, imagePullTime: 0, duration: 0 };

      pipelineMetrics.forEach((metric) => {
        const status = metric.get('status');
        const duration = metric.get('duration');
        const queuedTime = metric.get('queuedTime');
        const imagePullTime = metric.get('imagePullTime');

        events.status.push(status);
        events.sha.push(metric.get('sha'));
        events.duration.push(toMinute(duration));
        events.queuedTime.push(toMinute(queuedTime));
        events.imagePullTime.push(toMinute(imagePullTime));
        events.createTime.push(metric.get('createTime'));
        events.total.push(toMinute(duration + queuedTime + imagePullTime));

        sum.duration += duration;
        sum.queuedTime += queuedTime;
        sum.imagePullTime += imagePullTime;

        if (status === 'SUCCESS') {
          passCount += 1;
        }

        builds.push(
          metric.get('builds').reduce((buildMetric, b) => {
            const jobName = jobs.get(`${b.jobId}`);

            if (jobName) {
              jobGroup.add(jobName);
              buildMetric[jobName] = toMinute(b.duration);
            }

            return buildMetric;
          }, {})
        );
      });

      return {
        events,
        builds,
        jobGroup,
        measures: {
          total,
          passed: passCount,
          failed: total - passCount,
          avgs: {
            queuedTime: humanizeDuration((sum.queuedTime * 1e3) / total, { round: true }),
            imagePullTime: humanizeDuration((sum.imagePullTime * 1e3) / total, { round: true }),
            duration: humanizeDuration((sum.duration * 1e3) / total, { round: true })
          }
        }
      };
    });

    return RSVP.hash({ metrics, startTime: this.get('startTime'), endTime: this.get('endTime') });
  },
  actions: {
    setDates(which, dateTime, immediate) {
      this.set(which, dateTime);

      if (immediate) {
        this.refresh();
      }
    }
  }
});
