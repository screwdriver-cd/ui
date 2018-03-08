import Component from '@ember/component';
import { filter } from '@ember/object/computed';
import { get, set, computed } from '@ember/object';

export default Component.extend({
  classNames: ['build-step-collection', 'row'],
  setupCollapsed: true,
  setupSteps: filter('stepList', item => /^sd-setup/.test(item)),
  teardownCollapsed: true,
  teardownSteps: filter('stepList', item => /^sd-teardown/.test(item)),
  selectedStep: computed('buildSteps.@each.{code,startTime,endTime}', {
    get() {
      const steps = get(this, 'buildSteps');

      const runningStep = steps.find(s => s.startTime && !s.endTime);
      const failedStep = steps.find(s => s.code);
      const name = (runningStep && runningStep.name) || (failedStep && failedStep.name) || null;

      return name;
    }
  }),
  userSteps: filter('stepList',
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
