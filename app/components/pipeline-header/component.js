import { get, computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  showCollectionModal: false,
  scmService: service('scm'),
  pipelineService: service('pipeline'),
  optInRouteMappingService: service('opt-in-route-mapping'),
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
      const maxPage = 10;
      const { scmUri } = this.pipeline;
      const siblingPipelines = [];

      for (let page = 1; page <= maxPage; page += 1) {
        const pipelines = (
          await this.pipelineService.getSiblingPipeline(scmUri, page)
        ).toArray();

        if (pipelines.length === 0) {
          break;
        }

        siblingPipelines.push(...pipelines);
      }

      return siblingPipelines
        .filter(pipe => pipe.scmUri !== scmUri) // Exclude itself
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
  hasNewUi: computed(
    'optInRouteMappingService.routeMappings',
    'router.currentRouteName',
    {
      get() {
        const routeName = this.router.currentRouteName;

        return this.optInRouteMappingService.routeMappings.has(routeName);
      }
    }
  ),
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
    },
    switchUi() {
      const { returnUrl } = this.optInRouteMappingService;

      let v2Url = returnUrl;

      if (this.optInRouteMappingService.eventMeta) {
        const { eventId, legacyEventId } =
          this.optInRouteMappingService.eventMeta;

        if (legacyEventId && legacyEventId !== eventId) {
          const currentUrl = this.router.currentURL;

          if (currentUrl.endsWith('/pulls')) {
            v2Url = `/v2${currentUrl}/${legacyEventId}`;
          } else {
            v2Url = `/v2${currentUrl}`.replace(eventId, legacyEventId);
          }
        }
      }

      this.optInRouteMappingService.resetUiSwitch();
      this.router.replaceWith(v2Url);
    }
  }
});
