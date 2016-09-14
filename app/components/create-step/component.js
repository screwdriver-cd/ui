import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['create-step'],
  classNameBindings: ['statusClass'],
  statusClass: Ember.computed('currentStep', 'step', {
    get() {
      const currentStep = this.get('currentStep');
      const step = this.get('step');

      if (currentStep < step) {
        return 'step-hidden';
      }

      if (currentStep > step) {
        return 'step-done';
      }

      return '';
    }
  })
});
