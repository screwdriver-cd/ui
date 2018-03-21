import Component from '@ember/component';
import { filter, mapBy } from '@ember/object/computed';
import { get, set, computed } from '@ember/object';

export default Component.extend({
  classNames: ['build-step-collection', 'row'],
  setupCollapsed: true,
  stepNames: mapBy('buildSteps', 'name'),
  setupSteps: filter('stepNames', item => /^sd-setup/.test(item)),
  teardownCollapsed: true,
  teardownSteps: filter('stepNames', item => /^sd-teardown/.test(item)),
  selectedStep: computed('buildSteps.@each.{code,startTime,endTime}', {
    get() {
      const steps = get(this, 'buildSteps');

      const runningStep = steps.find(s => s.startTime && !s.endTime);
      const failedStep = steps.find(s => s.code);
      const name = (runningStep && runningStep.name) || (failedStep && failedStep.name) || null;

      if (name && get(this, 'setupSteps').includes(name)) {
        set(this, 'setupCollapsed', false);
      } else if (name && get(this, 'teardownSteps').includes(name)) {
        set(this, 'teardownCollapsed', false);
      }

      return name;
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
