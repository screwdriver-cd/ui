import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import ENV from 'screwdriver-ui/config/environment';

export default Component.extend({
  showCollectionModal: false,
  scmService: service('scm'),
  pipelineService: service('pipeline'),
  classNameBindings: ['isBuildPage'],
  router: service(),
  addCollectionError: null,
  addCollectionSuccess: null,
  dropdownText: 'Add to collection',
  sonarBadgeDescription: computed('sonarBadgeName', {
    get() {
      let sonarBadgeDescription = 'SonarQube project';

      if (this.sonarBadgeName) {
        sonarBadgeDescription = `SonarQube project: ${this.sonarBadgeName}`;
      }

      return sonarBadgeDescription;
    }
  }),
  sonarBadgeName: computed('pipeline.badges.sonar.{defaultName,name}', {
    get() {
      let name = get(this, 'pipeline.badges.sonar.name');

      if (!name) {
        name = get(this, 'pipeline.badges.sonar.defaultName');
      }

      return name;
    }
  }),
  sonarBadgeUri: computed('pipeline.badges.sonar.{defaultUri,uri}', {
    get() {
      let uri = get(this, 'pipeline.badges.sonar.uri');

      if (!uri) {
        uri = get(this, 'pipeline.badges.sonar.defaultUri');
      }

      return uri;
    }
  }),
  isBuildPage: computed('router.currentRouteName', {
    get() {
      return get(this, 'router.currentRouteName') === 'pipeline.build';
    }
  }),
  scmContext: computed('pipeline', {
    get() {
      const scm = this.scmService.getScm(this.pipeline.get('scmContext'));

      return {
        scm: scm.displayName,
        scmIcon: scm.iconType
      };
    }
  }),
  // Disabling the eslint rule for computed properties as that causes rendering issues and an infinite loop to the API call with the current setup of ember data
  // eslint-disable-next-line ember/require-computed-property-dependencies
  sameRepoPipeline: computed('pipeline', {
    async get() {
      const [scm, repositoryId] = this.pipeline.scmUri.split(':');
      const pipelineName = this.pipeline.scmRepo.name;
      const sameRepoPipelines = [];

      let page = 0;

      do {
        page += 1;

        const siblingPipelines = (
          await this.pipelineService.getSiblingPipeline(
            this.pipeline.scmRepo.name,
            page
          )
        ).toArray();

        sameRepoPipelines.push(...siblingPipelines);

        if (siblingPipelines.length < ENV.APP.NUM_PIPELINES_LISTED) {
          break;
        }
      } while (
        sameRepoPipelines[sameRepoPipelines.length - 1].scmRepo.name ===
          pipelineName &&
        page <= 10
      );

      return sameRepoPipelines
        .filter(pipe => {
          const [s, r] = pipe.scmUri.split(':');

          return (
            pipe.id !== this.pipeline.id && scm === s && repositoryId === r
          );
        })
        .map((pipe, i) => ({
          index: i,
          url: `/pipelines/${pipe.id}`,
          branchAndRootDir: pipe.scmRepo.rootDir
            ? `${pipe.scmRepo.branch}:${pipe.scmRepo.rootDir}`
            : pipe.scmRepo.branch
        }))
        .sort((l, r) => l.branchAndRootDir.localeCompare(r.branchAndRootDir));
    }
  }),
  actions: {
    openModal() {
      this.set('showCollectionModal', true);
    },
    addToCollection(pipelineId, collection) {
      return this.addToCollection(+pipelineId, collection.id)
        .then(() => {
          this.set('addCollectionError', null);
          this.set(
            'addCollectionSuccess',
            `Successfully added Pipeline to ${collection.get('name')}`
          );
        })
        .catch(() => {
          this.set(
            'addCollectionError',
            `Could not add Pipeline to ${collection.get('name')}`
          );
          this.set('addCollectionSuccess', null);
        });
    }
  }
});
