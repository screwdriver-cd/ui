import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class PipelineSettingsMainModalSonarBadgeEditComponent extends Component {
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
      this.badgeName = sonar.name || sonar.defaultName;
      this.badgeUri = sonar.uri || sonar.defaultUri;
    }
  }

  get isDisabled() {
    if (this.isAwaitingResponse) {
      return true;
    }

    if (this.hasBadge) {
      const { sonar } = this.pipeline.badges;

      if (!this.badgeName || !this.badgeUri) {
        return true;
      }

      return this.badgeName === sonar.name && this.badgeUri === sonar.uri;
    }

    return !this.badgeName || !this.badgeUri;
  }

  @action
  async updateBadge() {
    this.isAwaitingResponse = true;

    return this.shuttle
      .fetchFromApi('put', `/pipelines/${this.pipeline.id}`, {
        badges: {
          sonar: {
            name: this.badgeName,
            uri: this.badgeUri,
            defaultName: this.badgeName,
            defaultUri: this.badgeUri
          }
        }
      })
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
