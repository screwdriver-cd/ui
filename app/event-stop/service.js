import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service('session'),

  /**
   * Stop all running builds or builds about to run in a single event
   * @method stopBuilds
   * @param   {Number}  eventId    ID of event
   * @return  {Promise}            Resolve nothing if success otherwise reject with error message
   */
  stopBuilds(eventId) {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${ENV.APP.SDAPI_NAMESPACE}/events/${eventId}/stop`;

    return new EmberPromise((resolve, reject) => {
      $.ajax({
        url,
        type: 'PUT',
        headers: {
          Authorization: `Bearer ${get(
            this,
            'session.data.authenticated.token'
          )}`
        }
      })
        .done(() => resolve())
        .fail((jqXHR) => reject(JSON.parse(jqXHR.responseText).message));
    });
  }
});
