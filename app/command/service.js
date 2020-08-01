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
    let params = { compact: true, sortBy: 'createTime' };

    if (namespace) {
      params.namespace = namespace;
    }

    return this.fetchData(url, params).then(commands => {
      let unique = {};

      let uniqueCommands = commands.filter(c => {
        let fullName = `${c.namespace}/${c.name}`;

        if (fullName in unique) {
          return false;
        }

        unique[fullName] = true;

        return true;
      });

      return uniqueCommands;
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
      $.ajax(ajaxConfig)
        .done(commands => {
          commands.forEach(command => {
            if (command.createTime) {
              // Add last updated time
              command.lastUpdated = getLastUpdatedTime({ createTime: command.createTime });
            }
          });

          return resolve(commands);
        })
        .fail(response => reject(response));
    });
  },
  deleteCommands(namespace, name) {
    const url =
      `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/commands/` +
      `${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`;
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
        .fail(response => {
          let message = `${response.status} Request Failed`;

          if (response && response.responseJSON && typeof response.responseJSON === 'object') {
            message = `${response.status} ${response.responseJSON.error}`;
          }

          if (response.status === 403) {
            message = 'You do not have the permissions to remove this command.';
          }

          return reject(message);
        });
    });
  },
  updateTrust(namespace, name, trusted) {
    const url =
      `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/commands/` +
      `${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/trusted`;
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
            message = 'You do not have the permissions to update this command.';
          }

          return reject(message);
        });
    });
  }
});
