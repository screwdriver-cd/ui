import { computed, set } from '@ember/object';
import Component from '@ember/component';
import { not, or } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { isBlank } from '@ember/utils';
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
  pipelineService: service('pipeline'),
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
  metricsDowntimeJobs: [],
  displayDowntimeJobs: DOWNTIME_JOBS,
  showEventTriggers: false,
  filterEventsForNoBuilds: false,
  filterSchedulerEvents: false,
  aliasName: '',
  pipelineName: '',
  expandedState: {},
  isAdminsExpanded: false,
  sortedJobs: computed('jobs', function filterThenSortJobs() {
    const prRegex = /PR-\d+:.*/;

    return (this.jobs === undefined ? [] : this.jobs)
      .filter(j => {
        const annotations = j.permutations?.[0].annotations || {};

        if (annotations['screwdriver.cd/manualStartEnabled'] === false) {
          return false;
        }

        return !j.name.match(prRegex);
      })
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
  isPipelineDeletionDisabled: computed(
    'pipelineName',
    'pipeline.scmRepo.name',
    {
      get() {
        const isDisabled =
          this.get('pipeline.scmRepo.name') !== this.pipelineName;

        return isDisabled;
      }
    }
  ),
  adminsCount: computed('pipeline.admins', {
    get() {
      const admins =
        this.get('pipeline.admins') === undefined ? {} : this.pipeline.admins;

      return Object.keys(admins).filter(key => admins[key]).length;
    }
  }),
  displayAdmins: computed('pipeline.admins', 'isAdminsExpanded', {
    get() {
      const admins =
        this.get('pipeline.admins') === undefined ? {} : this.pipeline.admins;

      const enabledAdmins = Object.keys(admins).filter(key => admins[key]);

      if (!enabledAdmins) {
        return '';
      }

      let displayAdmins = enabledAdmins;

      if (displayAdmins.length > 5 && !this.isAdminsExpanded) {
        displayAdmins = displayAdmins.slice(0, 5);
      }

      return displayAdmins.join(', ');
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

    let filterSchedulerEvents = this.get(
      'pipeline.settings.filterSchedulerEvents'
    );

    const aliasName = this.get('pipeline.settings.aliasName');
    const sonar = this.get('pipeline.badges.sonar');
    const sonarName = sonar?.name ?? sonar?.defaultName;
    const sonarUri = sonar?.uri ?? sonar?.defaultUri;

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

    if (typeof filterSchedulerEvents !== 'boolean') {
      filterSchedulerEvents = false;
    }

    this.setProperties({
      privateRepo,
      publicPipeline,
      groupedEvents,
      showEventTriggers,
      filterEventsForNoBuilds,
      filterSchedulerEvents,
      aliasName,
      sonarName,
      sonarUri
    });

    let showPRJobs = true;

    const pipelinePreference =
      await this.pipelineService.getUserPipelinePreference(
        this.get('pipeline.id')
      );

    if (pipelinePreference) {
      showPRJobs =
        pipelinePreference.showPRJobs === undefined
          ? true
          : pipelinePreference.showPRJobs;
    }

    this.setProperties({ showPRJobs });

    if (this.displayDowntimeJobs) {
      const metricsDowntimeJobs = (
        this.get('pipeline.settings.metricsDowntimeJobs') === undefined
          ? []
          : this.get('pipeline.settings.metricsDowntimeJobs')
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

  async updatePipelineSonarBadge() {
    const { pipeline, sonarName, sonarUri } = this;

    if (isBlank(sonarName)) {
      this.set('errorMessage', 'Sonar Name cannot be blank');

      return;
    }

    if (isBlank(sonarUri)) {
      this.set('errorMessage', 'Sonar Uri cannot be blank');

      return;
    }

    try {
      await this.shuttle.updateSonarBadge(pipeline.id, sonarName, sonarUri);

      const sonar = this.get('pipeline.badges.sonar');

      set(sonar, 'name', sonarName);
      set(sonar, 'uri', sonarUri);

      this.setProperties({
        successMessage: 'Pipeline Sonar Badge updated successfully',
        errorMessage: ''
      });
    } catch (error) {
      this.set('errorMessage', error);
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
    toggleExpand() {
      this.toggleProperty('isAdminsExpanded');
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
    toggleJobExpansion(jobId) {
      this.set('expandedState', {
        ...this.expandedState,
        [jobId]: !this.expandedState[jobId]
      });
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
        .then(() => {
          if (!syncPath) {
            this.store.findRecord('pipeline', this.get('pipeline.id'), {
              reload: true
            });
          }
        })
        .then(() =>
          this.setProperties({
            successMessage: 'Pipeline sync successful',
            errorMessage: ''
          })
        )
        .catch(error => this.set('errorMessage', error))
        .finally(() => this.set('isShowingModal', false));
    },
    clearCache(scope, id) {
      const pipelineId = this.get('pipeline.id');

      const config = {
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
      const { aliasName } = this;

      this.updatePipelineAlias(aliasName);
    },
    async resetPipelineAlias() {
      this.set('aliasName', '');
    },
    async updatePipelineSonarBadge() {
      this.updatePipelineSonarBadge();
    },
    async resetPipelineSonarBadge() {
      this.setProperties({
        sonarName: '',
        sonarUri: ''
      });
    },
    async resetMetricsDowntimeJobs() {
      this.set('metricsDowntimeJobs', []);
    },
    async updateMetricsDowntimeJobs(metricsDowntimeJobs) {
      try {
        const pipelineId = this.get('pipeline.id');

        await this.shuttle.updatePipelineSettings(pipelineId, {
          metricsDowntimeJobs
        });

        this.set(
          'successMessage',
          'Pipeline downtime jobs updated successfully'
        );
      } catch (error) {
        this.set('errorMessage', error);
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

    async updateSchedulerEventsFilter(filterSchedulerEvents) {
      const { pipeline } = this;

      try {
        await this.shuttle.updatePipelineSettings(pipeline.id, {
          filterSchedulerEvents
        });
        this.set('successMessage', `Pipeline preferences updated successfully`);
      } catch (error) {
        this.set('errorMessage', error?.payload?.message);
      } finally {
        pipeline.set('settings.filterSchedulerEvents', filterSchedulerEvents);

        this.set('filterSchedulerEvents', filterSchedulerEvents);
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
