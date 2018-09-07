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
  currentScrollTop: 0,
  currentScrollHeight: 0,
  sortOrder: computed('totalLine', {
    get() {
      return get(this, 'totalLine') === undefined ? 'ascending' : 'descending';
    }
  }),
  getPagesSize() {
    const itemSize = get(this, `logCache.${get(this, 'stepName')}.nextLine`) ||
      get(this, 'totalLine');

    return itemSize === undefined ?
      ENV.APP.MAX_LOG_PAGES :
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
  },

  // Start loading logs immediately upon inserting the element if a step is selected
  didInsertElement() {
    this._super(...arguments);

    if (get(this, 'stepName')) {
      this.getLogs();
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
   * Scroll to the bottom of the page
   * @method scrollDown
   */
  scrollDown() {
    if (get(this, 'autoscroll')) {
      this.$('.wrap').prop('scrollTop', this.$('.bottom').prop('offsetTop'));
    }
  },

  scrollStill() {
    const container = this.$('.wrap')[0];

    container.scrollTop = get(this, 'currentScrollTop') +
      (container.scrollHeight - get(this, 'currentScrollHeight'));
  },

  /**
   * Fetch logs from log service
   * @method getLogs
   */
  getLogs() {
    if (get(this, 'shouldLoad')) {
      const stepName = get(this, 'stepName');
      const totalLine = get(this, 'totalLine');
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
        pagesSize: this.getPagesSize(),
        sortOrder: get(this, 'sortOrder')
      }).then(({ lines, done }) => {
        // prevent updating logs when component is being destroyed
        if (!this.get('isDestroyed') && !this.get('isDestroying')) {
          if (Array.isArray(lines) && lines.length) {
            set(logData, 'nextLine', totalLine ? lines[0].n - 1 : lines[lines.length - 1].n + 1);
            set(
              logData,
              'logs',
              totalLine ? lines.concat(get(logData, 'logs')) : get(logData, 'logs').concat(lines)
            );
          }

          const container = this.$('.wrap')[0];

          set(logData, 'done', done);
          set(this, `logCache.${stepName}`, logData);
          set(this, 'isFetching', false);
          set(this, 'currentScrollTop', container.scrollTop);
          set(this, 'currentScrollHeight', container.scrollHeight);
          scheduleOnce('afterRender', this, totalLine ? 'scrollStill' : 'scrollDown');

          if (!done && !totalLine) {
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
      this.$('.wrap').prop('scrollTop', 0);
    },
    scrollToBottom() {
      set(this, 'autoscroll', true);
      this.scrollDown();
    },
    logScroll() {
      const container = this.$('.wrap')[0];

      if (get(this, 'totalLine') &&
        !get(this, 'isFetching') &&
        !get(this, `logCache.${get(this, 'stepName')}.done`) &&
        container.scrollTop < container.scrollHeight / 2) {
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
