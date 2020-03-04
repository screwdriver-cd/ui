import Component from '@ember/component';
import { computed } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import Table from 'ember-light-table';

export default Component.extend({
  init() {
    this._super(...arguments);
    scheduleOnce('afterRender', this, 'updateJobsDetails');
  },
  columns: [
    {
      label: 'JOB',
      valuePath: 'jobName'
    },
    {
      label: 'HISTORY',
      valuePath: 'history'
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
      valuePath: 'coverage'
    },
    {
      label: 'ACTIONS',
      valuePath: 'actions'
    }
  ],
  rows: computed('jobsDetails', {
    get() {
      const rows = [];

      this.jobsDetails.forEach(jobDetails => {
        const startDateTime = new Date(Date.parse(jobDetails.builds[0].startTime));
        const endDateTime = new Date(Date.parse(jobDetails.builds[0].endTime));

        rows.push({
          jobName: jobDetails.builds[0].jobName,
          startTime: this.formatDateTime(startDateTime),
          duration: this.getDuration(startDateTime, endDateTime)
        });
      });

      return rows;
    }
  }),
  table: computed('rows', {
    get() {
      return new Table(this.get('columns'), this.get('rows'));
    }
  }),
  formatDateTime(dateTime) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];

    const month = months[dateTime.getMonth()];

    return month.concat(
      ' ',
      dateTime.getDate(),
      ', ',
      dateTime.getFullYear(),
      ' ',
      dateTime.getHours() % 12,
      ':',
      dateTime.getMinutes(),
      dateTime.getHours() >= 12 ? ' PM' : ' AM'
    );
  },
  getDuration(startDateTime, endDateTime) {
    const duration = endDateTime - startDateTime;

    let seconds = Math.floor((duration / 1000) % 60);
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? '0'.concat(hours) : hours;
    minutes = minutes < 10 ? '0'.concat(minutes) : minutes;
    seconds = seconds < 10 ? '0'.concat(seconds) : seconds;

    return hours.concat('h ', minutes, 'm ', seconds, 's');
  }
});
