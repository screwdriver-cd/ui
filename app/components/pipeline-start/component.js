import Component from '@ember/component';
import { computed } from '@ember/object';
import MAX_NUM_OF_PARAMETERS_ALLOWED from 'screwdriver-ui/utils/constants';

export default Component.extend({
  direction: 'down',

  hasParameters: computed('buildParameters', function hasParameters() {
    return Object.keys(this.buildParameters).length > 0;
  }),

  hasLargeNumberOfParameters: computed('buildParameters', function hasLargeNumberOfParameters() {
    return Object.keys(this.buildParameters).length > MAX_NUM_OF_PARAMETERS_ALLOWED;
  }),

  init() {
    this._super(...arguments);
    this.set('buildParameters', this.getDefaultBuildParameters());
  },

  getDefaultBuildParameters() {
    return this.getWithDefault('pipeline.parameters', {});
  },

  startArgs: computed('prNum', 'jobs', {
    get() {
      const jobs = this.jobs || [];
      const { prNum } = this;

      if (!prNum) {
        return [];
      }

      // Pass arguments with PR number and jobs to reload when starting PR event.
      return [prNum, jobs];
    }
  }),

  toggleCaretDirection() {
    let direction = 'down';

    if (this.direction === 'down') {
      direction = 'up';
    }
    this.set('direction', direction);
  },

  actions: {
    startBuild(parameters) {
      let args = this.startArgs;

      if (parameters) {
        args = parameters;
      }
      const startFunc = this.startBuild;

      startFunc.apply(null, args);
    },

    toggleDropdown(toggleAction) {
      this.toggleCaretDirection();
      if (typeof toggleAction === 'function') {
        toggleAction();
      }
    },

    toggleModal() {
      this.toggleCaretDirection();
      this.toggleProperty('isShowingModal');
    },

    resetForm() {
      this.setProperties({
        buildParameters: this.getDefaultBuildParameters(),
        direction: 'down',
        isShowingModal: false
      });
    }
  }
});
