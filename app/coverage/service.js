import classic from 'ember-classic-decorator';
import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import { get } from '@ember/object';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

@classic
export default class CoverageService extends Service {
  @service
  session;

  /**
   * @param {Object} config
   * @param {Number} config.buildId     Build ID
   * @param {Number} config.jobId       Job ID
   * @param {String} config.startTime   Start time of the coverage step
   * @param {String} config.endTime     End time of the coverage step
   */
  getCoverageInfo(config) {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/coverage/info`;
    const ajaxConfig = {
      method: 'GET',
      url,
      data: config,
      contentType: 'application/json',
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      },
      headers: {
        Authorization: `Bearer ${get(this, 'session.data.authenticated.token')}`
      }
    };

    return new EmberPromise(resolve => {
      // Call the token api to get the session info
      $.ajax(ajaxConfig)
        .done(content =>
          resolve({
            coverage:
              content.coverage !== 'N/A' ? `${content.coverage}%` : 'N/A',
            coverageUrl: content.coverage !== 'N/A' ? content.projectUrl : '#',
            tests: content.tests,
            testsUrl: content.tests !== 'N/A' ? content.projectUrl : '#'
          })
        )
        .fail(() =>
          resolve({
            coverage: 'N/A',
            coverageUrl: '#',
            tests: 'N/A',
            testsUrl: '#'
          })
        );
    });
  }
}
