import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSettingsMainModalSonarBadgeComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked errorMessage;

  @tracked badgeName;

  @tracked badgeUri;

  @tracked isAwaitingResponse = false;

  pipeline;

  hasBadge;

  constructor() {
    super(...arguments);

    this.pipeline = this.pipelinePageState.getPipeline();

    const sonar = this.pipeline.badges?.sonar;

    this.hasBadge = !!sonar;
    if (this.hasBadge) {
      this.badgeName = sonar.name;
      this.badgeUri = sonar.uri;
    }
  }

  get isDisabled() {
    if (this.isAwaitingResponse) {
      return true;
    }

    if (this.hasBadge) {
      const { sonar } = this.pipeline.badges;

      return this.badgeName === sonar.name && this.badgeUri === sonar.uri;
    }

    return !this.badgeName && !this.badgeUri;
  }

  @action
  async updateBadge() {
    this.isAwaitingResponse = true;

    const body = {
      badges: {
        sonar: {}
      }
    };

    if (this.badgeName) {
      body.badges.sonar.name = this.badgeName;
    }
    if (this.badgeUri) {
      body.badges.sonar.uri = this.badgeUri;
    }

    return this.shuttle
      .fetchFromApi('put', `/pipelines/${this.pipeline.id}`, body)
      .then(pipeline => {
        this.pipelinePageState.setPipeline(pipeline);
        this.pipelinePageState.forceReloadPipelineHeader();
        this.args.closeModal(true);
      })
      .catch(err => {
        this.errorMessage = err.message;
        this.isAwaitingResponse = false;
      });
  }
}
