import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import { get } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';
import templateHelper from 'screwdriver-ui/utils/template';
const { getLastUpdatedTime } = templateHelper;

export default Service.extend({
  session: service(),
  getOneCommand(namespace, name) {
    const url =
      `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/commands/` +
      `${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;

    return this.fetchData(url);
  },
  getCommandTags(namespace, name) {
    const url =
      `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/commands/` +
      `${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/tags`;

    return this.fetchData(url);
  },
  getAllCommands(namespace) {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/commands`;
    let params = {};

    if (namespace) {
      params.namespace = namespace;
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
        .done((commands) => {
          commands.forEach((command) => {
            if (command.createTime) {
              // Add last updated time
              command.lastUpdated = getLastUpdatedTime({ createTime: command.createTime });
            }
          });

          return resolve(commands);
        })
        .fail((response) => {
          let message = `${response.status} Request Failed`;

          if (response && response.responseJSON && typeof response.responseJSON === 'object') {
            message = `${response.status} ${response.responseJSON.error}`;
          }

          return reject(message);
        });
    });
  },
  deleteCommands(namespace, name) {
    // eslint-disable-next-line max-len
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/commands/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;
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
      $.ajax(ajaxConfig)
        .done(content => resolve(content))
        .fail((response) => {
          let message = `${response.status} Request Failed`;

          if (response && response.responseJSON && typeof response.responseJSON === 'object') {
            message = `${response.status} ${response.responseJSON.error}`;
          }

          if (response.status === 401) {
            message = 'You do not have the permissions to remove this command.';
          }

          return reject(message);
        });
    });
  }
});
