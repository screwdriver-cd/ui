import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  store: service(),
  buildsLink: `pipeline.events`,

  setBuildsLink(buildsLink) {
    this.set('buildsLink', buildsLink);
  },

  getSiblingPipeline(scmRepo) {
    const pipelineListConfig = {
      page: 1,
      count: ENV.APP.NUM_PIPELINES_LISTED,
      search: scmRepo,
      sortBy: 'name',
      sort: 'ascending'
    };

    return this.store.query('pipeline', pipelineListConfig);
  }
});
