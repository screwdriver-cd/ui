import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

import { hasSonarBadge } from 'screwdriver-ui/utils/pipeline';
import { getCheckoutUrl } from 'screwdriver-ui/utils/git';

export default class PipelineSettingsMainComponent extends Component {
  @service router;

  @service('pipeline-page-state') pipelinePageState;

  @service('scm') scm;

  @tracked isUpdatePipelineModalOpen = false;

  @tracked isUpdatePipelineAliasModalOpen = false;

  @tracked isDeleteSonarBadgeModalOpen = false;

  @tracked isUpdateSonarBadgeModalOpen = false;

  @tracked isSyncModalOpen = false;

  @tracked isDeletePipelineModalOpen = false;

  @tracked pipeline;

  @tracked syncType;

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
    if (this.hasSonarBadge) {
      const sonarBadge = this.pipeline.badges.sonar;

      return sonarBadge.name || sonarBadge.defaultName;
    }

    return null;
  }

  get sonarBadgeUri() {
    if (this.hasSonarBadge) {
      const sonarBadge = this.pipeline.badges.sonar;

      return sonarBadge.uri || sonarBadge.defaultUri;
    }

    return null;
  }

  get hasSonarBadge() {
    return hasSonarBadge(this.pipeline);
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

  get adminUsersFromOtherSCMContexts() {
    const pipelineSCMContext = this.pipelinePageState.getPipeline().scmContext;
    const adminUsers = this.pipelinePageState.getAdminUsers();

    const scmContextToAdminUserMap = adminUsers.reduce((map, user) => {
      const context = user.scmContext;

      if (context === pipelineSCMContext) {
        return map;
      }

      if (!map[context]) {
        map[context] = [];
      }
      map[context].push(user.username);

      return map;
    }, {});

    return Object.entries(scmContextToAdminUserMap).map(
      ([scmContext, users]) => {
        const { iconType, displayName } = this.scm.getScm(scmContext);

        return {
          iconType,
          displayName,
          admins: users.sort().join(', ')
        };
      }
    );
  }

  @action
  update(element, [pipelineId]) {
    if (pipelineId !== this.pipeline.id) {
      this.pipeline = this.pipelinePageState.getPipeline();
    }
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
  showDeleteSonarBadgeModal() {
    this.isDeleteSonarBadgeModalOpen = true;
  }

  @action
  closeDeleteSonarBadgeModal(wasDeleted) {
    this.isDeleteSonarBadgeModalOpen = false;

    if (wasDeleted) {
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
  sync(syncType) {
    this.isSyncModalOpen = true;
    this.syncType = syncType;
  }

  @action
  closeSyncModal() {
    this.isSyncModalOpen = false;
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
