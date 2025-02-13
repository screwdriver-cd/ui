import { computed } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import $ from 'jquery';
import ENV from 'screwdriver-ui/config/environment';

/**
 * Screwdriver Shuttle Service
 * Only certain methods are allowed: get, request, post, put, patch, del, raw
 * Ember Ajax API: https://github.com/ember-cli/ember-ajax
 * @namespace
 * @return
 */
export default Service.extend({
  ajax: service(),
  store: service(),
  session: service(),

  storeHost: `${ENV.APP.SDSTORE_HOSTNAME}/${ENV.APP.SDSTORE_NAMESPACE}`,

  apiHost: `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}`,

  headers: computed('session.data.authenticated', {
    get() {
      return {
        Authorization: `Bearer ${this.session.get('data.authenticated.token')}`
      };
    }
  }),

  ajaxOptions() {
    const { headers } = this;

    return {
      contentType: 'application/json; charset=utf-8',
      xhrFields: {
        withCredentials: true
      },
      headers
    };
  },

  fetchFrom(host = 'store', method = 'get', url, data = {}, raw = false) {
    let baseHost = this.apiHost;

    if (host === 'store') {
      baseHost = this.storeHost;
    }

    const optionsType = method.toUpperCase();

    let requestType = method.toLowerCase();

    if (raw) {
      requestType = 'raw';
    }

    if (requestType === 'get') {
      requestType = 'request';
    }

    const uri = `${baseHost}${url}`;

    const options = { ...this.ajaxOptions(), data, type: optionsType };

    return this.ajax[requestType](uri, options);
  },

  fetchFromApi(method = 'get', url, data, raw = false) {
    return this.fetchFrom('api', method, url, data, raw);
  },

  fetchFromStore(method = 'get', url, data, raw = false) {
    return this.fetchFrom('store', method, url, data, raw);
  },

  fetchLogs({
    buildId,
    stepName,
    logNumber = 0,
    pageSize = 10,
    sortOrder = 'ascending'
  }) {
    const method = 'get';
    const url = `/builds/${buildId}/steps/${stepName}/logs`;
    const data = { from: logNumber, pages: pageSize, sort: sortOrder };
    const raw = true;

    return this.fetchFromApi(method, url, data, raw);
  },

  fetchAllJobTemplates() {
    const method = 'get';
    const url = `/templates`;
    const data = { sortBy: 'createTime', sort: 'descending', compact: true };

    return this.fetchFromApi(method, url, data);
  },

  /**
   * Fetch coverage info from coverage plugin
   * @param  {Object}  data
   * @param  {String}  [data.jobId]        Job ID
   * @param  {String}  [data.jobName]      Job name
   * @param  {String}  [data.pipelineId]	 Pipeline ID
   * @param  {String}  [data.pipelineName] Pipeline name
   * @param  {String}  data.startTime      Build start time
   * @param  {String}  data.endTime        Build end time
   * @param  {String}  [data.prNum]        PR number
   * @param  {String}  [data.scope]        Coverage scope (pipeline or job)
   * @param  {String}  data.projectKey     Coverage key
   * @return {Promise} Coverage object with coverage results and test data
   */
  async fetchCoverage(data) {
    const method = 'get';
    const url = `/coverage/info`;

    return this.fetchFromApi(method, url, data);
  },

  async openPr(checkoutUrl, yaml = '', pipelineId = 1) {
    const method = 'post';
    const url = `/pipelines/${pipelineId}/openPr`;
    const data = {
      checkoutUrl,
      files: [
        {
          name: 'screwdriver.yaml',
          content: yaml
        }
      ],
      title: 'Onboard to Screwdriver',
      message: 'Add screwdriver.yaml file'
    };
    const raw = true;

    return this.fetchFromApi(method, url, data, raw);
  },

  /**
   * updatePipelineSettings
   * @param  {Number}   pipelineId  Pipeline Id
   * @param  {Object}   settings
   * @param  {Array}    settings.metricsDowntimeJobs Job Ids to caluclate downtime
   * @param  {Boolean}  settings.public pipeline visibility
   * @return {Promise}
   */
  async updatePipelineSettings(pipelineId, settings) {
    const method = 'put';
    const url = `/pipelines/${pipelineId}`;

    let newSetting = {};

    if (settings.metricsDowntimeJobs) {
      newSetting = {
        metricsDowntimeJobs: settings.metricsDowntimeJobs.map(job => job.id)
      };
    }

    if (typeof settings.publicPipeline === 'boolean') {
      newSetting = { ...newSetting, public: settings.publicPipeline };
    }

    if (typeof settings.groupedEvents === 'boolean') {
      newSetting = { ...newSetting, groupedEvents: settings.groupedEvents };
    }

    if (typeof settings.showEventTriggers === 'boolean') {
      newSetting = {
        ...newSetting,
        showEventTriggers: settings.showEventTriggers
      };
    }

    if (typeof settings.filterEventsForNoBuilds === 'boolean') {
      newSetting = {
        ...newSetting,
        filterEventsForNoBuilds: settings.filterEventsForNoBuilds
      };
    }

    if (typeof settings.filterSchedulerEvents === 'boolean') {
      newSetting = {
        ...newSetting,
        filterSchedulerEvents: settings.filterSchedulerEvents
      };
    }

    if (typeof settings.aliasName === 'string') {
      newSetting = {
        ...newSetting,
        aliasName: settings.aliasName
      };
    }

    const data = { settings: newSetting };

    return this.fetchFromApi(method, url, data);
  },

  /**
   * getPipelineDowntimeJobsMetrics
   * @param  {Number} pipelineId        Pipeline Id
   * @param  {Array}  downtimeJobs      Job Ids
   * @param  {Array}  downtimeStatuses  Build Statuses
   * @return {Promise}
   */
  async getPipelineDowntimeJobsMetrics(
    pipelineId,
    downtimeJobs,
    downtimeStatuses,
    startTime,
    endTime
  ) {
    const method = 'get';
    const query = $.param({
      downtimeJobs,
      downtimeStatuses,
      startTime,
      endTime
    });
    const url = `/pipelines/${pipelineId}/metrics?${query}`;

    return this.fetchFromApi(method, url);
  },

  /**
   * getLatestCommitEvent
   * @param  {Number} pipelineId  Pipeline Id
   * @return {Promise}
   */
  async getLatestCommitEvent(pipelineId) {
    const method = 'get';
    const url = `/pipelines/${pipelineId}/latestCommitEvent`;

    return this.fetchFromApi(method, url);
  },

  /**
   * getUserSetting
   * @return {Promise}
   */
  async getUserSetting() {
    const method = 'get';
    const url = `/users/settings`;

    try {
      return await this.fetchFromApi(method, url);
    } catch (e) {
      return {};
    }
  },

  async updateUserSetting(settings) {
    const method = 'put';
    const url = `/users/settings`;

    const data = { settings };

    return this.fetchFromApi(method, url, data);
  },

  /**
   * deleteUserSettings
   * @return {Promise}
   */
  async deleteUserSettings() {
    const method = 'delete';
    const url = `/users/settings`;

    return this.fetchFromApi(method, url);
  },

  async searchPipelines(pipelineName) {
    const method = 'get';
    const query = $.param({
      page: 1,
      count: 50,
      sort: 'ascending',
      sortBy: 'name',
      search: pipelineName
    });

    const url = `/pipelines?${query}`;

    return this.fetchFromApi(method, url);
  },

  async updateCollection(collectionId, pipelineIds) {
    const method = 'put';
    const pipelineIdsEntries = pipelineIds.map(pipelineId => [
      'ids[]',
      pipelineId
    ]);
    const pipelineIdsQuery = new URLSearchParams(pipelineIdsEntries);
    const url = `/collections/${collectionId}/pipelines?${pipelineIdsQuery}`;

    return this.fetchFromApi(method, url);
  },

  async removePipeline(collectionId, pipelineId) {
    const method = 'delete';
    const url = `/collections/${collectionId}/pipelines?ids[]=${pipelineId}`;

    return this.fetchFromApi(method, url);
  },

  async removeMultiplePipelines(collectionId, pipelineIds) {
    const method = 'delete';
    const pipelineIdsEntries = pipelineIds.map(pipelineId => [
      'ids[]',
      pipelineId
    ]);
    const pipelineIdsQuery = new URLSearchParams(pipelineIdsEntries);

    const url = `/collections/${collectionId}/pipelines?${pipelineIdsQuery}`;

    return this.fetchFromApi(method, url);
  },

  /**
   * getTemplateDetails
   * @param {Number} templateId template id
   * @return {Promise} template details
   */
  async getTemplateDetails(templateId) {
    const method = 'get';
    const url = `/template/${templateId}`;

    return this.fetchFromApi(method, url);
  },

  async updateSonarBadge(pipelineId, name = '', uri = '') {
    const method = 'put';
    const url = `/pipelines/${pipelineId}`;

    const badges = {
      sonar: {
        name,
        uri
      }
    };

    const data = { badges };

    return this.fetchFromApi(method, url, data);
  },

  // GET /pipelines/{id}/stages
  async fetchStages(pipelineId) {
    const method = 'get';
    const url = `/pipelines/${pipelineId}/stages`;

    return this.fetchFromApi(method, url);
  },

  // GET /pipelines/{id}/jobs
  async fetchJobs(pipelineId) {
    const method = 'get';
    const url = `/pipelines/${pipelineId}/jobs`;

    return this.fetchFromApi(method, url);
  },

  // GET /banners
  async fetchBanners(scope, scopeId) {
    const method = 'get';
    const params = {
      isActive: true,
      scope
    };

    if (scopeId) {
      params.scopeId = scopeId;
    }

    const query = $.param(params);
    const url = `/banners?${query}`;

    return this.fetchFromApi(method, url);
  }
});
