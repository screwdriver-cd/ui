import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';

import { hasSonarBadge } from 'screwdriver-ui/utils/pipeline';

export default class PipelineHeaderComponent extends Component {
  @service('scm') scm;

  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

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
    return this.pipeline.annotations['screwdriver.cd/pipelineDescription'];
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
}
