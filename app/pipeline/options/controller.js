import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import Controller from '@ember/controller';

@classic
export default class OptionsController extends Controller {
  @service
  session;

  errorMessage = '';

  isSaving = false;

  @reads('model.pipeline')
  pipeline;

  @reads('model.jobs')
  jobs;

  @action
  setJobStatus(id, state, stateChangeMessage) {
    const job = this.store.peekRecord('job', id);

    job.set('state', state);
    job.set('stateChangeMessage', stateChangeMessage);
    job
      .save()
      .catch(error => this.set('errorMessage', error.errors[0].detail || ''));
  }

  @action
  removePipeline() {
    this.pipeline
      .destroyRecord()
      .then(() => {
        this.transitionToRoute('home');
      })
      .catch(error => this.set('errorMessage', error.errors[0].detail || ''));
  }

  @action
  updatePipeline({ scmUrl, rootDir }) {
    const { pipeline } = this;

    pipeline.setProperties({
      checkoutUrl: scmUrl,
      rootDir
    });

    this.set('isSaving', true);

    pipeline
      .save()
      .then(() => this.set('errorMessage', ''))
      .catch(err => {
        this.set('errorMessage', err.errors[0].detail || '');
      })
      .finally(() => {
        this.set('isSaving', false);
      });
  }
}
