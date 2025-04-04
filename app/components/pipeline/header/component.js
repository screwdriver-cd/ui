import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class PipelineHeaderComponent extends Component {
  @service scm;

  @service shuttle;

  @service pipelinePageState;

  @tracked addToCollectionModalOpen = false;

  @tracked errorMessage;

  @tracked collections = null;

  pipeline;

  sameRepoPipeline = [];

  constructor() {
    super(...arguments);

    this.pipeline = this.pipelinePageState.getPipeline();
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
    const sonarBadgeDescription = 'SonarQube project';
    const sonarBadgeName =
      this.pipeline.badges.sonar.name || this.pipeline.badges.sonar.defaultName;

    return sonarBadgeName
      ? `SonarQube project: ${sonarBadgeName}`
      : sonarBadgeDescription;
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

      this.sameRepoPipeline = await this.shuttle
        .fetchFromApi(
          'get',
          `/pipelines?scmUri=${scmUri}&sortBy=scmUri&sort=ascending`
        )
        .then(pipelines =>
          pipelines
            .filter(pipeline => pipeline.scmUri !== scmUri)
            .map(pipeline => ({
              url: `/v2/pipelines/${pipeline.id}`,
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
