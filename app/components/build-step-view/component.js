import Ember from 'ember';

export default Ember.Component.extend({
  className: ['buildStepView'],
  classNameBindings: ['status'],
  isOpen: false,

  /**
   * Maps step exit code with status.
   * @property {String} status
   */
  status: Ember.computed('step.code', 'step.startTime', {
    get() {
      const code = this.get('step.code');
      const startTime = this.get('step.startTime');

      if (!startTime) {
        return 'queued';
      }

      if (code === undefined && startTime) {
        return 'running';
      }

      return code === 0 ? 'success' : 'failure';
    }
  }),

  /**
   * Maps step status with different icon.
   * @property {String} icon
   */
  icon: Ember.computed('status', {
    get() {
      switch (this.get('status')) {
      case 'running':
        return 'fa-spinner fa-spin';
      case 'success':
        return 'fa-check';
      case 'failure':
        return 'fa-times';
      default:
        return '';
      }
    }
  }),

  /**
   * Returns true if the step is running otherwise false.
   * @property {Boolean} isRunning
   */
  isRunning: Ember.computed('status', {
    get() {
      return this.get('status') === 'running';
    }
  }),

  /**
   * Returns duration in seconds for a completed step.
   * @property {number} duration
   */
  duration: Ember.computed('step.startTime', 'step.endTime', {
    get() {
      const start = this.get('step.startTime');
      const end = this.get('step.endTime');

      if (end && start) {
        const duration = Date.parse(end) - Date.parse(start);

        return humanizeDuration(duration, { round: true, largest: 2 });
      }

      return null;
    }
  }),
  startTimeFromNow: Ember.computed('step.startTime', 'now', {
    get() {
      const start = Date.parse(this.get('step.startTime'));

      if (start) {
        const duration = Date.now() - start;

        return `${humanizeDuration(duration, { round: true, largest: 2 })} ago`;
      }

      return null;
    }
  }),

  /**
   * Update the property now every second
   * @method timer
   */
  timer: function timer() {
    const interval = 1000;

    setInterval(() => {
      Ember.run(() => {
        this.notifyPropertyChange('now');
      });
    }, interval);
  }.on('init'),

  click() {
    if (this.get('status') !== 'queued') {
      this.get('onToggle')();
    }
  }
});
