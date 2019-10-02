import Component from '@ember/component';
import { computed, set } from '@ember/object';

export default Component.extend({
  direction: 'down',

  init() {
    this._super(...arguments);
    this.set('buildParameters', this.getDefaultBuildParameters());
  },

  getDefaultBuildParameters() {
    const buildParameters = {};

    Object.entries(this.getWithDefault('pipeline.parameters', {})).forEach(
      ([propertyName, propertyVal]) => {
        buildParameters[propertyName] = propertyVal.value ? propertyVal.value : propertyVal;
      }
    );

    return buildParameters;
  },

  startArgs: computed('prNum', 'jobs', 'buildParameters', {
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

  actions: {
    startBuild(parameters) {
      let args = this.startArgs;

      if (parameters) {
        args.push(parameters);
      }
      const startFunc = this.startBuild;

      startFunc.apply(null, args);
    },

    startBuildWithParameters() {
      console.log('current buildParameters', this.buildParameters);
      this.send('startBuild', this.buildParameters);
    },

    toggleDropdown(toggleDropdown) {
      let direction = 'down';

      if (this.direction === 'down') {
        direction = 'up';
      }
      this.set('direction', direction);
      toggleDropdown();
    },

    updateValue(value, model, propertyName) {
      console.log('(value, model, propertyName)', value, model, propertyName);
      set(model, propertyName, value);
    },

    resetForm() {
      const buildParameters = this.getDefaultBuildParameters();

      this.setProperties({
        direction: 'down',
        buildParameters
      });
    }
  }
});
