import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

import { getCheckoutUrl } from 'screwdriver-ui/utils/git';

export default class PipelineSettingsMainComponent extends Component {
  @service router;

  @service('pipeline-page-state') pipelinePageState;

  @tracked isUpdatePipelineModalOpen = false;

  @tracked isUpdatePipelineAliasModalOpen = false;

  @tracked isUpdateSonarBadgeModalOpen = false;

  @tracked isDeletePipelineModalOpen = false;

  @tracked pipeline;

  constructor() {
    super(...arguments);

    this.pipeline = this.pipelinePageState.getPipeline();
  }

  get checkoutUrl() {
    return getCheckoutUrl({
      appId: this.pipeline.scmRepo.name,
      scmUri: this.pipeline.scmUri
    });
  }

  get sonarBadgeName() {
    return this.pipeline.badges?.sonar?.name;
  }

  get sonarBadgeUri() {
    return this.pipeline.badges?.sonar?.uri;
  }

  get pipelineAdmins() {
    const admins = [];

    Object.entries(this.pipelinePageState.getPipeline().admins).forEach(
      ([username, isAdmin]) => {
        if (isAdmin) {
          admins.push(username);
        }
      }
    );

    return admins.sort().join(', ');
  }

  @action
  showUpdatePipelineModal() {
    this.isUpdatePipelineModalOpen = true;
  }

  @action
  closeUpdatePipelineModal(wasUpdated) {
    this.isUpdatePipelineModalOpen = false;

    if (wasUpdated) {
      this.pipeline = this.pipelinePageState.getPipeline();
    }
  }

  @action
  showUpdatePipelineAliasModal() {
    this.isUpdatePipelineAliasModalOpen = true;
  }

  @action
  closeUpdatePipelineAliasModal(wasUpdated) {
    this.isUpdatePipelineAliasModalOpen = false;

    if (wasUpdated) {
      this.pipeline = this.pipelinePageState.getPipeline();
    }
  }

  @action
  showUpdateSonarBadgeModal() {
    this.isUpdateSonarBadgeModalOpen = true;
  }

  @action
  closeUpdateSonarBadgeModal(wasUpdated) {
    this.isUpdateSonarBadgeModalOpen = false;

    if (wasUpdated) {
      this.pipeline = this.pipelinePageState.getPipeline();
    }
  }

  @action
  showDeletePipelineModal() {
    this.isDeletePipelineModalOpen = true;
  }

  @action
  closeDeletePipelineModal(pipelineDeleted) {
    this.isDeletePipelineModalOpen = false;

    if (pipelineDeleted) {
      this.router.transitionTo('home');
    }
  }
}
