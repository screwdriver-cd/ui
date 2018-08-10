import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import { get } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service('session'),
  getEvents({ page, count, pipelineId }) {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}` +
      `/pipelines/${pipelineId}/events`;
    let params = {};

    if (page || count) {
      params.page = page;
      params.count = count;
    }

    return this.fetchData(url, params);
  },
  fetchData(url, params = {}) {
    const ajaxConfig = {
      method: 'GET',
      url,
      data: params,
      contentType: 'application/json',
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      },
      headers: {
        Authorization: `Bearer ${get(this, 'session.data.authenticated.token')}`
      }
    };

    return new EmberPromise((resolve, reject) => {
      $.ajax(ajaxConfig)
        .done(events => resolve(events))
        .fail(response => reject(response));
    });
  }
});
