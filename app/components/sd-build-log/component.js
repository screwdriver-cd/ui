import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: ['open'],
  // flag: if logs are currently being processed
  isLoading: false,
  // flag: if there are logs left to load
  finishedLoading: false,
  // log panel is visible
  open: false,
  // last line processed in log loader
  lastLine: 0,
  /**
   * Listener to determine if log loading should begin.
   * Should only kick off log loading if "open" changes to true
   * @method didUpdateAttrs
   */
  didUpdateAttrs(config) {
    this._super(...arguments);
    // Call only if recently opened
    if (config.oldAttrs.open.value !== config.newAttrs.open.value &&
        config.newAttrs.open.value) {
      this.logs();
    }
  },
  /**
   * Determines if log loading should occur
   * - step must have a defined start time (it is, or has executed)
   * - the log panel must be open
   * - the log call must not be in processing already
   * - the step must have logs left to load
   * @property {Boolean} shouldLoad
   */
  shouldLoad: Ember.computed('step.startTime', 'open', 'isLoading', 'finishedLoading', {
    get() {
      return this.get('step.startTime') !== undefined &&
        this.get('open') &&
        !this.get('isLoading') &&
        !this.get('finishedLoading');
    }
  }),
  /**
   * Log loader
   * Populates container's logs with data from request(s)
   * @method logs
   */
  logs() {
    if (this.get('shouldLoad')) {
      const buildId = this.get('buildId');
      const name = this.get('step.name');
      const logContainer = this.$('.logs');
      const logNumber = this.get('lastLine');

      // Flag so we don't fire new requests while waiting for this to return
      this.set('isLoading', true);

      // Fetch logs
      Ember.$.get(
        `http://localhost:8080/v3/builds/${buildId}/steps/${name}/logs/?from=${logNumber}`
      )
        .done((data, textStatus, jqXHR) => {
          if (Array.isArray(data) && data.length) {
            // Add lines to log container
            data.forEach(line => {
              logContainer.append(`${ansi_up.ansi_to_html(line.m)}\n`);
            });
            // Update the last line we processed for next load
            this.set('lastLine', data[data.length - 1].n);
            // Set flag for done based on headers
            this.set('finishedLoading', !jqXHR.getResponseHeader('x-more-data'));
          }
        })
        .always(() => {
          // Unset loading flag and try again soon.
          this.set('isLoading', false);
          setTimeout(() => { this.logs(); }, 1000);
        });
    }
  }
});
