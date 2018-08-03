import Component from '@ember/component';
import { filter, mapBy } from '@ember/object/computed';
import { get, set, computed } from '@ember/object';

export default Component.extend({
  classNames: ['build-step-collection', 'row'],
  stepNames: mapBy('buildSteps', 'name'),
  setupSteps: filter('stepNames', item => /^sd-setup/.test(item)),
  teardownSteps: filter('stepNames', item => /^sd-teardown/.test(item)),
  selectedStepInfo: null,
  selectedStep: computed('buildSteps.@each.{code,startTime,endTime}', {
    get() {
      const steps = get(this, 'buildSteps');

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
    stepClick(name, info) {
      set(this, 'selectedStep', name);
      set(this, 'selectedStepInfo', info);
    }
  }
});
