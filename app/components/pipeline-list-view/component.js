import Component from '@ember/component';
import { computed, observer } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import moment from 'moment';
import Table from 'ember-light-table';

export default Component.extend({
  init() {
    this._super(...arguments);

    const table = new Table(this.get('columns'), this.get('rows'));

    this.set('table', table);
  },
  table: null,
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
      valuePath: 'coverage'
    },
    {
      label: 'ACTIONS',
      valuePath: 'actions'
    }
  ],
  rows: [],
  // rows: computed('jobsDetails', {
  //   get() {
  //     const rows = [];

  //     this.jobsDetails.forEach(jobDetails => {
  //       const startDateTime = Date.parse(jobDetails.builds[0].startTime);
  //       const endDateTime = Date.parse(jobDetails.builds[0].endTime);
  //       const startTime = moment(jobDetails.builds[0].startTime).format('lll');

  //       rows.push({
  //         job: jobDetails.builds[0],
  //         startTime: startTime === 'Invalid date' ? 'Not started.' : startTime,
  //         duration: this.getDuration(startDateTime, endDateTime),
  //         history: jobDetails.builds
  //       });
  //     });

  //     console.log('new rows');
  //     console.log(rows);
  //     debugger;
  //     return rows;
  //   }
  // }),
  test: observer('jobsDetails', function() {
    const rows = [];

    this.jobsDetails.forEach(jobDetails => {
      const startDateTime = Date.parse(jobDetails.builds[0].startTime);
      const endDateTime = Date.parse(jobDetails.builds[0].endTime);
      const startTime = moment(jobDetails.builds[0].startTime).format('lll');

      rows.push({
        job: jobDetails.builds[0],
        startTime: startTime === 'Invalid date' ? 'Not started.' : startTime,
        duration: this.getDuration(startDateTime, endDateTime),
        history: jobDetails.builds
      });
    });

    console.log('add rows');
    this.get('table').setRows(rows);
  }),
  // table: computed('rows', {
  //   get() {
  //     console.log('new table');
  //     return new Table(this.get('columns'), this.get('rows'));
  //   }
  // }),
  getDuration(startDateTime, endDateTime) {
    const duration = endDateTime - startDateTime;

    // eslint-disable-next-line no-restricted-globals
    if (isNaN(duration)) {
      return 'Still running.';
    }

    let seconds = Math.floor((duration / 1000) % 60);
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? '0'.concat(hours) : hours;
    minutes = minutes < 10 ? '0'.concat(minutes) : minutes;
    seconds = seconds < 10 ? '0'.concat(seconds) : seconds;

    // eslint-disable-next-line prefer-template
    return hours + 'h ' + minutes + 'm ' + seconds + 's';
  },
  actions: {
    onScroll(scrollOffset, event) {
      console.log(scrollOffset);
      console.log(event);
    },
    onScrolledToBottom() {
      this.get('updateListViewJobs')();
      console.log("scrolled to bottom");
    }
  }
});
