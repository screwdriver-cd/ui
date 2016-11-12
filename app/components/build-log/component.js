/* eslint-disable new-cap */
import Ember from 'ember';

export default Ember.Component.extend({
  logger: Ember.inject.service('build-logs'),
  classNames: ['build-log'],
  classNameBindings: ['isOpen'],
  // flag: if there are logs left to load
  finishedLoading: false,
  // log panel is visible
  isOpen: false,
  // last line processed in log loader
  lastLine: 0,
  // store of logs to display, so we only have to recalculate new logs
  logContent: '',

  /**
   * Listen to the user clicking on logs to turn off autoClose
   * This listener is really only necessary when the step is still running
   * @method click
   */
  click() {
    this.get('onClick')();
  },

  // Start loading logs immediately upon inserting the element if the panel is open
  didInsertElement() {
    this._super(...arguments);

    if (this.get('isOpen')) {
      this.getLogs();
    }
  },

  /**
   * Listener to determine if log loading should begin.
   * Should only kick off log loading if "isOpen" changes to true
   * @method didUpdateAttrs
   */
  didUpdateAttrs(config) {
    this._super(...arguments);
    // Call only if recently opened
    if (config.oldAttrs.isOpen.value !== config.newAttrs.isOpen.value &&
        config.newAttrs.isOpen.value) {
      this.getLogs();
    }
  },

  /**
   * Determines if log loading should occur
   * - step must have a defined start time (it is, or has executed)
   * - the log panel must be open
   * - the step must have logs left to load
   * @property {Boolean} shouldLoad
   */
  shouldLoad: Ember.computed('isOpen', 'finishedLoading', {
    get() {
      return this.get('isOpen') &&
        !this.get('finishedLoading');
    }
  }),

  /**
   * Scroll to the bottom of the page
   * @method scrollDown
   */
  scrollDown() {
    if (this.$('.bottom') && this.$('.bottom').length === 1 && this.get('autoscroll')) {
      window.scrollTo(0, this.$('.bottom').offset().top);
    }
  },

  /**
   * Calculates the content for display
   * @method updateLogContent
   * @param {Array} lines   List of objects from log service
   */
  updateLogContent(lines) {
    // convert all loaded log lines into a single string
    const newLogLines = lines.map(l => `${l.m}\n`).reduce((log = '', line) => log + line);

    this.set('logContent', `${this.get('logContent')}${newLogLines}`);
  },

  /**
   * Fetch logs from log service
   * @method getLogs
   */
  getLogs() {
    if (this.get('shouldLoad')) {
      this.get('logger').fetchLogs(
        this.get('buildId'),
        this.get('stepName'),
        this.get('lastLine')
      ).then(({ lines, done }) => {
        // prevent updating logs when component is being destroyed
        if (!this.get('isDestroyed') && !this.get('isDestroying')) {
          if (Array.isArray(lines) && lines.length) {
            this.set('lastLine', lines[lines.length - 1].n);
            this.updateLogContent(lines);
          }
          this.set('finishedLoading', done);

          Ember.run.scheduleOnce('afterRender', this, 'scrollDown');
          Ember.run.later(this, 'getLogs', 1000);
        }
      });
    }
  }
});
