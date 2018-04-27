import { get, getWithDefault, set, computed } from '@ember/object';

import { scheduleOnce, later } from '@ember/runloop';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';

export default Component.extend({
  logger: service('build-logs'),
  classNames: ['build-log'],
  autoscroll: true,
  isFetching: false,
  timeFormat: 'datetime',

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

  /**
   * Fetch logs from log service
   * @method getLogs
   */
  getLogs() {
    if (get(this, 'shouldLoad')) {
      const stepName = get(this, 'stepName');
      const cache = get(this, 'logCache');
      const logData = getWithDefault(cache, stepName, {
        lastLine: 0,
        logs: [],
        done: false
      });
      const buildId = get(this, 'buildId');
      const pagesToLoad = this.get('buildStatus') === 'RUNNING' ? 10 : 1000;

      set(this, 'isFetching', true);
      this.get('logger').fetchLogs(
        buildId,
        stepName,
        logData.lastLine,
        pagesToLoad
      ).then(({ lines, done }) => {
        // prevent updating logs when component is being destroyed
        if (!this.get('isDestroyed') && !this.get('isDestroying')) {
          if (Array.isArray(lines) && lines.length) {
            set(logData, 'lastLine', lines[lines.length - 1].n + 1);
            set(logData, 'logs', get(logData, 'logs').concat(lines));
          }

          set(logData, 'done', done);
          set(this, `logCache.${stepName}`, logData);
          set(this, 'isFetching', false);
          scheduleOnce('afterRender', this, 'scrollDown');

          if (!done) {
            // Immediately ask for more logs if we got MAX_LOG_LINES
            later(this, 'getLogs',
              lines.length === ENV.APP.MAX_LOG_LINES ? 0 : ENV.APP.LOG_RELOAD_TIMER);
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
      // autoscroll when the bottom of the logs is roughly in view
      set(this, 'autoscroll', this.$('.bottom')[0].getBoundingClientRect().top < 1000);
    },
    toggleTimeDisplay() {
      const timeTypes = ['datetime', 'elapsedBuild', 'elapsedStep'];
      let index = timeTypes.indexOf(get(this, 'timeFormat'));

      index = index + 1 >= timeTypes.length ? 0 : index + 1;

      set(this, 'timeFormat', timeTypes[index]);
    }
  }
});
