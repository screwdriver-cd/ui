import { get } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  store: service(),
  userSettings: service(),
  buildsLink: `pipeline.events`,

  setBuildsLink(buildsLink) {
    this.set('buildsLink', buildsLink);
  },

  getSiblingPipeline(scmUri, page) {
    const pipelineListConfig = {
      page,
      count: ENV.APP.NUM_PIPELINES_LISTED,
      scmUri,
      sortBy: 'scmUri',
      sort: 'ascending'
    };

    return this.store.query('pipeline', pipelineListConfig);
  },

  async getUserPipelinePreference(pipelineId) {
    if (!pipelineId) {
      return {};
    }

    const userPreferences = await this.userSettings.getUserPreference();
    const pipelinePreferences = get(userPreferences, pipelineId);
    const localPipelinePreference = await this.store
      .peekAll('preference/pipeline')
      .findBy('id', pipelineId);

    // If preferences for the pipeline already exist, use them.
    if (localPipelinePreference) {
      return localPipelinePreference;
    }

    // No preferences for the pipeline exist, so we will create the default set.
    // Note: the newly created preferences for this pipeline are not saved back on the server as they are just default settings.
    // When a user changes the options in the options view of the pipeline, then the settings are saved.
    let pipelinePreference = await this.store.peekRecord(
      'preference/pipeline',
      `${pipelineId}`
    );

    if (pipelinePreference === null) {
      pipelinePreference = await this.store.createRecord(
        'preference/pipeline',
        {
          id: pipelineId,
          ...pipelinePreferences
        }
      );
    }

    return pipelinePreference;
  }
});
