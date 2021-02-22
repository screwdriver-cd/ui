import { computed } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';
import $ from 'jquery';

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

    let optionsType = method.toUpperCase();

    let requestType = method.toLowerCase();

    if (raw) {
      requestType = 'raw';
    }

    if (requestType === 'get') {
      requestType = 'request';
    }

    const uri = `${baseHost}${url}`;

    const options = Object.assign({}, this.ajaxOptions(), {
      data,
      type: optionsType
    });

    return this.get('ajax')[requestType](uri, options);
  },

  fetchFromApi(method = 'get', url, data, raw = false) {
    return this.fetchFrom('api', method, url, data, raw);
  },

  fetchFromStore(method = 'get', url, data, raw = false) {
    return this.fetchFrom('store', method, url, data, raw);
  },

  fetchLogs({ buildId, stepName, logNumber = 0, pageSize = 10, sortOrder = 'ascending' }) {
    const method = 'get';
    const url = `/builds/${buildId}/steps/${stepName}/logs`;
    const data = { from: logNumber, pages: pageSize, sort: sortOrder };
    const raw = true;

    return this.fetchFromApi(method, url, data, raw);
  },

  fetchAllTemplates() {
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
   * @param  {Number} pipelineId  Pipeline Id
   * @param  {Object} settings
   * @param  {Array}  settings.metricsDowntimeJobs Job Ids to caluclate downtime
   * @return {Promise}
   */
  async updatePipelineSettings(pipelineId, settings) {
    const method = 'put';
    const url = `/pipelines/${pipelineId}`;
    const { metricsDowntimeJobs = [] } = settings;

    const data = {
      settings: {
        metricsDowntimeJobs: metricsDowntimeJobs.map(job => job.id)
      }
    };

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
    const query = $.param({ downtimeJobs, downtimeStatuses, startTime, endTime });
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
   * get
   * @param  {Number} userId  user Id
   * @return {Promise}
   */
  async getUserSetting() {
    const method = 'get';
    // const userId = this.session.get('data.authenticated.username');
    const userId = 46;
    const url = `/users/${userId}/settings`;

    return this.fetchFromApi(method, url);
  },

  /**
   * updateUserSetting
   * @param  {Number}  [pipelineId]
   * @param  {Object}  pipelineSettings
   * @param  {Boolean} [pipelineSettings.showPRJobs]
   * @return {Promise}
   */
  async updateUserSetting(pipelineId, pipelineSettings) {
    const method = 'put';
    // const userId = this.session.get('data.authenticated.username');
    const userId = 46;
    const url = `/users/${userId}/settings`;
    const userSettings = await this.getUserSetting();
    const data = {
      ...userSettings,
      [pipelineId]: pipelineSettings
    };

    return this.fetchFromApi(method, url, data);
  },

  /**
   * getUserPreference
   * @param  {Number} userId  user Id
   * @return {Promise}
   */
  async getUserPreference(pipelineId) {
    let localPipelinePreference = await this.store.queryRecord('preference/pipeline', {
      filter: { pipelineId }
    });
    const remotePreferences = await this.getUserSetting();
    const remotePipelinePreference = remotePreferences[pipelineId];

    // local preference takes precedence
    if (localPipelinePreference) {
      if (localPipelinePreference.showPRJobs !== remotePipelinePreference.showPRJobs) {
        const localPipelinePreferenceSettings = localPipelinePreference.toJSON();

        delete localPipelinePreferenceSettings.pipelineId;

        remotePreferences[pipelineId] = localPipelinePreferenceSettings;

        // don't wait on updating remote preference finishes
        this.updateUserSetting(pipelineId, remotePipelinePreference);
      }

      return localPipelinePreference;
    }

    if (remotePipelinePreference) {
      // don't wait on creating local preference finishes
      this.store.createRecord('preference/pipeline', {
        pipelineId,
        ...remotePipelinePreference
      });

      return remotePipelinePreference;
    }

    // if neither remote nor local preference exists
    localPipelinePreference = this.store.createRecord('preference/pipeline', {
      pipelineId
    });
    const localPipelinePreferenceSettings = localPipelinePreference.toJSON();

    delete localPipelinePreferenceSettings.pipelineId;

    this.updateUserPreference(pipelineId, {
      localPipelinePreferenceSettings
    });

    return localPipelinePreference;
  },

  /**
   * updateUserPreference
   * @param  {Number}  [pipelineId]
   * @param  {Object}  pipelineSettings
   * @param  {Boolean} [pipelineSettings.showPRJobs]
   * @return {Promise}
   */
  async updateUserPreference(pipelineId, pipelineSettings) {
    const method = 'put';
    // const userId = this.session.get('data.authenticated.username');
    const userId = 46;
    const url = `/users/${userId}/settings`;
    const userSettings = await this.getUserSetting();
    const data = {
      ...userSettings,
      [pipelineId]: pipelineSettings
    };

    return this.fetchFromApi(method, url, data);
  }
});
