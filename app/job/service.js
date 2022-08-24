import Service, { inject as service } from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';

export default Service.extend({
  store: service(),

  /**
   * Update the job state
   * @method setJobState
   * @param   {Number}  id                   Job id
   * @param   {String}  state                Job state to be changed ('ENABLED' or 'DISABLED')
   * @param   {String}  stateChangeMessage   Job state update message
   * @return  {Promise}                      Resolve nothing if success otherwise reject with error message
   */
  setJobState(id, state, stateChangeMessage) {
    const job = this.store.peekRecord('job', id);
    const originalState = job.get('state');
    const originalStateChangeMessage = job.get('stateChangeMessage');

    job.set('state', state);
    job.set('stateChangeMessage', stateChangeMessage);

    return new EmberPromise((resolve, reject) => {
      job
        .save()
        .then(() => resolve())
        .catch(error => {
          // Restore the original job state
          job.set('state', originalState);
          job.set('stateChangeMessage', originalStateChangeMessage);

          return reject(
            error.errors[0].detail || 'Could not change the job state.'
          );
        });
    });
  }
});
