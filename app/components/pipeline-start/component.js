import Component from '@ember/component';
import { computed } from '@ember/object';

// const MAX_NUM_OF_PARAMETERS_ALLOWED = 1;
const MAX_NUM_OF_PARAMETERS_ALLOWED = 5;

export default Component.extend({
  direction: 'down',

  hasParameters: computed('buildParameters', function() {
    return Object.keys(this.buildParameters).length > 0;
  }),

  hasLargeNumberOfParameters: computed('buildParameters', function() {
    return Object.keys(this.buildParameters).length > MAX_NUM_OF_PARAMETERS_ALLOWED;
  }),

  init() {
    this._super(...arguments);
    this.set('buildParameters', this.getDefaultBuildParameters());
  },

  getDefaultBuildParameters() {
    // const buildParameters = {
    //   _started_at: '10/10/2019',
    //   _started_by: {
    //     value: 'adong',
    //     description: 'User running build'
    //   },
    //   _started_for: {
    //     value: 'Kick off build for hotfix',
    //     description: 'why did you start this build'
    //   }
    // };

    // return buildParameters;

    // instead of hard code, pulling from the screwdriver.yaml
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
        args.push(parameters);
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
