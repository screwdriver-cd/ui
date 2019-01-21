/* eslint ember/avoid-leaking-state-in-components: [2, ["jobSorting"]] */
import $ from 'jquery';
import { inject as service } from '@ember/service';
import { not, or, sort } from '@ember/object/computed';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { parse, getCheckoutUrl } from '../../utils/git';

export default Component.extend({
  // Syncing a pipeline
  sync: service('sync'),
  // Clearing a cache
  cache: service('cache'),
  errorMessage: '',
  scmUrl: '',
  // Removing a pipeline
  isRemoving: false,
  isShowingModal: false,
  showDangerButton: true,
  showRemoveButtons: false,
  jobSorting: ['name'],
  sortedJobs: sort('jobs', 'jobSorting'),
  isInvalid: not('isValid'),
  isDisabled: or('isSaving', 'isInvalid'),
  isValid: computed('scmUrl', {
    get() {
      const val = this.get('scmUrl');

      return val.length !== 0 && parse(val).valid;
    }
  }),
  // Updating a pipeline
  init() {
    this._super(...arguments);
    this.set('scmUrl', getCheckoutUrl({
      appId: this.get('pipeline.appId'),
      scmUri: this.get('pipeline.scmUri')
    }));
  },
  actions: {
    // Checks if scm URL is valid or not
    scmChange(val) {
      this.set('scmUrl', val.trim());
      const input = $('.text-input');

      input.removeClass('bad-text-input good-text-input');

      if (this.get('isValid')) {
        input.addClass('good-text-input');
      } else if (val.trim().length > 0) {
        input.addClass('bad-text-input');
      }
    },
    updatePipeline() {
      this.get('onUpdatePipeline')(this.get('scmUrl'));
    },
    toggleJob(jobId, stillActive) {
      this.get('setJobStatus')(jobId, stillActive ? 'ENABLED' : 'DISABLED');
    },
    showRemoveButtons() {
      this.set('showDangerButton', false);
      this.set('showRemoveButtons', true);
    },
    cancelRemove() {
      this.set('showDangerButton', true);
      this.set('showRemoveButtons', false);
    },
    removePipeline() {
      this.set('showRemoveButtons', false);
      this.set('isRemoving', true);
      this.get('onRemovePipeline')();
    },
    sync(syncPath) {
      this.set('isShowingModal', true);

      return this.get('sync').syncRequests(this.get('pipeline.id'), syncPath)
        .catch(error => this.set('errorMessage', error))
        .finally(() => this.set('isShowingModal', false));
    },
    clearCache(scope, id) {
      let config = {
        scope,
        id
      };

      this.set('isShowingModal', true);

      if (scope === 'pipelines') {
        config.id = this.get('pipeline.id');
      }

      return this.get('cache').clearCache(config)
        .catch(error => this.set('errorMessage', error))
        .finally(() => this.set('isShowingModal', false));
    }
  }
});
