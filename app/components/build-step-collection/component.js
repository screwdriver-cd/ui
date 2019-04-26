import Component from '@ember/component';
import { filter, mapBy } from '@ember/object/computed';
import { get, set, computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  router: service(),
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

      return null;
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
      this.get('router').transitionTo(
        'pipeline.build.step',
        this.get('pipelineId'),
        this.get('buildId'),
        name
      );
    }
  }
});
