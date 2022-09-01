import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { set } from '@ember/object';
import Controller from '@ember/controller';
import { debounce } from '@ember/runloop';
import $ from 'jquery';
import ENV from 'screwdriver-ui/config/environment';

const { MINIMUM_JOBNAME_LENGTH, MAXIMUM_JOBNAME_LENGTH } = ENV.APP;

export default Controller.extend({
  shuttle: service(),
  store: service(),
  displayJobNameLength: 20,
  minDisplayLength: MINIMUM_JOBNAME_LENGTH,
  maxDisplayLength: MAXIMUM_JOBNAME_LENGTH,

  async init() {
    this._super(...arguments);

    // let desiredJobNameLength = MINIMUM_JOBNAME_LENGTH;

    // const userPreference = await this.shuttle.getUserPreference();

    // if (userPreference) {
    //   desiredJobNameLength = userPreference.displayJobNameLength;
    // }

    // this.setProperties({ desiredJobNameLength });


    // const pipelinePreference = await this.store
    //   .peekAll('preference/pipeline')
    //   .findBy('id', pipelineId);
    console.log('query code');
    const userPreference2 = await this.store.queryRecord('preference/user', {});

    console.log('query userPreference2', userPreference2);
  },

  async updateJobNameLength(desiredJobNameLength) {
    this.setProperties({ displayJobNameLength: desiredJobNameLength });

    this.shuttle.updateUserPreference(null, { displayJobNameLength: desiredJobNameLength });
  },

  actions: {
    async updateJobNameLength(inputJobNameLength) {
      let displayJobNameLength = inputJobNameLength;

      if (parseInt(displayJobNameLength, 10) > MAXIMUM_JOBNAME_LENGTH) {
        displayJobNameLength = MAXIMUM_JOBNAME_LENGTH;
      }

      if (parseInt(displayJobNameLength, 10) < MINIMUM_JOBNAME_LENGTH) {
        displayJobNameLength = MINIMUM_JOBNAME_LENGTH;
      }

      $('input.display-job-name').val(displayJobNameLength);

      debounce(this, this.updateJobNameLength, displayJobNameLength, 1000);
    }
  }
});
