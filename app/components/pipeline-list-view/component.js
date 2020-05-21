import Component from '@ember/component';
import { computed } from '@ember/object';
import moment from 'moment';
import Table from 'ember-light-table';

export default Component.extend({
  init() {
    this._super(...arguments);

    this.get('updateListViewJobs')();
  },
  columns: [
    {
      label: 'JOB',
      valuePath: 'job',
      cellComponent: 'pipeline-list-job-cell'
    },
    {
      label: 'HISTORY',
      valuePath: 'history',
      cellComponent: 'pipeline-list-history-cell'
    },
    {
      label: 'DURATION',
      valuePath: 'duration'
    },
    {
      label: 'START TIME',
      valuePath: 'startTime'
    },
    {
      label: 'COVERAGE',
      valuePath: 'coverage',
      cellComponent: 'pipeline-list-coverage-cell'
    },
    {
      label: 'ACTIONS',
      valuePath: 'actions',
      cellComponent: 'pipeline-list-actions-cell'
    }
  ],
  rows: computed('jobsDetails', {
    get() {
      return this.get('jobsDetails').map(jobDetails => {
        const { jobId, jobName } = jobDetails;
        const latestBuild = jobDetails.builds.length ? jobDetails.builds[0] : null;

        const jobData = {
          jobName,
          build: latestBuild
        };

        const actionsData = {
          jobId,
          jobName,
          latestBuild,
          startSingleBuild: this.get('startSingleBuild'),
          stopBuild: this.get('stopBuild')
        };

        let duration;
        let startTime;
        let status;
        let buildId;

        if (latestBuild) {
          startTime = moment(latestBuild.startTime).format('lll');
          status = latestBuild.status;
          buildId = latestBuild.id;
          duration = this.getDuration(latestBuild.startTime, latestBuild.endTime, status);
        }

        const coverageData = {
          jobId,
          buildId,
          startTime: latestBuild.startTime,
          endTime: latestBuild.endTime
        };

        return {
          job: jobData,
          startTime: startTime === 'Invalid date' ? 'Not started.' : startTime,
          duration,
          history: jobDetails.builds,
          actions: actionsData,
          coverage: coverageData
        };
      });
    }
  }),
  table: computed('rows', {
    get() {
      return new Table(this.get('columns'), this.get('rows'));
    }
  }),
  getDuration(startTime, endTime, status) {
    const startDateTime = Date.parse(startTime);
    const endDateTime = Date.parse(endTime);
    const humanizeConfig = {
      round: true,
      delimiter: ' ',
      spacer: '',
      units: ['h', 'm', 's'],
      language: 'shortEn',
      languages: {
        shortEn: { h: () => 'h', m: () => 'm', s: () => 's' }
      }
    };

    if (!startDateTime) {
      return null;
    }
    if (!endDateTime) {
      if (['CREATED', 'RUNNING', 'QUEUED', 'BLOCKED', 'FROZEN'].includes(status)) {
        return 'Still running.';
      }

      return null;
    }

    const duration = endDateTime - startDateTime;

    if (duration < 60000) {
      return `0h 0m ${humanizeDuration(duration, humanizeConfig)}`;
    }

    if (duration < 3600000) {
      return `0h ${humanizeDuration(duration, humanizeConfig)}`;
    }

    return humanizeDuration(duration, humanizeConfig);
  },
  actions: {
    onScrolledToBottom() {
      this.get('updateListViewJobs')();
    },
    refreshListViewJobs() {
      this.get('refreshListViewJobs')();
    }
  }
});
