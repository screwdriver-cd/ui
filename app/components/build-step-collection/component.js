import Component from '@ember/component';
import { filter, mapBy } from '@ember/object/computed';
import { get, set, computed } from '@ember/object';

export default Component.extend({
  classNames: ['build-step-collection', 'row'],
  stepNames: mapBy('buildSteps', 'name'),
  setupSteps: filter('stepNames', item => /^sd-setup/.test(item)),
  teardownSteps: filter('stepNames', item => /^sd-teardown/.test(item)),
  selectedStep: computed('buildSteps.@each.{code,startTime,endTime}', 'preselectedStepName', {
    get() {
      const steps = get(this, 'buildSteps');
      const preselectedStepName = get(this, 'preselectedStepName');
      const preselectedStep = steps.findBy('name', preselectedStepName);

      if (preselectedStep) {
        return preselectedStep.name;
      }

      const runningStep = steps.find(s => s.startTime && !s.endTime);
      const failedStep = steps.find(s => s.code);
      const name = (runningStep && runningStep.name) || (failedStep && failedStep.name) || null;

      return name;
    }
  }),
  setupCollapsed: computed('selectedStep', {
    get() {
      const name = get(this, 'selectedStep');

      if (name && get(this, 'setupSteps').includes(name)) {
        return false;
      }

      return true;
    }
  }),
  teardownCollapsed: computed('selectedStep', {
    get() {
      const name = get(this, 'selectedStep');

      if (name && get(this, 'teardownSteps').includes(name)) {
        return false;
      }

      return true;
    }
  }),
  userSteps: filter('stepNames',
    item => !/^sd-setup/.test(item) && !/^sd-teardown/.test(item)),
  actions: {
    toggleSetup() {
      set(this, 'setupCollapsed', !get(this, 'setupCollapsed'));
    },
    toggleTeardown() {
      set(this, 'teardownCollapsed', !get(this, 'teardownCollapsed'));
    },
    stepClick(name) {
      set(this, 'selectedStep', name);
    }
  }
});
