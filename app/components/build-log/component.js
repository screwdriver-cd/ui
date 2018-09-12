import { get, getWithDefault, set, computed } from '@ember/object';
import { scheduleOnce, later } from '@ember/runloop';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';

const timeTypes = ['datetime', 'elapsedBuild', 'elapsedStep'];

export default Component.extend({
  logger: service('build-logs'),
  classNames: ['build-log'],
  autoscroll: true,
  isFetching: false,
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
    const itemSize = get(this, `logCache.${get(this, 'stepName')}.nextLine`) || totalLine;

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
  logs: computed('isFetching', 'stepName', {
    get() {
      const name = get(this, 'stepName');
      const isFetching = get(this, 'isFetching');

      if (!name) {
        return [{ m: 'Click a step to see logs' }];
      }

      const cache = get(this, 'logCache');

      if (!cache[name]) {
        if (!isFetching) {
          this.getLogs();
        }

        return [{ m: `Loading logs for step ${name}...` }];
      }

      scheduleOnce('afterRender', this, 'scrollDown');

      return get(cache[name], 'logs');
    }
  }),

  /**
   * Determines if log loading should occur
   * - step must have a defined start time (it is, or has executed)
   * - the step must have logs left to load
   * @property {Boolean} shouldLoad
   */
  shouldLoad: computed('isFetching', 'stepName', {
    get() {
      const name = get(this, 'stepName');

      if (!name) {
        return false;
      }

      return !get(this, `logCache.${name}.done`);
    }
  }),

  init() {
    this._super(...arguments);

    const timeFormat = localStorage.getItem('screwdriver.logs.timeFormat');

    if (timeFormat && timeTypes.includes(timeFormat)) {
      set(this, 'timeFormat', timeFormat);
    }

    set(this, 'logCache', {});
    set(this, 'lastStepName', get(this, 'stepName'));
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
    const newStepName = get(this, 'stepName');

    if (newStepName !== get(this, 'lastStepName')) {
      set(this, 'autoscroll', true);
      set(this, 'lastStepName', newStepName);
    }
  },

  /**
   * Remove scroll listener when component is destroyed
   * @method willDestroyElement
   */
  willDestroyElement() {
    this._super(...arguments);
    set(this, 'logCache', {});
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
   */
  getLogs(fetchMax = false) {
    if (get(this, 'shouldLoad')) {
      const stepName = get(this, 'stepName');
      const totalLine = get(this, 'totalLine');
      const inProgress = get(this, 'inProgress');
      const cache = get(this, 'logCache');
      const logData = getWithDefault(cache, stepName, {
        nextLine: (totalLine || 1) - 1,
        logs: [],
        done: false
      });
      const buildId = get(this, 'buildId');

      set(this, 'isFetching', true);
      this.get('logger').fetchLogs({
        buildId,
        stepName,
        logNumber: logData.nextLine,
        pageSize: this.getPageSize(fetchMax),
        sortOrder: get(this, 'sortOrder')
      }).then(({ lines, done }) => {
        // prevent updating logs when component is being destroyed
        if (!this.get('isDestroyed') && !this.get('isDestroying')) {
          if (Array.isArray(lines) && lines.length) {
            set(logData, 'nextLine', inProgress ? lines[lines.length - 1].n + 1 : lines[0].n - 1);
            set(
              logData,
              'logs',
              inProgress ? get(logData, 'logs').concat(lines) : lines.concat(get(logData, 'logs'))
            );
          }

          const container = this.$('.wrap')[0];

          set(logData, 'done', done);
          set(this, `logCache.${stepName}`, logData);
          set(this, 'isFetching', false);
          set(this, 'lastScrollTop', container.scrollTop);
          set(this, 'lastScrollHeight', container.scrollHeight);

          let cb = 'scrollTop';

          if (!fetchMax) {
            cb = inProgress ? 'scrollDown' : 'scrollStill';
          }

          scheduleOnce('afterRender', this, cb);

          if (!done && inProgress) {
            // Immediately ask for more logs if we have more to load
            later(
              this,
              'getLogs',
              lines.length === ENV.APP.MAX_LOG_LINES ? 0 : ENV.APP.LOG_RELOAD_TIMER
            );
          }
        }
      });
    }
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
    logScroll() {
      const container = this.$('.wrap')[0];

      if (!get(this, 'inProgress') &&
        !get(this, 'isFetching') &&
        !get(this, `logCache.${get(this, 'stepName')}.done`) &&
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
