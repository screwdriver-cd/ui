import Component from '@ember/component';
import { filter, mapBy, equal } from '@ember/object/computed';
import { set, computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  iframeUrl: '',
  router: service(),
  activeTab: 'steps',
  selectedArtifact: '',
  isArtifacts: equal('activeTab', 'artifacts'),
  classNames: ['build-step-collection'],
  stepNames: mapBy('buildSteps', 'name'),
  setupSteps: filter('stepNames', item => /^sd-setup/.test(item)),
  teardownSteps: filter('stepNames', item => /^sd-teardown/.test(item)),
  selectedStep: computed(
    'buildSteps.@each.{code,startTime,endTime}',
    'preselectedStepName',
    {
      get() {
        const steps = this.buildSteps;
        const preselectedStep = steps.findBy('name', this.preselectedStepName);

        if (preselectedStep) {
          return preselectedStep.name;
        }

        return null;
      }
    }
  ),
  setupCollapsed: computed('_setupCollapsed', 'selectedStep', 'setupSteps', {
    get() {
      if (this._setupCollapsed !== undefined) {
        return this._setupCollapsed;
      }

      const name = this.selectedStep;

      if (name && this.setupSteps.includes(name)) {
        return false;
      }

      return true;
    },
    set(_, value) {
      return set(this, '_setupCollapsed', value);
    }
  }),
  teardownCollapsed: computed(
    '_teardownCollapsed',
    'selectedStep',
    'teardownSteps',
    {
      get() {
        if (this._teardownCollapsed !== undefined) {
          return this._teardownCollapsed;
        }

        const name = this.selectedStep;

        if (name && this.teardownSteps.includes(name)) {
          return false;
        }

        return true;
      },
      set(_, value) {
        return set(this, '_teardownCollapsed', value);
      }
    }
  ),
  userSteps: filter(
    'stepNames',
    item => !/^sd-setup/.test(item) && !/^sd-teardown/.test(item)
  ),
  actions: {
    toggleSetup() {
      this.setupCollapsed = !this.setupCollapsed;
    },
    toggleTeardown() {
      this.teardownCollapsed = !this.teardownCollapsed;
    },
    changeActiveTabPane(activeTab) {
      this.changeRouteTo(activeTab);
    }
  }
});
