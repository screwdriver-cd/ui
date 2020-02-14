import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import { get } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';
import templateHelper from 'screwdriver-ui/utils/template';

const { templatesFormatter } = templateHelper;

export default Service.extend({
  session: service(),
  getOneTemplate(name) {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${
      ENV.APP.SDAPI_NAMESPACE
    }/templates/${encodeURIComponent(name)}`;

    return this.fetchData(url).then(templatesFormatter);
  },
  getOneTemplateWithMetrics(name) {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${
      ENV.APP.SDAPI_NAMESPACE
    }/templates/${encodeURIComponent(name)}/metrics`;

    return this.fetchData(url).then(templatesFormatter);
  },
  getTemplateTags(namespace, name) {
    const fullName = `${namespace}/${name}`;
    const url =
      // eslint-disable-next-line max-len
      `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/templates/${encodeURIComponent(
        fullName
      )}/tags`;

    return this.fetchData(url);
  },
  getAllTemplates(namespace) {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/templates`;

    let params = { compact: true, sortBy: 'createTime', sort: 'descending' };

    if (namespace) {
      params.namespace = namespace;
    }

    return this.fetchData(url, params)
      .then(templatesFormatter)
      .then(templates => {
        // Reduce versions down to one entry
        // FIXME: This should be done in API

        const result = [];
        const names = {};

        templates.forEach(t => {
          if (!names[t.fullName]) {
            names[t.fullName] = 1;
            result.push(t);
          }
        });

        return result;
      });
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
      // Call the token api to get the session info
      $.ajax(ajaxConfig)
        .done(templates => resolve(templates))
        .fail(response => reject(response));
    });
  },
  deleteTemplates(name) {
    // eslint-disable-next-line max-len
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${
      ENV.APP.SDAPI_NAMESPACE
    }/templates/${encodeURIComponent(name)}`;
    const ajaxConfig = {
      method: 'DELETE',
      url,
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
      // Call the token api to get the session info
      $.ajax(ajaxConfig)
        .done(content => resolve(content))
        .fail(response => {
          let message = `${response.status} Request Failed`;

          if (response && response.responseJSON && typeof response.responseJSON === 'object') {
            message = `${response.status} ${response.responseJSON.error}`;
          }

          if (response.status === 403) {
            message = 'You do not have the permissions to remove this template.';
          }

          return reject(message);
        });
    });
  },
  updateTrust(fullName, trusted) {
    const url =
      `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/templates/` +
      `${encodeURIComponent(fullName)}/trusted`;
    const ajaxConfig = {
      method: 'PUT',
      dataType: 'json',
      url,
      contentType: 'application/json',
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      },
      headers: {
        Authorization: `Bearer ${get(this, 'session.data.authenticated.token')}`
      },
      data: JSON.stringify({ trusted })
    };

    return new EmberPromise((resolve, reject) => {
      $.ajax(ajaxConfig)
        .done(content => resolve(content))
        .fail(response => {
          let message = `${response.status} Request Failed`;

          if (response.status === 401 || response.status === 403) {
            message = 'You do not have the permissions to update this template.';
          }

          return reject(message);
        });
    });
  }
});
