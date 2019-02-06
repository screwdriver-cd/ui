import { Promise } from 'rsvp';
import { get, set, computed } from '@ember/object';
import { scheduleOnce, later } from '@ember/runloop';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';

const timeTypes = ['datetime', 'elapsedBuild', 'elapsedStep'];

export default Component.extend({
  logService: service('build-logs'),
  classNames: ['build-log'],
  autoscroll: true,
  isFetching: false,
  isDownloading: false,
  timeFormat: 'datetime',
  lastScrollTop: 0,
  lastScrollHeight: 0,
  inProgress: computed('totalLine', {
    get() {
      return get(this, 'totalLine') === undefined;
    }
  }),
  sortOrder: computed('inProgress', {
    get() {
      return get(this, 'inProgress') ? 'ascending' : 'descending';
    }
  }),
  getPageSize(fetchMax = false) {
    const totalLine = get(this, 'totalLine');
    const itemSize = this.get('logService').getCache(
      get(this, 'buildId'),
      get(this, 'stepName'),
      'nextLine'
    ) || totalLine;

    // for running step, fetch regular page size
    if (get(this, 'inProgress')) {
      return ENV.APP.DEFAULT_LOG_PAGE_SIZE;
    }

    // For lazily loading old logs, if the number of log lines is too few on a page,
    // instead of having another fetch following right after the first render and user scrolls up,
    // we fetch an extra page of logs to have better UX
    // Or for the case with max fetch, calculate the remaining pages to fetch
    return fetchMax ?
      Math.ceil(itemSize / ENV.APP.MAX_LOG_LINES) :
      +(itemSize < ENV.APP.MAX_LOG_LINES || itemSize % ENV.APP.MAX_LOG_LINES < 100) + 1;
  },
  logs: computed('stepStartTime', 'isFetching', 'buildId', 'stepName', {
    get() {
      const buildId = get(this, 'buildId');
      const stepName = get(this, 'stepName');
      const logs = this.get('logService').getCache(buildId, stepName, 'logs');
      const isFetching = get(this, 'isFetching');
      const started = !!get(this, 'stepStartTime');
      const buildStats = get(this, 'buildStats');

      if (!stepName) {
        return [{ m: 'Click a step to see logs' }];
      }

      // Generate init step logs using build stats
      if (stepName === 'sd-setup-init') {
        const initLogs = [];

        initLogs.push({
          t: new Date(get(this, 'stepStartTime')).getTime(),
          m: 'Build created.',
          n: 0
        });

        if (buildStats.queueEnterTime) {
          initLogs.push({
            t: new Date(buildStats.queueEnterTime).getTime(),
            m: 'Build enqueued.',
            n: 1
          });

          if (buildStats.blockedStartTime) {
            initLogs.push({
              t: new Date(buildStats.blockedStartTime).getTime(),
              m: 'Build blocked, putting back into queue.',
              n: 1
            });
          }

          if (buildStats.hostname && buildStats.imagePullStartTime) {
            initLogs.push({
              t: new Date(buildStats.imagePullStartTime).getTime(),
              m: `Build scheduled on ${buildStats.hostname}. Starting image pull.`,
              n: 2
            });
          }

          if (get(this, 'stepEndTime')) {
            let msg = 'Image pull completed. Build init completed.';

            // If build init succeeded and build starts, there should be buildStartTime
            if (!get(this, 'buildStartTime')) {
              msg = 'Build init failed.';
            }

            initLogs.push({
              t: new Date(get(this, 'stepEndTime')).getTime(),
              m: msg,
              n: 3
            });

            set(this, 'totalLine', 4);
          }

          return initLogs;
        }

        // If there is no build stat, update totalLine when step ends
        if (get(this, 'stepEndTime')) {
          initLogs.push({
            t: new Date(get(this, 'stepEndTime')).getTime(),
            m: 'Build init done.',
            n: 1
          });

          set(this, 'totalLine', 2);
        }

        return initLogs;
      }

      if (!logs) {
        if (!isFetching && started) {
          this.getLogs();
        }

        return [{ m: `Loading logs for step ${stepName}...` }];
      }

      scheduleOnce('afterRender', this, 'scrollDown');

      return logs;
    }
  }),

  /**
   * Determines if log loading should occur
   * - step must have a defined start time (it is, or has executed)
   * - the step must have logs left to load
   * @property {Boolean} shouldLoad
   */
  shouldLoad: computed('isFetching', 'buildId', 'stepName', {
    get() {
      const name = get(this, 'stepName');

      if (!name) {
        return false;
      }

      return !this.get('logService').getCache(get(this, 'buildId'), name, 'done');
    }
  }),

  init() {
    this._super(...arguments);

    const timeFormat = localStorage.getItem('screwdriver.logs.timeFormat');

    if (timeFormat && timeTypes.includes(timeFormat)) {
      set(this, 'timeFormat', timeFormat);
    }

    this.get('logService').resetCache();
    set(this, 'lastStepId', `${get(this, 'buildId')}/${get(this, 'stepName')}`);
  },

  // Start loading logs immediately upon inserting the element if a step is selected
  didInsertElement() {
    this._super(...arguments);

    if (get(this, 'stepName')) {
      this.getLogs();
    }
  },

  didUpdateAttrs() {
    this._super(...arguments);
    const newStepId = `${get(this, 'buildId')}/${get(this, 'stepName')}`;

    if (newStepId !== get(this, 'lastStepId')) {
      set(this, 'autoscroll', true);
      set(this, 'lastStepId', newStepId);
      set(this, 'lastScrollTop', 0);
      set(this, 'lastScrollHeight', 0);
    }
  },

  /**
   * Remove scroll listener when component is destroyed
   * @method willDestroyElement
   */
  willDestroyElement() {
    this._super(...arguments);
    this.get('logService').resetCache();
  },

  /**
   * Scroll to the top of the page
   * @method scrollTop
   */
  scrollTop() {
    this.$('.wrap')[0].scrollTop = 0;
  },

  /**
   * Scroll to the bottom of the page
   * @method scrollDown
   */
  scrollDown() {
    if (get(this, 'autoscroll')) {
      const bottom = this.$('.bottom').prop('offsetTop');

      this.$('.wrap').prop('scrollTop', bottom);
      set(this, 'lastScrollTop', bottom);
    }
  },

  /**
   * Scroll back to the last anchor point
   * @method scrollStill
   */
  scrollStill() {
    const container = this.$('.wrap')[0];

    set(
      this,
      'lastScrollTop',
      container.scrollTop = get(this, 'lastScrollTop') +
        (container.scrollHeight - get(this, 'lastScrollHeight'))
    );
  },

  /**
   * Fetch logs from log service
   * @method getLogs
   *
   * @param {boolean} fetchMax
   */
  getLogs(fetchMax = false) {
    if (!get(this, 'isFetching') && get(this, 'shouldLoad')) {
      const buildId = get(this, 'buildId');
      const stepName = get(this, 'stepName');
      const totalLine = get(this, 'totalLine');
      const inProgress = get(this, 'inProgress');
      const started = !!get(this, 'stepStartTime');

      set(this, 'isFetching', true);

      return this.get('logService').fetchLogs({
        buildId,
        stepName,
        logNumber: this.get('logService').getCache(buildId, stepName, 'nextLine') ||
          (totalLine || 1) - 1,
        pageSize: this.getPageSize(fetchMax),
        sortOrder: get(this, 'sortOrder'),
        started
      }).then(({ done }) => {
        // prevent updating logs when component is being destroyed
        if (!this.get('isDestroyed') && !this.get('isDestroying')) {
          const container = this.$('.wrap')[0];

          set(this, 'isFetching', false);
          set(this, 'lastScrollTop', container.scrollTop);
          set(this, 'lastScrollHeight', container.scrollHeight);

          let cb = 'scrollTop';

          if (!fetchMax) {
            cb = inProgress ? 'scrollDown' : 'scrollStill';
          }

          scheduleOnce('afterRender', this, cb);

          if (inProgress && !done) {
            later(this, 'getLogs', ENV.APP.LOG_RELOAD_TIMER);
          }
        }
      });
    }

    return Promise.resolve();
  },
  actions: {
    scrollToTop() {
      set(this, 'autoscroll', false);

      if (!get(this, 'inProgress')) {
        this.getLogs(true);
      }

      this.scrollTop();
    },
    scrollToBottom() {
      set(this, 'autoscroll', true);
      this.scrollDown();
    },
    download() {
      const buildId = get(this, 'buildId');
      const stepName = get(this, 'stepName');

      if (this.get('logService').getCache(buildId, stepName, 'logs')) {
        set(this, 'isDownloading', true);

        this.getLogs(true).then(() => {
          this.$('#downloadLink').attr({
            download: `${buildId}-${stepName}.log`,
            href: this.get('logService').buildLogBlobUrl(buildId, stepName)
          })[0].click();
          set(this, 'isDownloading', false);
        });
      }
    },
    logScroll() {
      const container = this.$('.wrap')[0];

      if (!get(this, 'inProgress') &&
        !get(this, 'isFetching') &&
        !this.get('logService').getCache(get(this, 'buildId'), get(this, 'stepName'), 'done') &&
        container.scrollTop < (container.scrollHeight - get(this, 'lastScrollHeight')) / 2) {
        this.getLogs();

        return;
      }

      // autoscroll when the bottom of the logs is roughly in view
      set(this, 'autoscroll', this.$('.bottom')[0].getBoundingClientRect().top < 1000);
    },
    toggleTimeDisplay() {
      let index = timeTypes.indexOf(get(this, 'timeFormat'));

      index = index + 1 >= timeTypes.length ? 0 : index + 1;
      localStorage.setItem('screwdriver.logs.timeFormat', timeTypes[index]);
      set(this, 'timeFormat', timeTypes[index]);
    }
  }
});
