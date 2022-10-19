import Component from '@ember/component';
import { computed, getWithDefault } from '@ember/object';
import { not, or } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import $ from 'jquery';
import ENV from 'screwdriver-ui/config/environment';
import { getCheckoutUrl, parse } from 'screwdriver-ui/utils/git';

const { DOWNTIME_JOBS } = ENV.APP;

export default Component.extend({
  store: service(),
  // Syncing a pipeline
  sync: service('sync'),
  // Clearing a cache
  cache: service('cache'),
  // Update the job status
  jobService: service('job'),
  shuttle: service(),
  errorMessage: '',
  successMessage: '',
  scmUrl: '',
  rootDir: '',
  hasRootDir: false,
  // Removing a pipeline
  isRemoving: false,
  isShowingModal: false,
  showRemoveDangerButton: true,
  showRemoveButtons: false,
  showToggleModal: false,
  showPRJobs: true,
  // Set pipeline visibility
  isUpdatingPipelineVisibility: false,
  showPipelineVisibilityDangerButton: true,
  showPipelineVisibilityButtons: false,
  privateRepo: false,
  publicPipeline: false,
  groupedEvents: true,
  // Job disable/enable
  name: null,
  state: null,
  stateChange: null,
  user: null,
  jobId: null,
  isUpdatingMetricsDowntimeJobs: false,
  metricsDowntimeJobs: [],
  displayDowntimeJobs: DOWNTIME_JOBS,

  showEventTriggers: false,
  filterEventsForNoBuilds: false,
  aliasName: '',
  sortedJobs: computed('jobs', function filterThenSortJobs() {
    const prRegex = /PR-\d+:.*/;

    return getWithDefault(this, 'jobs', [])
      .filter(j => !j.name.match(prRegex))
      .sortBy('name');
  }),
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

    let privateRepo = this.get('pipeline.scmRepo.private');

    let publicPipeline = this.get('pipeline.settings.public');

    let groupedEvents = this.get('pipeline.settings.groupedEvents');

    let showEventTriggers = this.get('pipeline.settings.showEventTriggers');

    let filterEventsForNoBuilds = this.get(
      'pipeline.settings.filterEventsForNoBuilds'
    );

    let aliasName = this.get('pipeline.settings.aliasName');

    if (typeof privateRepo !== 'boolean') {
      privateRepo = false;
    }

    if (typeof publicPipeline !== 'boolean') {
      publicPipeline = !privateRepo;
    }

    if (typeof groupedEvents !== 'boolean') {
      groupedEvents = true;
    }

    if (typeof showEventTriggers !== 'boolean') {
      showEventTriggers = false;
    }

    if (typeof filterEventsForNoBuilds !== 'boolean') {
      filterEventsForNoBuilds = false;
    }

    this.setProperties({
      privateRepo,
      publicPipeline,
      groupedEvents,
      showEventTriggers,
      filterEventsForNoBuilds,
      aliasName
    });

    let showPRJobs = true;

    const pipelinePreference = await this.shuttle.getUserPipelinePreference(
      this.get('pipeline.id')
    );

    if (pipelinePreference) {
      showPRJobs = getWithDefault(pipelinePreference, 'showPRJobs', true);
    }

    this.setProperties({ showPRJobs });

    if (this.displayDowntimeJobs) {
      const metricsDowntimeJobs = this.getWithDefault(
        'pipeline.settings.metricsDowntimeJobs',
        []
      ).map(jobId => this.jobs.findBy('id', `${jobId}`));

      this.set('metricsDowntimeJobs', metricsDowntimeJobs);
    }
  },

  async updatePipelineAlias(aliasName) {
    const { pipeline } = this;

    try {
      await this.shuttle.updatePipelineSettings(pipeline.id, {
        aliasName
      });
      this.set('successMessage', 'Pipeline alias updated successfully');
    } catch (error) {
      this.set('errorMessage', error);
    } finally {
      this.set('aliasName', aliasName);
    }
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
      const {
        scmUrl,
        rootDir,
        hasRootDir,
        metricsDowntimeJobs /* , metricsDowntimeStatuses */
      } = this;
      const pipelineConfig = {
        scmUrl,
        rootDir: ''
      };
      const settings = {};

      if (metricsDowntimeJobs) {
        settings.metricsDowntimeJobs = metricsDowntimeJobs;
      }

      pipelineConfig.settings = settings;

      if (hasRootDir) {
        pipelineConfig.rootDir = rootDir;
      }

      this.onUpdatePipeline(pipelineConfig);
    },
    toggleJob(jobId, user, name, stillActive) {
      const status = stillActive ? 'ENABLED' : 'DISABLED';

      this.set('name', name);
      this.set(
        'stateChange',
        status[0].toUpperCase() + status.slice(1, -1).toLowerCase()
      );
      this.set('state', status);
      this.set('user', user);
      this.set('jobId', jobId);
      this.set('showToggleModal', true);
    },
    updateMessage(message) {
      const { state, jobId } = this;

      this.jobService
        .setJobState(jobId, state, message || ' ')
        .catch(error => this.set('errorMessage', error));
      this.set('showToggleModal', false);
    },
    showRemoveButtons() {
      this.set('showRemoveDangerButton', false);
      this.set('showRemoveButtons', true);
    },
    cancelRemove() {
      this.set('showRemoveDangerButton', true);
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

    async updatePipelineAlias() {
      let { aliasName } = this;

      this.$('input.pipeline-alias-name').val(aliasName);

      this.updatePipelineAlias(aliasName);
    },
    async resetPipelineAlias() {
      this.$('input.pipeline-alias-name').val('');

      this.set('aliasName', '');
    },
    async updateMetricsDowntimeJobs(metricsDowntimeJobs) {
      try {
        const pipelineId = this.get('pipeline.id');

        this.set('isUpdatingMetricsDowntimeJobs', true);
        await this.shuttle.updatePipelineSettings(pipelineId, {
          metricsDowntimeJobs
        });
      } finally {
        this.set('isUpdatingMetricsDowntimeJobs', false);
      }
    },

    showPipelineVisibilityButtons() {
      this.set('showPipelineVisibilityDangerButton', false);
      this.set('showPipelineVisibilityButtons', true);
    },
    cancelPipelineVisibility() {
      this.set('showPipelineVisibilityDangerButton', true);
      this.set('showPipelineVisibilityButtons', false);
    },
    async updatePipelineVisibility(publicPipeline) {
      try {
        const pipelineId = this.get('pipeline.id');

        this.setProperties({
          isUpdatingPipelineVisibility: true,
          showPipelineVisibilityButtons: false
        });
        await this.shuttle.updatePipelineSettings(pipelineId, {
          publicPipeline
        });
      } finally {
        this.setProperties({
          showPipelineVisibilityDangerButton: true,
          isUpdatingPipelineVisibility: false,
          publicPipeline
        });
      }
    },

    async updatePipelineShowTriggers(showEventTriggers) {
      const { pipeline } = this;

      try {
        await this.shuttle.updatePipelineSettings(pipeline.id, {
          showEventTriggers
        });
      } finally {
        pipeline.set('settings.showEventTriggers', showEventTriggers);

        this.set('showEventTriggers', showEventTriggers);
      }
    },

    async updateFilterEventsForNoBuilds(filterEventsForNoBuilds) {
      const { pipeline } = this;

      try {
        await this.shuttle.updatePipelineSettings(pipeline.id, {
          filterEventsForNoBuilds
        });
      } finally {
        pipeline.set(
          'settings.filterEventsForNoBuilds',
          filterEventsForNoBuilds
        );

        this.set('filterEventsForNoBuilds', filterEventsForNoBuilds);
      }
    },

    async updateShowPRJobs(showPRJobs) {
      const pipelineId = this.get('pipeline.id');

      let pipelinePreference = await this.store
        .peekAll('preference/pipeline')
        .findBy('id', pipelineId);

      if (pipelinePreference) {
        pipelinePreference.showPRJobs = showPRJobs;
      } else {
        pipelinePreference = this.store.createRecord('preference/pipeline', {
          id: pipelineId,
          showPRJobs
        });
      }

      pipelinePreference.save();

      this.set('showPRJobs', showPRJobs);
    },
    async updatePipelineGroupedEvents(groupedEvents) {
      const { pipeline } = this;

      try {
        await this.shuttle.updatePipelineSettings(pipeline.id, {
          groupedEvents
        });
      } finally {
        pipeline.set('settings.groupedEvents', groupedEvents);

        this.set('groupedEvents', groupedEvents);
      }
    }
  }
});
