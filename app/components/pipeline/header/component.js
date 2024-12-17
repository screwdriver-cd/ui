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

  sameRepoPipeline = [];

  get pipelineDescription() {
    return this.args.pipeline.annotations['screwdriver.cd/pipelineDescription'];
  }

  get sonarBadgeUri() {
    return (
      this.args.pipeline.badges.sonar.uri ||
      this.args.pipeline.badges.sonar.defaultUri
    );
  }

  get sonarBadgeDescription() {
    const sonarBadgeDescription = 'SonarQube project';
    const sonarBadgeName =
      this.args.pipeline.badges.sonar.name ||
      this.args.pipeline.badges.sonar.defaultName;

    return sonarBadgeName
      ? `SonarQube project: ${sonarBadgeName}`
      : sonarBadgeDescription;
  }

  get scmContext() {
    const scm = this.scm.getScm(this.args.pipeline.scmContext);

    return {
      scm: scm.displayName,
      scmIcon: scm.iconType
    };
  }

  @action
  async getPipelinesWithSameRepo() {
    const pipelineId = this.args.pipeline.id;

    if (this.args.pipeline.scmRepo && this.args.pipeline.scmUri) {
      const [scm, repositoryId] = this.args.pipeline.scmUri.split(':');

      this.sameRepoPipeline = await this.shuttle
        .fetchFromApi(
          'get',
          `/pipelines?search=${this.args.pipeline.scmRepo.name}&sortBy=name&sort=ascending`
        )
        .then(pipelines =>
          pipelines
            .filter(pipeline => {
              const [s, r] = pipeline.scmUri.split(':');

              return (
                pipeline.id !== pipelineId && scm === s && repositoryId === r
              );
            })
            .map((pipeline, i) => ({
              index: i,
              url: `/pipelines/${pipeline.id}`,
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
