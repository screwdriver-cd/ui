import $ from 'jquery';
import { Promise as EmberPromise } from 'rsvp';
import Service, { inject as service } from '@ember/service';
import { get } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';

export default Service.extend({
  session: service('session'),

  /**
   * Get all downstream triggers for jobs in a pipeline
   * @method getDownstreamTriggers
   * @param   {Number}  pipelineId
   * @return  {Promise}            Resolve nothing if success otherwise reject with error message
   */
  getDownstreamTriggers(pipelineId) {
    const url = `${ENV.APP.SDAPI_HOSTNAME}/${
      ENV.APP.SDAPI_NAMESPACE
    }/pipelines/${pipelineId}/triggers`;

    // console.log('pipelineId: ', pipelineId);
    //
    // return new EmberPromise(resolve =>
    //   resolve([
    //     {
    //       jobName: 'main',
    //       triggers: ['~sd@7:main']
    //     },
    //     {
    //       jobName: 'promote',
    //       triggers: ['~sd@7:other', '~sd@7:other2']
    //     },
    //     {
    //       jobName: 'test',
    //       triggers: ['~sd@7:other2']
    //     }
    //   ])
    // );
    //

    return new EmberPromise((resolve, reject) => {
      $.ajax({
        url,
        type: 'GET',
        headers: {
          Authorization: `Bearer ${get(this, 'session.data.authenticated.token')}`
        }
      })
        .done(data => {
          console.log('data1: ', data);
          console.log('data2: ', typeof data);

          return resolve(data);
        })
        .fail(jqXHR => reject(JSON.parse(jqXHR.responseText).message));
    });
  }
});
