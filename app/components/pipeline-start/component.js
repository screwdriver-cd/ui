import Component from '@ember/component';
import { computed } from '@ember/object';
import MAX_NUM_OF_PARAMETERS_ALLOWED from 'screwdriver-ui/utils/constants';

export default Component.extend({
  direction: 'down',

  hasParameters: computed(
    'pipelineParameters',
    'jobParameters',
    function hasParameters() {
      return (
        Object.keys(this.pipelineParameters).length > 0 ||
        Object.keys(this.jobParameters).length > 0
      );
    }
  ),

  hasLargeNumberOfParameters: computed(
    'pipelineParameters',
    'jobParameters',
    function hasLargeNumberOfParameters() {
      const paramCount =
        Object.keys(this.pipelineParameters).length +
        Object.values(this.jobParameters).reduce((count, parameters) => {
          if (count) {
            return count + Object.keys(parameters).length;
          }

          return Object.keys(parameters).length;
        }, 0);

      return paramCount > MAX_NUM_OF_PARAMETERS_ALLOWED;
    }
  ),

  init() {
    this._super(...arguments);

    this.setProperties({
      pipelineParameters: this.getDefaultPipelineParameters(),
      jobParameters: this.getDefaultJobParameters()
    });
  },

  getDefaultPipelineParameters() {
    return this.get('pipeline.parameters') === undefined
      ? {}
      : this.get('pipeline.parameters');
  },

  getDefaultJobParameters() {
    return this.get('pipeline.jobParameters') === undefined
      ? {}
      : this.get('pipeline.jobParameters');
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
      const args = this.startArgs;
      const startFunc = this.startBuild;

      startFunc.apply(null, [...args, parameters]);
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
        pipelineParameters: this.getDefaultPipelineParameters(),
        jobParameters: this.getDefaultJobParameters(),
        direction: 'down',
        isShowingModal: false
      });
    }
  }
});
