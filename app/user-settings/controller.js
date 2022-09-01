import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { set } from '@ember/object';
import Controller from '@ember/controller';
import { debounce } from '@ember/runloop';
import $ from 'jquery';
import ENV from 'screwdriver-ui/config/environment';

const { MINIMUM_JOBNAME_LENGTH, MAXIMUM_JOBNAME_LENGTH } = ENV.APP;

export default Controller.extend({
  // shuttle: service(),
  // refreshService: service('user-settings'),
  // tokens: alias('model'),
  // newToken: null,
  // displayJobNameLength: 20,
  // minDisplayLength: MINIMUM_JOBNAME_LENGTH,
  // maxDisplayLength: MAXIMUM_JOBNAME_LENGTH,
  // async init() {
  //   this._super(...arguments);
  //   let desiredJobNameLength = MINIMUM_JOBNAME_LENGTH;
  //   const userPreference = await this.shuttle.getUserPreference();
  //   if (userPreference) {
  //     desiredJobNameLength = userPreference.displayJobNameLength;
  //   }
  //   this.setProperties({ desiredJobNameLength });
  // },
  // async updateJobNameLength(desiredJobNameLength) {
  //   this.setProperties({ displayJobNameLength: desiredJobNameLength });
  //   this.shuttle.updateUserPreference(null, { displayJobNameLength: desiredJobNameLength });
  // },
  // actions: {
  //   createToken(name, description) {
  //     const newToken = this.store.createRecord('token', {
  //       name,
  //       description: description || '',
  //       action: 'created'
  //     });
  //     return newToken
  //       .save()
  //       .then(token => {
  //         this.set('newToken', token);
  //       })
  //       .catch(error => {
  //         newToken.destroyRecord();
  //         throw error;
  //       });
  //   },
  //   refreshToken(id) {
  //     return this.refreshService.refreshToken(id).then(token => {
  //       this.set('newToken', token);
  //     });
  //   },
  //   async updateJobNameLength(inputJobNameLength) {
  //     let displayJobNameLength = inputJobNameLength;
  //     if (parseInt(displayJobNameLength, 10) > MAXIMUM_JOBNAME_LENGTH) {
  //       displayJobNameLength = MAXIMUM_JOBNAME_LENGTH;
  //     }
  //     if (parseInt(displayJobNameLength, 10) < MINIMUM_JOBNAME_LENGTH) {
  //       displayJobNameLength = MINIMUM_JOBNAME_LENGTH;
  //     }
  //     $('input.display-job-name').val(displayJobNameLength);
  //     debounce(this, this.updateJobNameLength, displayJobNameLength, 1000);
  //   }
  // }
});
