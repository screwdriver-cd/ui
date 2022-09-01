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
  userSettings: service(),
  displayJobNameLength: 20,
  minDisplayLength: MINIMUM_JOBNAME_LENGTH,
  maxDisplayLength: MAXIMUM_JOBNAME_LENGTH,

  async init() {
    this._super(...arguments);

    const desiredJobNameLength = await this.userSettings.getDesiredJobNameLength();

    this.setProperties({ desiredJobNameLength });

    console.log('query desiredJobNameLength', desiredJobNameLength);
  },

  async updateJobNameLength(desiredJobNameLength) {
    this.setProperties({ displayJobNameLength: desiredJobNameLength });

    await this.userSettings.updateDisplayJobNameLength(desiredJobNameLength);
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
