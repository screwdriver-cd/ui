import { Promise } from 'rsvp';
import { set, getWithDefault, computed, observer } from '@ember/object';
import { scheduleOnce, later } from '@ember/runloop';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';

const timeTypes = ['datetime', 'datetimeUTC', 'elapsedBuild', 'elapsedStep'];

export default Component.extend({
  logService: service('build-logs'),
  store: service(),
  classNames: ['build-log'],
  autoscroll: true,
  isFetching: false,
  isDownloading: false,
  inProgress: false,
  justFinished: false,
  timeFormat: 'datetime',
  lastScrollTop: 0,
  lastScrollHeight: 0,
  // eslint-disable-next-line ember/no-observers
  inProgressObserver: observer('totalLine', function inProgressObserver() {
    const inProgress = this.totalLine === undefined;

    // step just finished
    if (this.inProgress && !inProgress) {
      this.set('justFinished', true);
    }

    this.set('inProgress', inProgress);
  }),
  sortOrder: computed('inProgress', {
    get() {
      return this.inProgress || this.justFinished ? 'ascending' : 'descending';
    }
  }),
  getPageSize(fetchMax = false) {
    const { totalLine, inProgress, justFinished } = this;
    let itemSize = this.logService.getCache(this.buildId, this.stepName, 'nextLine') || totalLine;

    if (justFinished) {
      itemSize = totalLine - itemSize + 1;
    }

    // for running step, fetch regular page size
    if (inProgress) {
      return ENV.APP.DEFAULT_LOG_PAGE_SIZE;
    }

    // For lazily loading old logs, if the number of log lines is too few on a page,
    // instead of having another fetch following right after the first render and user scrolls up,
    // we fetch an extra page of logs to have better UX
    // Or for the case with max fetch, calculate the remaining pages to fetch
    return fetchMax
      ? Math.ceil(itemSize / ENV.APP.MAX_LOG_LINES)
      : +(itemSize < ENV.APP.MAX_LOG_LINES || itemSize % ENV.APP.MAX_LOG_LINES < 100) + 1;
  },
  logs: computed('stepStartTime', 'isFetching', 'buildId', 'stepName', 'buildStatus', {
    get() {
      const { buildId, stepName, isFetching, buildStats, buildStatus } = this;
      const logs = this.logService.getCache(buildId, stepName, 'logs');
      const started = !!this.stepStartTime;

      if (!stepName) {
        return [{ m: 'Click a step to see logs' }];
      }

      // Generate init step logs using build stats
      if (stepName === 'sd-setup-init') {
        const initLogs = [];

        initLogs.push({
          t: new Date(this.stepStartTime).getTime(),
          m: 'Build created.',
          n: 0
        });

        const currentBuild = this.store.peekRecord('build', buildId);
        const parameters = getWithDefault(currentBuild || {}, 'meta.parameters', {});

        if (currentBuild && Object.keys(parameters).length > 0) {
          initLogs.push({
            t: new Date(this.stepEndTime).getTime(),
            m: `Build parameters: ${JSON.stringify(parameters, null, 2)}`,
            n: 1
          });
        }

        if (buildStatus === 'FROZEN') {
          initLogs.push({
            t: new Date(this.stepEndTime).getTime(),
            m: 'Build frozen and removed from the queue.',
            n: 1
          });

          return initLogs;
        }

        if (buildStats.queueEnterTime) {
          initLogs.push({
            t: new Date(buildStats.queueEnterTime).getTime(),
            m: 'Build enqueued.',
            n: 1
          });

          if (buildStatus === 'COLLAPSED') {
            initLogs.push({
              t: new Date(this.stepEndTime).getTime(),
              m: 'Build collapsed and removed from the queue.',
              n: 1
            });

            return initLogs;
          }

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

          if (this.stepEndTime) {
            let msg = 'Image pull completed. Build init completed.';

            // If build init succeeded and build starts, there should be buildStartTime
            if (!this.buildStartTime) {
              msg = 'Build init failed.';
            }

            initLogs.push({
              t: new Date(this.stepEndTime).getTime(),
              m: msg,
              n: 3
            });

            set(this, 'totalLine', 4);
          }

          return initLogs;
        }

        // If there is no build stat, update totalLine when step ends
        if (this.stepEndTime) {
          initLogs.push({
            t: new Date(this.stepEndTime).getTime(),
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

      if (this.justFinished) {
        // there were logs in the cache, fetch the last batch of logs
        this.getLogs(true);
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
      const name = this.stepName;

      if (!name) {
        return false;
      }

      return !this.logService.getCache(this.buildId, name, 'done');
    }
  }),

  init() {
    this._super(...arguments);

    const timeFormat = localStorage.getItem('screwdriver.logs.timeFormat');

    if (timeFormat && timeTypes.includes(timeFormat)) {
      set(this, 'timeFormat', timeFormat);
    }

    this.logService.resetCache();
    set(this, 'lastStepId', `${this.buildId}/${this.stepName}`);
  },

  // Start loading logs immediately upon inserting the element if a step is selected
  didInsertElement() {
    this._super(...arguments);

    if (this.stepName) {
      this.getLogs();
    }
  },

  didReceiveAttrs() {
    this._super(...arguments);
    this.set('inProgress', this.totalLine === undefined);
  },

  didUpdateAttrs() {
    this._super(...arguments);
    const newStepId = `${this.buildId}/${this.stepName}`;

    if (newStepId !== this.lastStepId) {
      this.setProperties({
        autoscroll: true,
        lastStepId: newStepId,
        lastScrollTop: 0,
        lastScrollHeight: 0,
        isDownloading: false,
        justFinished: false,
        inProgress: this.totalLine === undefined
      });
    }
  },

  /**
   * Remove scroll listener when component is destroyed
   * @method willDestroyElement
   */
  willDestroyElement() {
    this._super(...arguments);
    this.logService.resetCache();
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
    if (this.autoscroll) {
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
      (container.scrollTop = this.lastScrollTop + (container.scrollHeight - this.lastScrollHeight))
    );
  },

  /**
   * Fetch logs from log service
   * @method getLogs
   *
   * @param {boolean} fetchMax
   */
  getLogs(fetchMax = false) {
    if (
      !this.get('isDestroyed') &&
      !this.get('isDestroying') &&
      !this.isFetching &&
      this.shouldLoad
    ) {
      const { buildId, stepName, totalLine } = this;
      const started = !!this.stepStartTime;

      set(this, 'isFetching', true);

      return this.logService
        .fetchLogs({
          buildId,
          stepName,
          logNumber:
            this.logService.getCache(buildId, stepName, 'nextLine') || (totalLine || 1) - 1,
          pageSize: this.getPageSize(fetchMax),
          sortOrder: this.sortOrder,
          started
        })
        .then(({ done }) => {
          // prevent updating logs when component is being destroyed
          if (!this.isDestroyed && !this.isDestroying) {
            const container = this.$('.wrap')[0];
            const { inProgress, justFinished } = this;

            set(this, 'isFetching', false);
            set(this, 'lastScrollTop', container.scrollTop);
            set(this, 'lastScrollHeight', container.scrollHeight);

            let cb = 'scrollTop';

            if (!fetchMax) {
              cb = inProgress ? 'scrollDown' : 'scrollStill';
            }

            if (justFinished) {
              cb = 'scrollDown';
            }

            scheduleOnce('afterRender', this, cb);

            if ((justFinished || inProgress) && !done) {
              later(this, 'getLogs', justFinished, ENV.APP.LOG_RELOAD_TIMER);
            }
          }
        });
    }

    return Promise.resolve();
  },
  actions: {
    scrollToTop() {
      set(this, 'autoscroll', false);

      if (!this.inProgress) {
        this.getLogs(true);
      }

      this.scrollTop();
    },
    scrollToBottom() {
      set(this, 'autoscroll', true);
      this.scrollDown();
    },
    download() {
      const { buildId, stepName } = this;

      if (this.logService.getCache(buildId, stepName, 'logs')) {
        set(this, 'isDownloading', true);

        this.getLogs(true).then(() => {
          this.$('#downloadLink')
            .attr({
              download: `${buildId}-${stepName}.log`,
              href: this.logService.buildLogBlobUrl(buildId, stepName)
            })[0]
            .click();
          set(this, 'isDownloading', false);
        });
      }
    },
    logScroll() {
      const container = this.$('.wrap')[0];

      if (
        !this.inProgress &&
        !this.isFetching &&
        !this.logService.getCache(this.buildId, this.stepName, 'done') &&
        container.scrollTop < (container.scrollHeight - this.lastScrollHeight) / 2
      ) {
        this.getLogs();

        return;
      }

      // autoscroll when the bottom of the logs is roughly in view
      set(this, 'autoscroll', this.$('.bottom')[0].getBoundingClientRect().top < 1500);
    },
    toggleTimeDisplay() {
      let index = timeTypes.indexOf(this.timeFormat);

      index = index + 1 >= timeTypes.length ? 0 : index + 1;
      localStorage.setItem('screwdriver.logs.timeFormat', timeTypes[index]);
      set(this, 'timeFormat', timeTypes[index]);
    }
  }
});
