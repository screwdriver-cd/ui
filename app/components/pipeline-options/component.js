import classic from 'ember-classic-decorator';
import { tagName } from '@ember-decorators/component';
import { inject as service } from '@ember/service';
import { or, not } from '@ember/object/computed';
import { set, action, computed } from '@ember/object';
import $ from 'jquery';
import { debounce } from '@ember/runloop';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';
import { parse, getCheckoutUrl } from 'screwdriver-ui/utils/git';

const { MINIMUM_JOBNAME_LENGTH, MAXIMUM_JOBNAME_LENGTH, DOWNTIME_JOBS } =
  ENV.APP;

@classic
@tagName('')
export default class PipelineOptions extends Component {
  @service
  store;

  // Syncing a pipeline
  @service('sync')
  sync;

  // Clearing a cache
  @service('cache')
  cache;

  @service
  shuttle;

  errorMessage = '';

  scmUrl = '';

  rootDir = '';

  hasRootDir = false;

  // Removing a pipeline
  isRemoving = false;

  isShowingModal = false;

  showRemoveDangerButton = true;

  showRemoveButtons = false;

  showToggleModal = false;

  showPRJobs = true;

  // Set pipeline visibility
  isUpdatingPipelineVisibility = false;

  showPipelineVisibilityDangerButton = true;

  showPipelineVisibilityButtons = false;

  privateRepo = false;

  publicPipeline = false;

  groupedEvents = true;

  // Job disable/enable
  name = null;

  state = null;

  stateChange = null;

  user = null;

  jobId = null;

  isUpdatingMetricsDowntimeJobs = false;

  metricsDowntimeJobs = [];

  displayDowntimeJobs = DOWNTIME_JOBS;

  displayJobNameLength = 20;

  minDisplayLength = MINIMUM_JOBNAME_LENGTH;

  maxDisplayLength = MAXIMUM_JOBNAME_LENGTH;

  showEventTriggers = false;

  @computed('pipeline.id')
  get pipelineId() {
    return this.pipeline.id;
  }

  @computed('jobs')
  get sortedJobs() {
    const prRegex = /PR-\d+:.*/;

    return (this.jobs === undefined ? [] : this.jobs)
      .filter(j => !j.name.match(prRegex))
      .sortBy('name');
  }

  @not('isValid')
  isInvalid;

  @or('isSaving', 'isInvalid')
  isDisabled;

  @computed('scmUrl')
  get isValid() {
    const val = this.scmUrl;

    return val.length !== 0 && parse(val).valid;
  }

  // Updating a pipeline
  async init() {
    super.init(...arguments);
    this.set(
      'scmUrl',
      getCheckoutUrl({
        appId: this.pipeline.appId,
        scmUri: this.pipeline.scmUri
      })
    );

    if (this.pipeline?.scmRepo?.rootDir) {
      this.setProperties({
        rootDir: this.pipeline.scmRepo.rootDir,
        hasRootDir: true
      });
    }

    let privateRepo = this.pipeline?.scmRepo?.private;

    let publicPipeline = this.pipeline?.settings?.public;

    let groupedEvents = this.pipeline?.settings?.groupedEvents;

    let showEventTriggers = this.pipeline?.settings?.showEventTriggers;

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

    this.setProperties({
      privateRepo,
      publicPipeline,
      groupedEvents,
      showEventTriggers
    });

    let desiredJobNameLength = MINIMUM_JOBNAME_LENGTH;

    let showPRJobs = true;

    const pipelinePreference = await this.shuttle.getUserPipelinePreference(
      this.pipelineId
    );

    if (pipelinePreference) {
      desiredJobNameLength = pipelinePreference.displayJobNameLength;
      showPRJobs =
        pipelinePreference.showPRJobs === undefined
          ? true
          : pipelinePreference.showPRJobs;
    }

    this.setProperties({ desiredJobNameLength, showPRJobs });

    if (this.displayDowntimeJobs) {
      const metricsDowntimeJobs = (
        this.pipeline.settings?.metricsDowntimeJobs || []
      ).map(jobId => this.jobs.findBy('id', `${jobId}`));

      this.set('metricsDowntimeJobs', metricsDowntimeJobs);
    }
  }

  async saveJobNameLength(displayJobNameLength) {
    const pipelinePreference = await this.shuttle.getUserPipelinePreference(
      this.pipelineId
    );

    set(pipelinePreference, 'displayJobNameLength', displayJobNameLength);
    pipelinePreference
      .save()
      .then(() =>
        this.shuttle.updateUserPreference(this.pipelineId, pipelinePreference)
      );
  }

  // Checks if scm URL is valid or not
  @action
  scmChange(val) {
    this.set('scmUrl', val.trim());
    const input = $('.text-input');

    input.removeClass('bad-text-input good-text-input');

    if (this.isValid) {
      input.addClass('good-text-input');
    } else if (val.trim().length > 0) {
      input.addClass('bad-text-input');
    }
  }

  @action
  updateRootDir(val) {
    this.set('rootDir', val.trim());
  }

  @action
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
  }

  @action
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
  }

  @action
  updateMessage(message) {
    const { state, jobId } = this;

    this.setJobStatus(jobId, state, message || ' ');
    this.set('showToggleModal', false);
  }

  @action
  setRemoveButtons() {
    this.set('showRemoveDangerButton', false);
    this.set('showRemoveButtons', true);
  }

  @action
  cancelRemove() {
    this.set('showRemoveDangerButton', true);
    this.set('showRemoveButtons', false);
  }

  @action
  removePipeline() {
    this.set('showRemoveButtons', false);
    this.set('isRemoving', true);
    this.onRemovePipeline();
  }

  @action
  sync(syncPath) {
    this.set('isShowingModal', true);

    return this.sync
      .syncRequests(this.pipelineId, syncPath)
      .catch(error => this.set('errorMessage', error))
      .finally(() => this.set('isShowingModal', false));
  }

  @action
  clearCache(scope, id) {
    let config = {
      scope,
      cacheId: id,
      pipelineId: this.pipelineId
    };

    this.set('isShowingModal', true);

    if (scope === 'pipelines') {
      config.cacheId = this.pipelineId;
    }

    return this.cache
      .clearCache(config)
      .catch(error => this.set('errorMessage', error))
      .finally(() => this.set('isShowingModal', false));
  }

  @action
  async updateJobNameLength(inputJobNameLength) {
    let displayJobNameLength = inputJobNameLength;

    if (parseInt(displayJobNameLength, 10) > MAXIMUM_JOBNAME_LENGTH) {
      displayJobNameLength = MAXIMUM_JOBNAME_LENGTH;
    }

    if (parseInt(displayJobNameLength, 10) < MINIMUM_JOBNAME_LENGTH) {
      displayJobNameLength = MINIMUM_JOBNAME_LENGTH;
    }

    this.$('input.display-job-name').val(displayJobNameLength);

    debounce(this, this.saveJobNameLength, displayJobNameLength, 1000);
  }

  @action
  async updateMetricsDowntimeJobs(metricsDowntimeJobs) {
    try {
      this.set('isUpdatingMetricsDowntimeJobs', true);
      await this.shuttle.updatePipelineSettings(this.pipelineId, {
        metricsDowntimeJobs
      });
    } finally {
      this.set('isUpdatingMetricsDowntimeJobs', false);
    }
  }

  @action
  setPipelineVisibilityButtons() {
    this.set('showPipelineVisibilityDangerButton', false);
    this.set('showPipelineVisibilityButtons', true);
  }

  @action
  cancelPipelineVisibility() {
    this.set('showPipelineVisibilityDangerButton', true);
    this.set('showPipelineVisibilityButtons', false);
  }

  @action
  async updatePipelineVisibility(publicPipeline) {
    try {
      this.setProperties({
        isUpdatingPipelineVisibility: true,
        showPipelineVisibilityButtons: false
      });
      await this.shuttle.updatePipelineSettings(this.pipelineId, {
        publicPipeline
      });
    } finally {
      this.setProperties({
        showPipelineVisibilityDangerButton: true,
        isUpdatingPipelineVisibility: false,
        publicPipeline
      });
    }
  }

  @action
  async updatePipelineShowTriggers(showEventTriggers) {
    try {
      await this.shuttle.updatePipelineSettings(this.pipelineId, {
        showEventTriggers
      });
    } finally {
      this.set('showEventTriggers', showEventTriggers);
    }
  }

  @action
  async updateShowPRJobs(showPRJobs) {
    let pipelinePreference = await this.store
      .peekAll('preference/pipeline')
      .findBy('id', this.pipelineId);

    if (pipelinePreference) {
      pipelinePreference.showPRJobs = showPRJobs;
    } else {
      pipelinePreference = this.store.createRecord('preference/pipeline', {
        pipelineId: this.pipelineId,
        showPRJobs
      });
    }

    pipelinePreference
      .save()
      .then(() =>
        this.shuttle.updateUserPreference(this.pipelineId, pipelinePreference)
      );

    this.set('showPRJobs', showPRJobs);
  }

  @action
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
