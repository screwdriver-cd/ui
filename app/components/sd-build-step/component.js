import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: ['isOpen', 'status'],
  isOpen: false,

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

  icon: Ember.computed('status', {
    get() {
      switch (this.get('status')) {
      case 'running':
        return 'fa-clock-o';
      case 'success':
        return 'fa-check';
      case 'failure':
        return 'fa-times';
      default:
        return '';
      }
    }
  }),

  isRunning: Ember.computed('status', {
    get() {
      return this.get('status') === 'running';
    }
  }),

  duration: Ember.computed('step.startTime', 'step.endTime', {
    get() {
      const start = this.get('step.startTime');
      const end = this.get('step.endTime');

      if (end && start) {
        return Date.parse(end) - Date.parse(start);
      }

      return null;
    }
  }),

  click(event) {
    if (event.target.className !== 'logs') {
      if (this.get('status') !== 'queued') {
        this.set('isOpen', !this.get('isOpen'));
      }
    }
  }
});
