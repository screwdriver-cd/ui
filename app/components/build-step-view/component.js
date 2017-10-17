import { run } from '@ember/runloop';
import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  classNames: ['step-view'],
  classNameBindings: ['status'],
  isOpen: false,
  isSdStep: computed('stepName', {
    get() {
      return this.get('stepName').match(/^sd-/);
    }
  }),

  /**
   * Maps step exit code with status.
   * @property {String} status
   */
  status: computed('code', 'startTime', {
    get() {
      const code = this.get('code');
      const startTime = this.get('startTime');

      if (!startTime) {
        return 'queued';
      }

      if ((code === undefined || code === null) && startTime) {
        return 'running';
      }

      return code === 0 ? 'success' : 'failure';
    }
  }),

  /**
   * Maps step status with different icon.
   * @property {String} icon
   */
  icon: computed('status', {
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
  isRunning: computed('status', {
    get() {
      return this.get('status') === 'running';
    }
  }),

  /**
   * Returns duration in seconds for a completed step
   * @property {Number} duration
   */
  duration: computed('startTime', 'endTime', {
    get() {
      const start = this.get('startTime');
      const end = this.get('endTime');

      if (end && start) {
        const duration = Date.parse(end) - Date.parse(start);

        return humanizeDuration(duration, { round: true, largest: 2 });
      }

      return null;
    }
  }),
  /**
   * Returns the duration in seconds for when this build last started
   * @property {Number} startTimeFromNow
   */
  startTimeFromNow: computed('startTime', 'now', {
    get() {
      const start = Date.parse(this.get('startTime'));

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
      run(() => {
        this.notifyPropertyChange('now');
      });
    }, interval);
  }.on('init'),

  /**
   * Allow user to click on a step to open the logs
   * @method click
   */
  click() {
    if (this.get('status') !== 'queued') {
      this.get('onToggle')();
    }
  }
});
