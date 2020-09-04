import $ from 'jquery';
import { inject as service } from '@ember/service';
import { not, or, sort } from '@ember/object/computed';
import { computed } from '@ember/object';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';
import { parse, getCheckoutUrl } from '../../utils/git';

const { MINIMUM_JOBNAME_LENGTH } = ENV.APP;

export default Component.extend({
  store: service(),
  // Syncing a pipeline
  sync: service('sync'),
  // Clearing a cache
  cache: service('cache'),
  errorMessage: '',
  scmUrl: '',
  rootDir: '',
  hasRootDir: false,
  // Removing a pipeline
  isRemoving: false,
  isShowingModal: false,
  showDangerButton: true,
  showRemoveButtons: false,
  showToggleModal: false,
  // Job disable/enable
  name: null,
  state: null,
  stateChange: null,
  user: null,
  jobId: null,
  jobSorting: ['name'],
  minDisplayLength: MINIMUM_JOBNAME_LENGTH,
  sortedJobs: sort('jobs', 'jobSorting'),
  isInvalid: not('isValid'),
  isDisabled: or('isSaving', 'isInvalid'),
  isValid: computed('scmUrl', {
    get() {
      const val = this.scmUrl;

      return val.length !== 0 && parse(val).valid;
    }
  }),
  // Updating a pipeline
  async init() {
    this._super(...arguments);
    this.set(
      'scmUrl',
      getCheckoutUrl({
        appId: this.get('pipeline.appId'),
        scmUri: this.get('pipeline.scmUri')
      })
    );

    if (this.get('pipeline.scmRepo.rootDir')) {
      this.setProperties({
        rootDir: this.get('pipeline.scmRepo.rootDir'),
        hasRootDir: true
      });
    }

    let desiredJobNameLength = MINIMUM_JOBNAME_LENGTH;

    const pipelinePreference = await this.store.queryRecord('preference/pipeline', {
      filter: { pipelineId: this.get('pipeline.id') }
    });

    if (pipelinePreference) {
      desiredJobNameLength = pipelinePreference.jobNameLength;
    }

    this.set('desiredJobNameLength', desiredJobNameLength);
  },
  actions: {
    // Checks if scm URL is valid or not
    scmChange(val) {
      this.set('scmUrl', val.trim());
      const input = $('.text-input');

      input.removeClass('bad-text-input good-text-input');

      if (this.isValid) {
        input.addClass('good-text-input');
      } else if (val.trim().length > 0) {
        input.addClass('bad-text-input');
      }
    },
    updateRootDir(val) {
      this.set('rootDir', val.trim());
    },
    updatePipeline() {
      const { scmUrl, rootDir, hasRootDir } = this;
      const pipelineConfig = {
        scmUrl,
        rootDir: ''
      };

      if (hasRootDir) {
        pipelineConfig.rootDir = rootDir;
      }
      this.onUpdatePipeline(pipelineConfig);
    },
    toggleJob(jobId, user, name, stillActive) {
      const status = stillActive ? 'ENABLED' : 'DISABLED';

      this.set('name', name);
      this.set('stateChange', status[0].toUpperCase() + status.slice(1, -1).toLowerCase());
      this.set('state', status);
      this.set('user', user);
      this.set('jobId', jobId);
      this.set('showToggleModal', true);
    },
    updateMessage(message) {
      const { state, user, jobId } = this;

      this.setJobStatus(jobId, state, user, message || ' ');
      this.set('showToggleModal', false);
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
      this.onRemovePipeline();
    },
    sync(syncPath) {
      this.set('isShowingModal', true);

      return this.sync
        .syncRequests(this.get('pipeline.id'), syncPath)
        .catch(error => this.set('errorMessage', error))
        .finally(() => this.set('isShowingModal', false));
    },
    clearCache(scope, id) {
      const pipelineId = this.get('pipeline.id');

      let config = {
        scope,
        cacheId: id,
        pipelineId
      };

      this.set('isShowingModal', true);

      if (scope === 'pipelines') {
        config.cacheId = pipelineId;
      }

      return this.cache
        .clearCache(config)
        .catch(error => this.set('errorMessage', error))
        .finally(() => this.set('isShowingModal', false));
    },

    async updateJobNameLength(jobNameLength) {
      const pipelineId = this.get('pipeline.id');
      const pipelinePreference = await this.store.queryRecord('preference/pipeline', {
        filter: { pipelineId: this.get('pipeline.id') }
      });

      if (pipelinePreference) {
        pipelinePreference.set('jobNameLength', jobNameLength);
        pipelinePreference.save();
      } else {
        this.store
          .createRecord('preference/pipeline', {
            pipelineId,
            jobNameLength
          })
          .save();
      }
    }
  }
});
