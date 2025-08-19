import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSettingsPreferencesComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('settings') settings;

  @tracked errorMessage;

  @tracked isShowTriggers;

  @tracked isFilterSchedulerEvents;

  @tracked isFilterEventsForNoBuilds;

  @tracked isShowPrJobs;

  @tracked isUserSettingsDisabled = false;

  userSettings;

  constructor() {
    super(...arguments);

    this.pipeline = this.pipelinePageState.getPipeline();
    const { settings } = this.pipeline;

    this.isShowTriggers = !!settings?.showEventTriggers;
    this.isFilterSchedulerEvents = !!settings?.filterSchedulerEvents;
    this.isFilterEventsForNoBuilds = !!settings?.filterEventsForNoBuilds;

    if (!this.settings.getSettings()) {
      this.errorMessage = 'Settings not loaded, please refresh the page';
      this.isUserSettingsDisabled = true;
    }
    this.userSettings = this.settings.getSettingsForPipeline(this.pipeline.id);
    this.isShowPrJobs = this.userSettings?.showPRJobs || false;
  }

  @action
  toggleShowTriggers() {
    this.makeApiCall({
      showEventTriggers: !this.isShowTriggers
    }).then(() => {
      this.isShowTriggers = this.pipeline.settings.showEventTriggers;
    });
  }

  @action
  toggleFilterSchedulerEvents() {
    this.makeApiCall({
      filterSchedulerEvents: !this.isFilterSchedulerEvents
    }).then(() => {
      this.isFilterSchedulerEvents =
        this.pipeline.settings.filterSchedulerEvents;
    });
  }

  @action
  toggleFilterEventsForNoBuilds() {
    this.makeApiCall({
      filterEventsForNoBuilds: !this.isFilterEventsForNoBuilds
    }).then(() => {
      this.isFilterEventsForNoBuilds =
        this.pipeline.settings.filterEventsForNoBuilds;
    });
  }

  async makeApiCall(setting) {
    return this.shuttle
      .fetchFromApi('put', `/pipelines/${this.pipeline.id}`, {
        settings: setting
      })
      .then(pipeline => {
        this.pipelinePageState.setPipeline(pipeline);
        this.pipeline = pipeline;
      });
  }

  @action
  async toggleShowPrJobs() {
    const settings = { ...this.settings.getSettings() };

    settings[this.pipeline.id] = {
      showPRJobs: !this.isShowPrJobs
    };

    return this.settings
      .updateSettings(settings)
      .then(() => {
        this.isShowPrJobs = !this.isShowPrJobs;
      })
      .catch(err => {
        this.errorMessage = err.message;
      });
  }
}
