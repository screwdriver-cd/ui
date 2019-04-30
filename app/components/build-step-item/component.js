import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'li',
  classNameBindings: ['status', 'active'],
  active: computed('stepName', 'selectedStep', {
    get() {
      return this.stepName === this.selectedStep;
    }
  }),
  status: computed('stepCode', 'stepStart', {
    get() {
      const code = this.stepCode;
      const startTime = this.stepStart;

      if (!startTime) {
        return 'queued';
      }

      if ((code === undefined || code === null) && startTime) {
        return 'running';
      }

      return code === 0 ? 'success' : 'failure';
    }
  }),
  icon: computed('status', {
    get() {
      switch (this.status) {
        case 'running':
          return 'spinner fa-spin';
        case 'success':
          return 'check';
        case 'failure':
          return 'times';
        default:
          return 'circle-o';
      }
    }
  }),
  duration: computed('stepStart', 'stepEnd', {
    get() {
      const start = this.stepStart;
      const end = this.stepEnd;

      if (end && start) {
        const duration = Date.parse(end) - Date.parse(start);

        return humanizeDuration(duration, { round: true, largest: 2 });
      }

      return null;
    }
  }),
  click() {
    this.onClick(this.stepName);
  }
});
