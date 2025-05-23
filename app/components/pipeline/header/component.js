import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class PipelineHeaderComponent extends Component {
  @service scm;

  @service shuttle;

  @tracked addToCollectionModalOpen = false;

  @tracked errorMessage;

  @tracked collections = null;

  @tracked pipeline;

  @tracked sameRepoPipeline = [];

  constructor() {
    super(...arguments);

    this.pipeline = this.args.pipeline;
    this.getPipelinesWithSameRepo().then(() => {});
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
