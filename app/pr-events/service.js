import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service(),
  /**
   * Calls the events api and filters based on type prs
   * @method getPRevents
   * @param  {String}  pipelineId           id of pipeline
   * @param  {String}  eventPrUrl           url of PR
   * @return {Promise}                      Resolves to prCommit
   */
  getPRevents(pipelineId, eventPrUrl) {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}` +
    `/pipelines/${pipelineId}/events`;
    const prNum = eventPrUrl.split('/').pop();

    return new EmberPromise(resolve =>
      $.ajax({
        method: 'GET',
        url,
        data: {
          type: 'pr'
        },
        contentType: 'application/json',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          Authorization: `Bearer ${this.get('session').get('data.authenticated.token')}`
        }
      }).done((data) => {
        const prCommits = data.filter(curEvent =>
          curEvent.pr && curEvent.pr.url.split('/').pop() === prNum);

        resolve(prCommits);
      }).catch(() => resolve([]))
    );
  }
});
