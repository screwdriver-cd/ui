import Component from '@ember/component';
import { filter, mapBy } from '@ember/object/computed';
import { set, computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  router: service(),
  classNames: ['build-step-collection', 'row'],
  stepNames: mapBy('buildSteps', 'name'),
  setupSteps: filter('stepNames', item => /^sd-setup/.test(item)),
  teardownSteps: filter('stepNames', item => /^sd-teardown/.test(item)),
  selectedStep: computed('buildSteps.@each.{code,startTime,endTime}', 'preselectedStepName', {
    get() {
      const steps = this.buildSteps;
      const preselectedStep = steps.findBy('name', this.preselectedStepName);

      if (preselectedStep) {
        return preselectedStep.name;
      }

      return null;
    }
  }),
  setupCollapsed: computed('selectedStep', {
    get() {
      const name = this.selectedStep;

      if (name && this.setupSteps.includes(name)) {
        return false;
      }

      return true;
    }
  }),
  teardownCollapsed: computed('selectedStep', {
    get() {
      const name = this.selectedStep;

      if (name && this.teardownSteps.includes(name)) {
        return false;
      }

      return true;
    }
  }),
  userSteps: filter('stepNames', item => !/^sd-setup/.test(item) && !/^sd-teardown/.test(item)),
  actions: {
    toggleSetup() {
      set(this, 'setupCollapsed', !this.setupCollapsed);
    },
    toggleTeardown() {
      set(this, 'teardownCollapsed', !this.teardownCollapsed);
    }
  }
});
