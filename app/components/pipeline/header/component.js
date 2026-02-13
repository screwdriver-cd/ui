import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { htmlSafe } from '@ember/template';

import {
  hasSonarBadge,
  isInactivePipeline
} from 'screwdriver-ui/utils/pipeline';

export default class PipelineHeaderComponent extends Component {
  @service router;

  @service('scm') scm;

  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('opt-in-route-mapping') optInRouteMapping;

  @tracked addToCollectionModalOpen = false;

  @tracked errorMessage;

  @tracked collections = null;

  @tracked pipeline;

  @tracked sameRepoPipelines = [];

  constructor() {
    super(...arguments);

    this.pipeline = this.args.pipeline;
    this.getPipelinesWithSameRepo().then(() => {});
    this.pipelinePageState.setOnForceReloadPipelineHeader(() => {
      this.pipeline = this.pipelinePageState.getPipeline();

      if (this.sameRepoPipelines.length > 0) {
        this.sameRepoPipelines = this.sameRepoPipelines.map(
          sameRepoPipeline => ({
            ...sameRepoPipeline,
            route: this.pipelinePageState.getRoute()
          })
        );
      }
    });
  }

  willDestroy() {
    super.willDestroy();

    this.pipelinePageState.setOnForceReloadPipelineHeader(null);
  }

  get pipelineDescription() {
    let pipelineDescription =
      this.pipeline.annotations['screwdriver.cd/pipelineDescription'];

    if (pipelineDescription) {
      pipelineDescription.replace(/\n/g, '<br>');
    }

    return htmlSafe(pipelineDescription);
  }

  get sonarBadgeUri() {
    return (
      this.pipeline.badges.sonar.uri || this.pipeline.badges.sonar.defaultUri
    );
  }

  get sonarBadgeDescription() {
    const sonarBadge = this.pipeline.badges.sonar;
    const sonarBadgeName = sonarBadge.name || sonarBadge.defaultName;

    return `SonarQube project: ${sonarBadgeName}`;
  }

  get hasSonarBadge() {
    return hasSonarBadge(this.pipeline);
  }

  get scmContext() {
    const scm = this.scm.getScm(this.pipeline.scmContext);

    return {
      scm: scm.displayName,
      scmIcon: scm.iconType
    };
  }

  get pipelineBranch() {
    const { branch, rootDir } = this.pipeline.scmRepo;

    return rootDir ? `${branch}:${rootDir}` : branch;
  }

  get isInactivePipeline() {
    return isInactivePipeline(this.pipeline);
  }

  @action
  async getPipelinesWithSameRepo() {
    if (this.pipeline.scmRepo && this.pipeline.scmUri) {
      const { scmUri } = this.pipeline;

      this.sameRepoPipelines = await this.shuttle
        .fetchFromApi(
          'get',
          `/pipelines?scmUri=${scmUri}&sortBy=scmUri&sort=ascending`
        )
        .then(pipelines =>
          pipelines
            .filter(pipeline => pipeline.scmUri !== scmUri)
            .map(pipeline => ({
              id: pipeline.id,
              route: this.pipelinePageState.getRoute(),
              branchAndRootDir: pipeline.scmRepo.rootDir
                ? `${pipeline.scmRepo.branch}:${pipeline.scmRepo.rootDir}`
                : pipeline.scmRepo.branch
            }))
            .sort((l, r) =>
              l.branchAndRootDir.localeCompare(r.branchAndRootDir)
            )
        );
    }
  }

  @action
  async updatePipeline(element, [pipeline]) {
    this.pipeline = pipeline;
    await this.getPipelinesWithSameRepo();
  }

  @action
  async openAddToCollectionModal() {
    this.collections = await this.shuttle
      .fetchFromApi('get', '/collections')
      .catch(err => {
        this.errorMessage = `Could not get collections.  ${err.message}`;
      });

    this.addToCollectionModalOpen = true;
  }

  @action
  closeAddToCollectionModal() {
    this.addToCollectionModalOpen = false;
  }

  @action
  switchUi() {
    localStorage.setItem('oldUi', 'true');
    let legacyRoute = this.router.currentURL.replace('/v2', '');

    switch (this.router.currentRoute.name) {
      case 'v2.pipeline.secrets.tokens':
        legacyRoute = legacyRoute.replace('/tokens', '');
        break;
      case 'v2.pipeline.pulls.show':
        legacyRoute = `${legacyRoute.split('/pulls/')[0]}/pulls`;
        break;
      case 'v2.pipeline.settings.cache':
      case 'v2.pipeline.settings.index':
      case 'v2.pipeline.settings.jobs':
      case 'v2.pipeline.settings.metrics':
      case 'v2.pipeline.settings.preferences':
        legacyRoute = `${legacyRoute.split('/settings')[0]}/options`;
        break;
      default:
        break;
    }

    this.router.replaceWith(legacyRoute);
  }
}
