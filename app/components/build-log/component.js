/* eslint-disable new-cap */
import Ember from 'ember';
import ENV from 'screwdriver-ui/config/environment';

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

  init() {
    this._super(...arguments);
    this.set('logs', Ember.A());
  },

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

  autoscroll: true,

  /**
   * Set up scroll listener when component has been rendered
   * @method didRender
   */
  didRender() {
    this._super(...arguments);

    const w = this.$(window);
    const d = this.$(window.document);

    d.scroll(() => {
      const scrollPercentage = ((d.scrollTop() + w.height()) / d.height()) * 100;

      if (scrollPercentage > 99) {
        Ember.run(() => this.set('autoscroll', true));
      } else {
        Ember.run(() => this.set('autoscroll', false));
      }
    });
  },

  /**
   * Remove scroll listener when component is destroyed
   * @method willDestroyElement
   */
  willDestroyElement() {
    this._super(...arguments);
    this.$(window.document).off('scroll');
  },

  /**
   * Listens to 'isOpen' to determine if the value has changed
   * @method isOpenChanged
   * @private
   */
  isOpenChanged: Ember.observer('isOpen', function isOpenChanged() {
    if (this.get('isOpen')) {
      this.getLogs();
    }
  }),

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
            this.set('lastLine', lines[lines.length - 1].n + 1);
            this.get('logs').addObjects(lines);
          }
          this.set('finishedLoading', done);

          Ember.run.scheduleOnce('afterRender', this, 'scrollDown');
          if (!done) {
            // Immediately ask for more logs if we got MAX_LOG_LINES
            Ember.run.later(this, 'getLogs',
              lines.length === ENV.APP.MAX_LOG_LINES ? 0 : ENV.APP.LOG_RELOAD_TIMER);
          }
        }
      });
    }
  }
});
