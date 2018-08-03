import { get, getWithDefault, set, computed } from '@ember/object';
import { throttle, scheduleOnce, later } from '@ember/runloop';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';
import $ from 'jquery';

const timeTypes = ['datetime', 'elapsedBuild', 'elapsedStep'];

export default Component.extend({
  logger: service('build-logs'),
  classNames: ['build-log'],
  autoscroll: true,
  isFetching: false,
  hasLock: false,
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

    const timeFormat = localStorage.getItem('screwdriver.logs.timeFormat');

    if (timeFormat && timeTypes.includes(timeFormat)) {
      set(this, 'timeFormat', timeFormat);
    }

    set(this, 'logCache', {});
    set(this, 'logLength', {});
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
    set(this, 'logLength', {});
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
      const totalLines = this.get('selectedStepInfo').lines;
      const componentScope = this;
      const stepName = get(this, 'stepName');
      const cache = get(this, 'logCache');

      if (totalLines && !this.get(`logLength.${stepName}`)) {
        const length = this.get('selectedStepInfo').lines;

        this.set(`logLength.${stepName}`, length - 1);

        this.$('.wrap').scroll(function () {
          if (!componentScope.get('hasLock') && $(this).scrollTop() < $('.logs').height() * 0.2
            && $(this).scrollTop() > $('.logs').height() * 0.15
            && get(componentScope, `logLength.${stepName}`) !== 0) {
            componentScope.set('hasLock', true);
            throttle(componentScope, componentScope.getLogs, 0.5);
          }
        });
      }

      const logData = getWithDefault(cache, stepName, {
        lastLine: totalLines ? this.get(`logLength.${stepName}`) : 0,
        logs: [],
        done: false
      });
      const buildId = get(this, 'buildId');

      set(this, 'isFetching', true);

      let fetchLogsArgs = [buildId, stepName, logData.lastLine];

      if (totalLines) {
        fetchLogsArgs.push('descending', 1);
      }

      this.get('logger').fetchLogs(...fetchLogsArgs)
        .then(({ lines, done }) => {
        // prevent updating logs when component is being destroyed

          if (!this.get('isDestroyed') && !this.get('isDestroying')) {
            if (Array.isArray(lines) && lines.length) {
              if (totalLines) {
                let loglength = this.get(`logLength.${stepName}`);

                if (loglength - lines.length < 0) {
                  this.set(`logLength.${stepName}`, 0);
                } else {
                  this.set(`logLength.${stepName}`, loglength - lines.length);
                }

                set(logData, 'lastLine', this.get(`logLength.${stepName}`));
                set(logData, 'logs', lines.concat(get(logData, 'logs')));
              } else {
                set(logData, 'lastLine', lines[lines.length - 1].n + 1);
                set(logData, 'logs', get(logData, 'logs').concat(lines));
              }
            }

            const pastScrollTop = this.$('.wrap').scrollTop();
            const newLines = this.$('.line').height() * lines.length;
            // const pastHeight = this.$('.logs').height();
            // const pastFromTop = pastHeight - pastScrollTop;

            set(logData, 'done', done);
            set(this, `logCache.${stepName}`, logData);
            set(this, 'isFetching', false);

            if (totalLines) {
              this.$('.wrap').scrollTop(pastScrollTop + newLines);
              this.set('hasLock', false);
            } else {
              scheduleOnce('afterRender', this, 'scrollDown');

              if (!done) {
                // Immediately ask for more logs if we got MAX_LOG_LINES
                later(this, 'getLogs',
                  lines.length === ENV.APP.MAX_LOG_LINES ? 0 : ENV.APP.LOG_RELOAD_TIMER);
              }
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
      let index = timeTypes.indexOf(get(this, 'timeFormat'));

      index = index + 1 >= timeTypes.length ? 0 : index + 1;
      localStorage.setItem('screwdriver.logs.timeFormat', timeTypes[index]);
      set(this, 'timeFormat', timeTypes[index]);
    }
  }
});
