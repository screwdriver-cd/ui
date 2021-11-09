import Component from '@ember/component';
import { computed } from '@ember/object';
import MAX_NUM_OF_PARAMETERS_ALLOWED from 'screwdriver-ui/utils/constants';

export default Component.extend({
  direction: 'down',

  hasParameters: computed('buildParameters', function hasParameters() {
    return Object.keys(this.buildParameters).length > 0;
  }),

  hasLargeNumberOfParameters: computed(
    'buildParameters',
    function hasLargeNumberOfParameters() {
      return (
        Object.keys(this.buildParameters).length > MAX_NUM_OF_PARAMETERS_ALLOWED
      );
    }
  ),

  init() {
    this._super(...arguments);
    const pipelineParameters = this.getDefaultPipelineParameters();
    const jobParameters = this.getDefaultJobParameters();
    const buildParameters = { ...pipelineParameters };

    Object.assign(buildParameters, jobParameters);

    this.setProperties({
      pipelineParameters,
      jobParameters,
      buildParameters
    });
  },

  getDefaultBuildParameters() {
    return Object.assign(
      this.getDefaultPipelineParameters(),
      this.getDefaultJobParameters()
    );
  },

  getDefaultPipelineParameters() {
    return this.getWithDefault('pipeline.parameters', {});
  },

  getDefaultJobParameters() {
    const jobs = this.getWithDefault('pipeline.jobs', []);
    const parameters = {};

    jobs.forEach(job => {
      const jobParameters = job.permutations[0].parameters; // TODO: Revisit while supporting matrix job

      if (jobParameters) {
        parameters[job.name] = jobParameters;
      }
    });

    return parameters;
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
        buildParameters: this.getDefaultBuildParameters(),
        direction: 'down',
        isShowingModal: false
      });
    }
  }
});
